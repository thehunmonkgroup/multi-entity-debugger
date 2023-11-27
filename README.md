# Multi-entity debugger

Simple web browser UI for displaying/updating data from multiple entities.

<img src="https://github.com/thehunmonkgroup/multi-entity-debugger/assets/43772/7518c477-bf7d-45d5-a6d5-78bf19db4905" alt="Interface" />

## Features

* Groups messages by entity for easy organization and reference
* Displays messages for each entity in chronological order for clear historical context
* Facilitates quick navigation between entities with:
    * Single-click access
    * Keyboard shortcuts for power users
* Provides a straightforward interface for sending messages to the debugger
* Built-in class to easily add a custom logging handler to Python's logging framework

## Installation

### Package install

```sh
pip install git+https://github.com/thehunmonkgroup/multi-entity-debugger
```

### Development install

```sh
git clone https://github.com/thehunmonkgroup/multi-entity-debugger.git
cd multi-entity-debugger
pip install -e .
```

## Usage

### Starting and Stopping the Server

To start the server with default options:

```sh
multi-entity-debugger
```

For command line options and help:

```sh
multi-entity-debugger --help
```

To stop the server, use `Ctrl+C`.

### Viewing Messages in the Browser

Access the debugger interface at [http://127.0.0.1:8000](http://127.0.0.1:8000) by default. This can be customized.

When messages from a new entity are received, a link for that entity will be displayed.

Messages for existing entities are dynamically updated.

*Note: The interface does not persist messages between browser sessions. Reloading the browser will clear all displayed entities and messages.*

#### Navigation

- Click on an entity to view its messages in chronological order.
- Use `Up Arrow` / `Down Arrow` and `Page Up` / `Page Down` to scroll through messages.
- Navigate between entities using `Right Arrow` / `Tab` for the next entity and `Left Arrow` / `Shift+Tab` for the previous one.
- Directly jump to an entity using number keys `1-9`.

### Message Format

Messages must include:

 * `name`: The unique identifier for the entity
 * `label`: A human-friendly name for the entity

Optional:

 * `timestamp`: The time the message was sent. If omitted, the time of receipt is used.
 * Additional key/value pairs for extra data

Fields other than `id`/`name`/`label` will appear in the `Messages` section for the entity.

### Sending Messages to the Debugger


#### Example messages

The included [generate-example-messages.sh](generate-example-messages.sh) script will provide
a list of example messages for two entities, and includes examples of how messages with the
`log_level` key will be color-coded according the log level:

```sh
./generate-example-messages.sh
```

#### Via HTTP POST

Send a JSON payload to `http://localhost:8000/send-message/` using tools like cURL or HTTP libraries in various programming languages.

Example with cURL:

```sh
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1", "label":"Agent 1", "message":"hello world"}'
```

Example with Python requests:

```python
import requests
DEBUG_ENDPOINT = "http://localhost:8000/send-message/"
# Assume 'Entity' is a class defined in your application.
def send_message(entity: Entity, message: str, **kwargs):
    data = {
        "name": entity.id,
        "label": entity.name,
        "message": message,
    }
    data.update(kwargs)  # Include any additional data.
    try:
        requests.post(DEBUG_ENDPOINT, json=data)
    except requests.exceptions.RequestException as e:
        # If the debugger isn't running, ignore the POST failure.
        pass

send_message(some_entity, "some message", extra_attribute="value")
```

#### As a Python Module

The debugger can be directly used in your Python code as a module.

Example:

```python
import time
import threading
from multi_entity_debugger.debugger import MultiEntityDebugger, Message

debugger = MultiEntityDebugger()

def start_debugger():
    debugger.start()

t = threading.Thread(target=start_debugger, daemon=True)
t.start()

# Example loop to send messages
message_count = 1
while True:
    time.sleep(1)
    print(f"Sending message {message_count}")
    message_data = Message(name='entity_1', label='Entity 1', message=f'Message {message_count}')
    debugger.add_message_to_queue(message_data)
    message_count += 1
```

## Logger Integration

Integrate with Python's `logging` module using the provided custom logging handler.

Example:

```python
import logging
from multi_entity_debugger.logger_handler import HTTPDebuggerHandler

LOG_FORMAT = "%(name)s - %(levelname)s - %(message)s"

class DebugLogger:
    def __new__(cls, entity_name, entity_label=None):
        entity_label = entity_label or entity_name
        logger = logging.getLogger(entity_name)
        if not logger.hasHandlers():  # Check for existing handlers
            logger.setLevel(logging.DEBUG)
            # Console logging
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(logging.Formatter(LOG_FORMAT))
            console_handler.setLevel(logging.DEBUG)
            logger.addHandler(console_handler)
            # Multi-entity debugger logging
            debugger_handler = HTTPDebuggerHandler(entity_name, entity_label)
            debugger_handler.setLevel(logging.DEBUG)
            logger.addHandler(debugger_handler)
        return logger

logger = DebugLogger('entity-1', 'Entity 1')
logger.debug("test message")  # Basic log
logger.info("test message with extra data", extra={'key1': 'value1', 'key2': 'value2'})  # Log with extra data
```

When the logger handler is used, message backgrounds will be color coded according to their log level.
