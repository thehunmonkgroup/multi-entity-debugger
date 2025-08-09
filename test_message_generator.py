#!/usr/bin/env python3
"""
Advanced test message generator for multi-entity-debugger.

Features:
- Multiple entities with configurable count
- Various message patterns (burst, steady, random)
- All log levels with realistic messages
- Complex data structures for testing search/filtering
- Rate control for testing activity indicators
- Batch and continuous modes
"""

import argparse
import asyncio
import json
import random
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import requests

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000

class MessageGenerator:
    def __init__(self, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT):
        self.base_url = f"http://{host}:{port}/send-message/"
        self.session = requests.Session()
        
        self.log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        
        self.message_templates = {
            "DEBUG": [
                "Sensor reading: {value}",
                "Cache hit rate: {percentage}%",
                "Memory usage: {memory}MB",
                "Processing batch {batch_id}",
                "Heartbeat received from {source}",
            ],
            "INFO": [
                "Task {task_id} completed successfully",
                "Connection established to {endpoint}",
                "Data synchronization finished",
                "User {user} logged in",
                "Processing {count} items",
            ],
            "WARNING": [
                "High CPU usage: {percentage}%",
                "Low disk space: {space}GB remaining",
                "Connection timeout to {service}",
                "Queue size approaching limit: {size}",
                "Response time elevated: {time}ms",
            ],
            "ERROR": [
                "Failed to connect to {service}",
                "Database query failed: {query}",
                "Authentication failed for {user}",
                "File not found: {filename}",
                "Network timeout after {seconds}s",
            ],
            "CRITICAL": [
                "System failure: {component}",
                "Database connection lost",
                "Emergency shutdown initiated",
                "Security breach detected",
                "Unrecoverable error in {module}",
            ]
        }
        
        self.sample_data = {
            "services": ["database", "cache", "api-gateway", "auth-service", "file-store"],
            "users": ["admin", "user123", "system", "operator", "guest"],
            "components": ["cpu", "memory", "network", "storage", "scheduler"],
            "endpoints": ["api.example.com", "db.internal", "cache.local", "auth.service"],
            "modules": ["core", "handler", "processor", "validator", "controller"]
        }

    def generate_entity_name(self, index: int, entity_type: str = "agent") -> tuple:
        name = f"{entity_type}_{index:03d}"
        label = f"{entity_type.title()} {index:03d}"
        return name, label

    def generate_realistic_data(self, log_level: str) -> dict:
        data = {
            "timestamp": datetime.now().isoformat(),
            "thread_id": random.randint(1000, 9999),
            "process_id": random.randint(100, 999),
        }
        
        if log_level in ["WARNING", "ERROR", "CRITICAL"]:
            data["error_code"] = random.randint(1000, 9999)
            data["stack_trace"] = ["line1", "line2", "line3"]
        
        if log_level == "DEBUG":
            data["debug_info"] = {
                "memory_usage": f"{random.randint(100, 1000)}MB",
                "cpu_usage": f"{random.randint(1, 100)}%",
                "active_connections": random.randint(1, 50)
            }
        
        return data

    def generate_message(self, entity_name: str, entity_label: str, 
                        log_level: Optional[str] = None) -> dict:
        if log_level is None:
            log_level = random.choice(self.log_levels)
        
        template = random.choice(self.message_templates[log_level])
        
        # Fill template with random data
        message = template.format(
            value=random.randint(1, 100),
            percentage=random.randint(1, 100),
            memory=random.randint(100, 2000),
            batch_id=f"B{random.randint(1000, 9999)}",
            source=random.choice(self.sample_data["services"]),
            task_id=f"T{random.randint(100, 999)}",
            endpoint=random.choice(self.sample_data["endpoints"]),
            user=random.choice(self.sample_data["users"]),
            count=random.randint(10, 1000),
            space=random.randint(1, 100),
            service=random.choice(self.sample_data["services"]),
            size=random.randint(100, 1000),
            time=random.randint(100, 5000),
            query="SELECT * FROM users",
            filename=f"file_{random.randint(1, 999)}.txt",
            seconds=random.randint(5, 30),
            component=random.choice(self.sample_data["components"]),
            module=random.choice(self.sample_data["modules"])
        )
        
        payload = {
            "name": entity_name,
            "label": entity_label,
            "message": message,
            "log_level": log_level,
        }
        
        # Add extra data for testing search/filtering
        extra_data = self.generate_realistic_data(log_level)
        payload.update(extra_data)
        
        return payload

    def send_message(self, payload: dict) -> bool:
        try:
            response = self.session.post(self.base_url, json=payload, timeout=5)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"Failed to send message: {e}")
            return False

    def send_batch(self, entity_count: int = 3, messages_per_entity: int = 5,
                   entity_type: str = "agent", log_level: Optional[str] = None):
        """Send a batch of messages across multiple entities."""
        print(f"Sending {messages_per_entity} messages to {entity_count} entities...")
        
        for i in range(1, entity_count + 1):
            name, label = self.generate_entity_name(i, entity_type)
            print(f"  Sending to {label}...")
            
            for j in range(messages_per_entity):
                payload = self.generate_message(name, label, log_level)
                if self.send_message(payload):
                    print(f"    ✓ Message {j+1}/{messages_per_entity}")
                else:
                    print(f"    ✗ Failed message {j+1}/{messages_per_entity}")
                
                # Small delay to test activity rates
                if messages_per_entity > 1:
                    time.sleep(0.1)

    def send_continuous(self, entity_count: int = 3, interval: float = 2.0,
                       entity_type: str = "agent", pattern: str = "random"):
        """Send messages continuously to test real-time features."""
        print(f"Starting continuous mode: {entity_count} entities, {interval}s interval")
        print("Press Ctrl+C to stop")
        
        entities = [(self.generate_entity_name(i, entity_type)) 
                   for i in range(1, entity_count + 1)]
        
        try:
            while True:
                if pattern == "burst":
                    # Send multiple messages from one entity
                    name, label = random.choice(entities)
                    count = random.randint(2, 5)
                    for _ in range(count):
                        payload = self.generate_message(name, label)
                        self.send_message(payload)
                        time.sleep(0.1)
                elif pattern == "round-robin":
                    # Cycle through entities
                    for name, label in entities:
                        payload = self.generate_message(name, label)
                        self.send_message(payload)
                        time.sleep(interval / len(entities))
                else:  # random
                    name, label = random.choice(entities)
                    payload = self.generate_message(name, label)
                    self.send_message(payload)
                
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\nStopping continuous mode...")

    def send_test_scenarios(self):
        """Send predefined test scenarios for feature testing."""
        scenarios = [
            ("Search Test", self.test_search_functionality),
            ("Filter Test", self.test_filter_functionality), 
            ("Activity Test", self.test_activity_rates),
            ("Mixed Data Test", self.test_complex_data),
        ]
        
        for name, test_func in scenarios:
            print(f"\n=== {name} ===")
            test_func()
            print("Waiting 3 seconds...")
            time.sleep(3)

    def test_search_functionality(self):
        """Generate messages designed to test search functionality."""
        test_data = [
            ("search_test", "Search Test Entity", "CRITICAL", "Database connection failed"),
            ("search_test", "Search Test Entity", "INFO", "User authentication successful"),
            ("search_test", "Search Test Entity", "DEBUG", "Cache miss for key: user_session_12345"),
            ("search_test", "Search Test Entity", "WARNING", "High memory usage detected: 85%"),
        ]
        
        for name, label, level, message in test_data:
            payload = {
                "name": name,
                "label": label,
                "log_level": level,
                "message": message,
                "search_test_field": "searchable_content",
                "numeric_value": random.randint(1, 100)
            }
            self.send_message(payload)

    def test_filter_functionality(self):
        """Generate messages with all log levels for filter testing."""
        for level in self.log_levels:
            payload = self.generate_message("filter_test", "Filter Test Entity", level)
            self.send_message(payload)

    def test_activity_rates(self):
        """Generate high-frequency messages to test activity indicators."""
        name, label = "activity_test", "Activity Test Entity"
        
        # High activity burst
        for i in range(10):
            payload = self.generate_message(name, label, "INFO")
            payload["message"] = f"High activity message {i+1}"
            self.send_message(payload)
            time.sleep(0.2)  # 5 msgs/second

    def test_complex_data(self):
        """Generate messages with complex nested data structures."""
        complex_payload = {
            "name": "complex_test",
            "label": "Complex Data Test",
            "message": "Complex data structure test",
            "log_level": "INFO",
            "nested_object": {
                "level1": {
                    "level2": {
                        "array": [1, 2, 3, "test"],
                        "boolean": True,
                        "null_value": None
                    }
                }
            },
            "array_of_objects": [
                {"id": 1, "name": "item1"},
                {"id": 2, "name": "item2"}
            ],
            "metrics": {
                "cpu": 75.5,
                "memory": 1024,
                "network_io": {"in": 1000, "out": 2000}
            }
        }
        self.send_message(complex_payload)

def main():
    parser = argparse.ArgumentParser(
        description="Advanced test message generator for multi-entity-debugger",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s batch --entities 5 --messages 3
  %(prog)s continuous --entities 3 --interval 1.5 --pattern burst
  %(prog)s scenarios
  %(prog)s batch --log-level ERROR --entity-type sensor
        """
    )
    
    parser.add_argument("--host", default=DEFAULT_HOST,
                       help=f"Debugger host (default: {DEFAULT_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT,
                       help=f"Debugger port (default: {DEFAULT_PORT})")
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Batch command
    batch_parser = subparsers.add_parser("batch", help="Send a batch of messages")
    batch_parser.add_argument("--entities", type=int, default=3,
                             help="Number of entities (default: 3)")
    batch_parser.add_argument("--messages", type=int, default=5,
                             help="Messages per entity (default: 5)")
    batch_parser.add_argument("--entity-type", default="agent",
                             help="Entity type prefix (default: agent)")
    batch_parser.add_argument("--log-level", choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
                             help="Specific log level (default: random)")
    
    # Continuous command
    continuous_parser = subparsers.add_parser("continuous", help="Send messages continuously")
    continuous_parser.add_argument("--entities", type=int, default=3,
                                  help="Number of entities (default: 3)")
    continuous_parser.add_argument("--interval", type=float, default=2.0,
                                  help="Interval between messages in seconds (default: 2.0)")
    continuous_parser.add_argument("--entity-type", default="agent",
                                  help="Entity type prefix (default: agent)")
    continuous_parser.add_argument("--pattern", choices=["random", "burst", "round-robin"],
                                  default="random", help="Message pattern (default: random)")
    
    # Scenarios command
    subparsers.add_parser("scenarios", help="Run predefined test scenarios")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    generator = MessageGenerator(args.host, args.port)
    
    # Test connection
    try:
        response = requests.get(f"http://{args.host}:{args.port}/", timeout=5)
        print(f"✓ Connected to debugger at {args.host}:{args.port}")
    except Exception as e:
        print(f"✗ Cannot connect to debugger at {args.host}:{args.port}: {e}")
        print("Make sure the debugger is running: multi-entity-debugger")
        return
    
    if args.command == "batch":
        generator.send_batch(
            entity_count=args.entities,
            messages_per_entity=args.messages,
            entity_type=args.entity_type,
            log_level=args.log_level
        )
    elif args.command == "continuous":
        generator.send_continuous(
            entity_count=args.entities,
            interval=args.interval,
            entity_type=args.entity_type,
            pattern=args.pattern
        )
    elif args.command == "scenarios":
        generator.send_test_scenarios()
    
    print("Done!")

if __name__ == "__main__":
    main()