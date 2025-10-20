"""
Input Validation Module
"""

import re
from errors import ValidationError

ALLOWED_VISA_TYPES = ['F-1', 'OPT', 'H-1B', 'L-1', 'O-1']
ALLOWED_IMPACT_LEVELS = ['Critical', 'High', 'Medium', 'Low']


class Validators:
    """Collection of validation methods"""
    
    @staticmethod
    def validate_visa_type(visa_type: str) -> str:
        if not visa_type:
            return None
        visa_type = visa_type.strip()
        if visa_type not in ALLOWED_VISA_TYPES:
            raise ValidationError(f"Invalid visa type: {visa_type}", field="visa_type")
        return visa_type
    
    @staticmethod
    def validate_impact_level(impact_level: str) -> str:
        if not impact_level:
            return None
        impact_level = impact_level.strip()
        if impact_level not in ALLOWED_IMPACT_LEVELS:
            raise ValidationError(f"Invalid impact level: {impact_level}", field="impact_level")
        return impact_level
    
    @staticmethod
    def validate_limit(limit: int) -> int:
        if limit is None:
            return 10
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            raise ValidationError("Limit must be a valid integer", field="limit")
        if limit < 1 or limit > 50:
            raise ValidationError("Limit must be between 1 and 50", field="limit")
        return limit
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        if not value:
            return ""
        value = value.strip()
        if len(value) > max_length:
            raise ValidationError(f"String too long (max {max_length} chars)", field="string")
        # Remove dangerous characters
        value = re.sub(r'[^\w\s\-.,;:!?()\[\]@#$%&*+=]', '', value)
        return value
    
    @staticmethod
    def validate_policy_data(policy: dict) -> dict:
        required_fields = ['title', 'summary', 'impact_level', 'affected_visas']
        for field in required_fields:
            if field not in policy:
                raise ValidationError(f"Missing required field: {field}", field=field)
        
        policy['title'] = Validators.sanitize_string(policy['title'], 500)
        policy['summary'] = Validators.sanitize_string(policy['summary'], 5000)
        policy['impact_level'] = Validators.validate_impact_level(policy['impact_level'])
        
        if not isinstance(policy['affected_visas'], list):
            raise ValidationError("affected_visas must be a list", field="affected_visas")
        
        validated_visas = []
        for visa in policy['affected_visas']:
            validated_visas.append(Validators.validate_visa_type(visa))
        policy['affected_visas'] = validated_visas
        
        if 'action_items' in policy and not isinstance(policy['action_items'], list):
            raise ValidationError("action_items must be a list", field="action_items")
        
        return policy