import sys
import threading
import logging
import argparse
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
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
    id: str
    label: str
    timestamp: Optional[str] = None

    class Config:
        extra = "allow"


class WebSocketManager:
    def __init__(self, queue):
        self.active_connections = []
        self.queue = queue

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except websockets.exceptions.ConnectionClosedOK:
                self.active_connections.remove(connection)
            except Exception as e:
                logging.error(f"Error sending message: {e}")

    async def run(self):
        logger.info("WebSocketManager running")
        while True:
            message = self.queue.get()
            if message is not None:
                logger.debug(f"Broadcasting message in queue: {message}")
                await self.broadcast(message.model_dump_json())


class FastAPIWebSocketApp:
    def __init__(self,
                 host: str,
                 port: int,
                 custom_queue: queue.Queue = None,
                 ):
        self.app = FastAPI()
        self.host = host
        self.port = port
        self.queue = custom_queue if custom_queue else queue.Queue()
        self.manager = WebSocketManager(self.queue)
        self.setup_routes()

    def setup_routes(self):
        self.app.mount("/static", StaticFiles(directory="static"), name="static")

        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            logger.debug(f"New WebSocket connection: {websocket}")
            await self.manager.connect(websocket)
            try:
                while True:
                    await asyncio.sleep(1)
            except Exception as e:
                logging.error(f"Error in WebSocket: {e}")
            finally:
                logger.debug(f"Closing WebSocket connection: {websocket}")
                self.manager.disconnect(websocket)

        @self.app.post("/send-message/")
        async def send_message(data: Message):
            logger.debug(f"Received message via POST: {data}")
            self.add_message_to_queue(data)
            return {"message": "Message received"}

        @self.app.get("/")
        async def get():
            with open('index.html', 'r') as f:
                return HTMLResponse(f.read())

    def add_message_to_queue(self, data):
        if data.timestamp is None:
            data.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        logger.debug(f"Adding message to queue: {data}")
        self.manager.queue.put(data)

    def run(self):
        logging.debug("Running FastAPIWebSocketApp")
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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Multi-entity debugger.")
    parser.add_argument("--host", type=str, default=DEFAULT_HOST, help="Host for the server to listen on. (default: %(default)s)")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port for the server to listen on. (default: %(default)s)")
    parser.add_argument("-d", "--debug", action="store_true", help="Run the server in debug mode. (default: %(default)s)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.debug else logging.INFO)
    fastapi_app = FastAPIWebSocketApp(host=args.host, port=args.port)
    fastapi_app.start()
