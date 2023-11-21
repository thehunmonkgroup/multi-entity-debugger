# Multi-entity debugger

Simple UI for displaying/updating data from multiple entities in a web browser.

<img src="https://github.com/thehunmonkgroup/multi-entity-debugger/assets/43772/553f564a-3b7e-40d9-8399-fad65ac24853" alt="Interface" align="right" />

## Installation

Install package:

```sh
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

When a message is added for a new entity, a link will appear for that entity. Clicking the link will display all messages in order for that entity.

New messages are added dynamically to existing entities.

*NOTE: The interface does not save messages between browser reloads -- a reload of the browser will reset all displayed entities/messages.*

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

## Message format

Required fields:

 * `name`: The machine name of the entity
 * `label`: A human-readable label for the entity

Optional fields:

 * `timestamp`: Timestamp of the message -- if not supplied, defaults to time the message was received by the debugger

All fields besides `name` and `label` will be displayed in the `Messages` output section for that entity.
