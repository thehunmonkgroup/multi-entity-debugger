# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installation
```bash
# Development install
pip install -e .

# Install from git
pip install git+https://github.com/thehunmonkgroup/multi-entity-debugger
```

### Running the Application
```bash
# Start server with default settings (127.0.0.1:8000)
multi-entity-debugger

# Start with custom host/port
multi-entity-debugger --host 0.0.0.0 --port 8080

# Enable debug logging
multi-entity-debugger --debug
```

### Testing and Development
```bash
# Generate test messages for development
python test_message_generator.py batch --entities 3 --messages 5

# Continuous message generation for real-time testing
python test_message_generator.py continuous --entities 2 --interval 1.0

# Run predefined test scenarios (search, filter, activity tests)
python test_message_generator.py scenarios

# Send single test message via curl
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"test_entity", "label":"Test Entity", "message":"hello world", "log_level":"INFO"}'
```

## Architecture Overview

This is a real-time web-based debugging tool built with FastAPI, WebSockets, and Python's logging framework. The application displays messages from multiple entities in a browser interface with real-time updates.

### Core Components

**MultiEntityDebugger** (`multi_entity_debugger/debugger.py:72-150`): Main application class that orchestrates the FastAPI server, WebSocket management, and message queuing. Uses threading to run both the HTTP server and WebSocket manager concurrently.

**WebSocketManager** (`multi_entity_debugger/debugger.py:34-70`): Handles WebSocket connections and broadcasts messages to all connected clients. Manages connection lifecycle and error handling for dropped connections.

**HTTPDebuggerHandler** (`multi_entity_debugger/logger_handler.py:10-32`): Custom Python logging handler that sends log records to the debugger via HTTP POST. Integrates seamlessly with Python's standard logging framework.

**Message Model** (`multi_entity_debugger/debugger.py:25-32`): Pydantic model with flexible schema allowing arbitrary additional fields beyond the required `name` and `label`.

### Message Flow

1. Messages arrive via HTTP POST to `/send-message/` or through the logging handler
2. Messages are timestamped and added to a thread-safe queue
3. WebSocketManager continuously processes the queue and broadcasts to connected clients
4. Browser clients receive real-time updates via WebSocket connection

### Key Features

- **Entity Grouping**: Messages are organized by entity `name` with human-friendly `label`
- **Real-time Updates**: WebSocket-based live message streaming
- **Log Level Color Coding**: Messages with `log_level` field get visual color coding
- **Keyboard Navigation**: Arrow keys and number keys for entity navigation
- **Flexible Schema**: Additional key/value pairs beyond core fields are displayed

### Frontend Architecture

The web interface uses Backbone.js with Marionette.js for MVC structure and jQuery for DOM manipulation:

**Main Layout** (`websocket.js:4-10`): Marionette Application with regions for entities and messages, managing the overall UI structure and WebSocket connection.

**Entity Management**:
- `EntitiesView`: Collection view managing entity list with activity indicators
- `EntityView`: Individual entity rendering with click handlers and styling
- Per-entity state tracking for filters, auto-scroll, and statistics

**Message Display**:
- `MessagesView`: Collection view with filtering, search, and auto-scroll functionality
- `MessageView`: Individual message rendering with log level styling
- Real-time filtering and per-entity memory of filter states

**UI Features**:
- **Custom Log Level Filter**: Tag-based multi-select replacing native `<select multiple>`
- **Keyboard Navigation**: Global shortcuts with input focus detection
- **Theme Management**: CSS custom properties with localStorage persistence
- **Auto-scroll**: Per-entity scrolling with manual control and position detection

**CSS Architecture**:
- **Scrollable Layout**: `#messages` container has `max-height: 70vh` and `overflow-y: auto` for proper scrolling
- **Dark Mode**: CSS custom properties (`--bg-primary`, `--text-primary`, etc.) for theme switching
- **Log Level Styling**: Color-coded message backgrounds and tag components matching log levels
- **Responsive Design**: Flexible layouts that adapt to different viewport sizes

## Message Format

Required fields:
- `name`: Unique entity identifier
- `label`: Human-readable entity name

Optional fields:
- `timestamp`: Message timestamp (auto-generated if omitted)
- `log_level`: Enables color coding (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Any additional key/value pairs for custom data
