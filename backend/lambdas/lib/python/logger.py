"""
Structured Logging for Immigration AI Backend
"""

import json
import logging
import sys
from datetime import datetime
import uuid

logging.basicConfig(level=logging.INFO, format='%(message)s', stream=sys.stdout)
logger = logging.getLogger('immigration-ai')


class StructuredLogger:
    """JSON-formatted logger with correlation IDs"""
    
    def __init__(self, correlation_id: str = None):
        self.correlation_id = correlation_id or str(uuid.uuid4())
        self.context = {}
    
    def add_context(self, **kwargs):
        self.context.update(kwargs)
    
    def _format_log(self, level: str, message: str, extra: dict = None) -> str:
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': level,
            'message': message,
            'correlation_id': self.correlation_id,
            **self.context
        }
        if extra:
            log_entry['extra'] = extra
        return json.dumps(log_entry)
    
    def info(self, message: str, **kwargs):
        logger.info(self._format_log('INFO', message, kwargs if kwargs else None))
    
    def warning(self, message: str, **kwargs):
        logger.warning(self._format_log('WARNING', message, kwargs if kwargs else None))
    
    def error(self, message: str, error: Exception = None, **kwargs):
        extra = kwargs.copy()
        if error:
            extra['error_type'] = type(error).__name__
            extra['error_message'] = str(error)
            if hasattr(error, 'code'):
                extra['error_code'] = error.code
        logger.error(self._format_log('ERROR', message, extra))
    
    def debug(self, message: str, **kwargs):
        logger.debug(self._format_log('DEBUG', message, kwargs if kwargs else None))


def get_logger(correlation_id: str = None, **context):
    """Create a new structured logger instance"""
    log = StructuredLogger(correlation_id)
    if context:
        log.add_context(**context)
    return log