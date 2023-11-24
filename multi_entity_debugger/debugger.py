import os
import sys
import uuid
import threading
import logging
import argparse
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from starlette.websockets import WebSocketDisconnect
import asyncio
import queue
import websockets
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000

logger = logging.getLogger(__name__)


class Message(BaseModel):
    name: str
    label: str
    timestamp: Optional[str] = None

    class Config:
        extra = "allow"


class WebSocketManager:
    def __init__(self, queue):
        self.active_connections = {}
        self.queue = queue

    async def connect(self, websocket: WebSocket):
        connection_id = str(uuid.uuid4())
        self.active_connections[connection_id] = websocket
        logger.debug(f"WebSocket connected: {connection_id}")
        await websocket.accept()
        return connection_id

    def disconnect(self, connection_id: str):
        websocket = self.active_connections.get(connection_id)
        if websocket:
            logger.debug(f"WebSocket disconnected: {connection_id}")
            self.active_connections.pop(connection_id)

    async def broadcast(self, message: str):
        for id, connection in self.active_connections.items():
            try:
                logger.debug(f"Sending message to connection: {id}")
                await connection.send_text(message)
            except websockets.exceptions.ConnectionClosedOK:
                logger.debug(f"Connection closed, no message sent: {id}")
                self.disconnect(id)
            except Exception as e:
                logging.error(f"Error sending message: {e}")

    async def run(self):
        logger.info("WebSocketManager running")
        while True:
            message = self.queue.get()
            if message is not None:
                logger.debug(f"Broadcasting message in queue: {message}")
                await self.broadcast(message.model_dump_json())


class MultiEntityDebugger:
    def __init__(self,
                 host: str = DEFAULT_HOST,
                 port: int = DEFAULT_PORT,
                 custom_queue: queue.Queue = None,
                 ):
        self.app = FastAPI()
        self.host = host
        self.port = port
        self.queue = custom_queue if custom_queue else queue.Queue()
        self.manager = WebSocketManager(self.queue)
        self.package_root = self.get_package_root()
        self.setup_routes()

    def get_package_root(self):
        package_name = self.__class__.__module__.split(".")[0]
        package_root = os.path.dirname(os.path.abspath(sys.modules[package_name].__file__))
        return package_root

    def setup_routes(self):
        self.app.mount("/static", StaticFiles(directory=f"{self.package_root}/static"), name="static")

        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            logger.debug("New WebSocket connection")
            connection_id = await self.manager.connect(websocket)
            try:
                while True:
                    await websocket.receive_text()
            except WebSocketDisconnect:
                logger.debug(f"WebSocket disconnected: {websocket}")
                self.manager.disconnect(connection_id)
            except Exception as e:
                logging.error(f"Error in WebSocket: {e}")
            finally:
                logger.debug(f"Closing WebSocket connection: {connection_id}")
                self.manager.disconnect(connection_id)

        @self.app.post("/send-message/")
        async def send_message(data: Message):
            logger.debug(f"Received message via POST: {data}")
            self.add_message_to_queue(data)
            return {"message": "Message received"}

        @self.app.get("/")
        async def get():
            with open(f"{self.package_root}/index.html", 'r') as f:
                return HTMLResponse(f.read())

    def add_message_to_queue(self, data):
        if data.timestamp is None:
            data.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        logger.debug(f"Adding message to queue: {data}")
        self.manager.queue.put(data)

    def run(self):
        logging.debug("Running MultiEntityDebugger")
        uvicorn.run(self.app, host=self.host, port=8000)

    async def run_manager(self):
        logging.debug("Running WebSocketManager")
        await self.manager.run()

    def start(self):
        logging.info("Starting Multi-entity debugger")
        manager_thread = threading.Thread(target=asyncio.run, args=(self.run_manager(),), daemon=True)
        manager_thread.start()

        server_thread = threading.Thread(target=self.run, daemon=True)
        server_thread.start()

        try:
            # Keep the script running by joining the threads
            manager_thread.join()
            server_thread.join()
        except KeyboardInterrupt:
            logging.info("Caught KeyboardInterrupt, terminating threads.")
            sys.exit()


def main():
    parser = argparse.ArgumentParser(description="Run the Multi-entity debugger.")
    parser.add_argument("--host", type=str, default=DEFAULT_HOST, help="Host for the server to listen on. (default: %(default)s)")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port for the server to listen on. (default: %(default)s)")
    parser.add_argument("-d", "--debug", action="store_true", help="Run the server in debug mode. (default: %(default)s)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.debug else logging.INFO)
    debugger = MultiEntityDebugger(host=args.host, port=args.port)
    debugger.start()


if __name__ == "__main__":
    main()
