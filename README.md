# Multi-entity debugger

Simple UI for displaying/updating data from multiple entities in a web browser.

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
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"id":"agent_1", "label":"Agent 1", "message":"hello world"}'
```

Via Python requests:

```python
import requests
import json
url = "http://localhost:8000/send-message/"
headers = {
    "Content-Type": "application/json"
}
data = {
    "id": "agent_1",
    "label": "Agent 1",
    "message": "hello world"
}
response = requests.post(url, headers=headers, data=json.dumps(data))
```

## Message format

Required fields:

 * `id`: The ID of the entity
 * `label`: A human-readable label for the entity

Optional fields:

 * `timestamp`: Timestamp of the message -- if not supplied, defaults to time the message was received by the debugger

All fields besides `id` and `label` will be displayed in the `Messages` output section for that entity.
