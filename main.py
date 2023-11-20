import sys
import threading
import logging
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
                # You can log other exceptions if needed
                logging.error(f"Error sending message: {e}")

    async def run(self):
        logger.info("WebSocketManager running")
        while True:
            message = self.queue.get()
            logger.info(f"Message in queue: {message}")
            if message is not None:
                await self.broadcast(message.model_dump_json())


logging.basicConfig(level=logging.INFO)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
manager = WebSocketManager(queue.Queue())


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(1)
    except Exception as e:
        logging.error(f"Error in WebSocket: {e}")
    finally:
        manager.disconnect(websocket)


@app.post("/send-message/")
async def send_message(data: Message):
    logger.debug(f"Received message via POST: {data}")
    add_message_to_queue(data)
    return {"message": "Message received"}


@app.get("/")
async def get():
    with open('index.html', 'r') as f:
        return HTMLResponse(f.read())


def add_message_to_queue(data):
    if data.timestamp is None:
        data.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.debug(f"Adding message to queue: {data}")
    manager.queue.put(data)


def run_manager():
    asyncio.run(manager.run())


def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    manager_thread = threading.Thread(target=run_manager, daemon=True)
    manager_thread.start()

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    try:
        # Keep the script running by joining the threads
        manager_thread.join()
        server_thread.join()
    except KeyboardInterrupt:
        print("Caught KeyboardInterrupt, terminating threads.")
        sys.exit()
