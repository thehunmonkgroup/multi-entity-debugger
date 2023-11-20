# HAAS Debug UI

Simple UI for displaying data from HAAS agents

## Installation

Install requirements:

```sh
pip install -r requirements.txt
```

## Usage

Run the server:

```sh
python main.py
```

`POST` JSON to `http://localhost:8000/send-message/`

```sh
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"message":"hello world", "agent":"agent 1"}'
```

Required fields are:

 * `agent`: The name of the agent
 * `message`: The agent message
