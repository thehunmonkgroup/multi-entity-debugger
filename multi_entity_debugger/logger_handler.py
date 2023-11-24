import requests
from logging import Handler, LogRecord

DEFAULT_DEBUG_ENDPOINT = 'http://localhost:8000/send-message/'

DUMMY_LOG_RECORD = LogRecord(name="", level=0, pathname="", lineno=0, msg="", args=(), exc_info=None)
LOG_DEFAULT_ATTRS = set(vars(DUMMY_LOG_RECORD).keys())


class HTTPDebuggerHandler(Handler):
    def __init__(self, entity_name, entity_label, url: str = DEFAULT_DEBUG_ENDPOINT):
        super().__init__()
        self.entity_name = entity_name
        self.entity_label = entity_label
        self.url = url

    def emit(self, record):
        data = {
            'name': self.entity_name,
            'label': self.entity_label,
            'log_level': record.levelname,
            'message': record.getMessage(),
        }
        extra_attrs = {key: value for key, value in record.__dict__.items() if key not in LOG_DEFAULT_ATTRS}
        data.update(extra_attrs)
        try:
            requests.post(self.url, json=data)
        except requests.exceptions.RequestException:
            # Silently ignore request exceptions, allows operation without an active debugger.
            pass
        except Exception:
            self.handleError(record)
