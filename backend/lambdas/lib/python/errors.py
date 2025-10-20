"""
Custom Exception Classes for Immigration AI Backend
"""

class ImmigrationAIError(Exception):
    """Base exception for all Immigration AI errors"""
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR", details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self):
        return {
            'code': self.code,
            'message': self.message,
            'details': self.details
        }


class ScrapingError(ImmigrationAIError):
    """Base class for scraping errors"""
    pass


class USCISUnreachableError(ScrapingError):
    """USCIS website is unreachable"""
    def __init__(self, message: str = "USCIS website is unreachable", details: dict = None):
        super().__init__(message, "USCIS_UNREACHABLE", details)


class AIError(ImmigrationAIError):
    """Base class for AI errors"""
    pass


class AITimeoutError(AIError):
    """AI API request timed out"""
    def __init__(self, message: str = "AI API timeout", details: dict = None):
        super().__init__(message, "AI_TIMEOUT", details)


class AIInvalidResponseError(AIError):
    """AI returned invalid response"""
    def __init__(self, message: str = "Invalid AI response", details: dict = None):
        super().__init__(message, "AI_INVALID_RESPONSE", details)


class DatabaseError(ImmigrationAIError):
    """Base class for database errors"""
    pass


class DuplicatePolicyError(DatabaseError):
    """Policy already exists"""
    def __init__(self, message: str = "Policy already exists", details: dict = None):
        super().__init__(message, "DUPLICATE_POLICY", details)


class ValidationError(ImmigrationAIError):
    """Validation error"""
    def __init__(self, message: str, field: str = None, details: dict = None):
        details = details or {}
        if field:
            details['field'] = field
        super().__init__(message, "VALIDATION_ERROR", details)