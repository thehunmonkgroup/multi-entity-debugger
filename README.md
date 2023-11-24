# Multi-entity debugger

Simple web browser UI for displaying/updating data from multiple entities.

<img src="https://github.com/thehunmonkgroup/multi-entity-debugger/assets/43772/553f564a-3b7e-40d9-8399-fad65ac24853" alt="Interface" />


## Features

* Groups messages by entity *(an entity can be any sensible unit)*
* Lists messages received for each entity in chronological order
* Easy navigation between entities
    * Single click
    * Keyboard shortcuts
* Simple mechanisms for sending message data to the debugger


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

### Run the server

Start with default options:

```sh
multi-entity-debugger
```

Command line help:

```sh
multi-entity-debugger -h
```

### Stop the server

Hit `Ctrl+c`.

### View messages in the browser

Visit [http://127.0.0.1:8000](http://127.0.0.1:8000) *(default, can be customized)*.

When a message is added for a new entity, a link will appear for that entity.

New messages are added dynamically to existing entities.

See [Navigation](#navigation) for how to quickly view information.

*NOTE: The interface does not save messages between browser reloads -- a reload of the browser will reset all displayed entities/messages.*

#### Navigation

Clicking on an entity will show the message list for the entity, in chronological order.

`Up Arrow` / `Down Arrow` and `Page Up` / `Page Down` can be used for scrolling the message list.

`Right Arrow` / `Tab` will switch to the next entity, `Left Arrow` / `Shift+Tab` will switch to the previous entity.

Number keys `1-9` can be used to navigate directly to an entity in the list.

### Message format

Required fields:

 * `name`: The machine name of the entity
 * `label`: A human-readable label for the entity

Optional fields:

 * `timestamp`: Timestamp of the message -- if not supplied, defaults to time the message was received by the debugger
 * Any other key/value pairs

All fields besides `id`/`name`/`label` will be displayed in the `Messages` output section for that entity.

### Add messages for an entity

#### POST interface

`POST` JSON to `http://localhost:8000/send-message/`

Via cURL:

```sh
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1", "label":"Agent 1", "message":"hello world"}'
```

Via Python requests:

```python
import requests
DEBUG_ENDPOINT = "http://localhost:8000/send-message/"
# Entity is some class you've defined elsewhere.
def send_message(entity: Entity, message: str, **kwargs):
    data = {
        "name": entity.id,
        "label": entity.name,
        "message": message,
    }
    # Arbitrary args will be included in the message data.
    data.update(kwargs)
    try:
        requests.post(DEBUG_ENDPOINT, json=data)
    except requests.exceptions.RequestException as e:
        # Allows POST to silently fail if the debugger is not running.
        pass

send_message(some_entity, "some message", extra_attribute="value")
```

#### Module interface

The debugger can also be used as a module:

```python
import time
import threading
from multi_entity_debugger.debugger import MultiEntityDebugger, Message
debugger = MultiEntityDebugger()
def start_debugger():
    debugger.start()
thread = threading.Thread(target=start_debugger, daemon=True)
thread.start()
count = 1
while True:
    time.sleep(1)
    print(f"Sending message {count}")
    data = Message(name='entity_1', label='Entity 1', message=f'Message {count}')
    debugger.add_message_to_queue(data)
    count += 1
```


## Logger integration

A custom logging handler is provided for easy integration with existing solutions that use Python's `logging` module:

```python
import logging
from multi_entity_debugger.logger_handler import HTTPDebuggerHandler

LOG_FORMAT = "%(name)s - %(levelname)s - %(message)s"

class DebugLogger:
    def __new__(cls, entity_name, entity_label=None):
        entity_label = entity_label or entity_name
        logger = logging.getLogger(entity_name)
        # Prevent duplicate loggers.
        if logger.hasHandlers():
            return logger
        logger.setLevel(logging.DEBUG)
        # Log to console.
        log_console_handler = logging.StreamHandler()
        log_console_handler.setFormatter(logging.Formatter(LOG_FORMAT))
        log_console_handler.setLevel(logging.DEBUG)
        logger.addHandler(log_console_handler)
        # Also send log messages to the Multi-entity debugger
        http_debugger_handler = HTTPDebuggerHandler(entity_name, entity_label)
        http_debugger_handler.setLevel(logging.DEBUG)
        logger.addHandler(http_debugger_handler)
        return logger

logger = DebugLogger('entity-1', 'Entity 1')
# Includes  log_level, message, timestamp.
log.info("test message")
# Any key/value pairs passed in the 'extra' argument to the logger will be included
# in the output to the debugger.
log.info("test message with extra data", extra={'thing_1': 'a thing', 'thing_2': 'another thing'})
```
