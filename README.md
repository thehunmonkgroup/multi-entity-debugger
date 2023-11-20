# Multi-entity debugger

Simple UI for displaying/updating data from multiple entities in a web browser.

## Installation

Install requirements:

```sh
pip install -r requirements.txt
```

## Usage

### Run the server

```sh
python main.py
```

### Add messages for an entity

`POST` JSON to `http://localhost:8000/send-message/`

```sh
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"id":"agent_1", "label":"Agent 1", "message":"hello world"}'
```

## Message format

Required fields:

 * `id`: The ID of the entity
 * `label`: A human-readable label for the entity

Optional fields:

 * `timestamp`: Timestamp of the message -- if not supplied, defaults to time the message was received by the debugger

All fields besides `id` and `label` will be displayed in the `Messages` output section for that entity.
