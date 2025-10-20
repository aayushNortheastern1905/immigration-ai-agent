"""
DynamoDB Repository for Policy Operations
"""

import boto3
import os
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from boto3.dynamodb.conditions import Attr
from errors import DuplicatePolicyError, DatabaseError
from logger import get_logger

dynamodb = boto3.resource('dynamodb')
policies_table = dynamodb.Table(os.environ.get('POLICIES_TABLE', 'immigration-policies'))


def decimal_to_native(obj):
    """Convert DynamoDB Decimal to native types"""
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj


class PolicyRepository:
    """Repository for policy database operations"""
    
    def __init__(self, logger=None):
        self.logger = logger or get_logger()
        self.table = policies_table
    
    def save_policy(self, policy: dict, check_duplicate: bool = True) -> str:
        """Save policy to DynamoDB"""
        try:
            policy_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat() + 'Z'
            
            # Check duplicates
            if check_duplicate:
                if self.check_duplicate(policy['title']):
                    self.logger.warning("Duplicate policy", title=policy['title'])
                    raise DuplicatePolicyError(f"Policy exists: {policy['title']}")
            
            # Prepare item
            item = {
                'policy_id': policy_id,
                'title': policy['title'],
                'summary': policy['summary'],
                'impact_level': policy['impact_level'],
                'affected_visas': policy['affected_visas'],
                'action_items': policy.get('action_items', []),
                'source_url': policy.get('source_url', ''),
                'raw_content': policy.get('raw_content', ''),
                'published_date': policy.get('published_date', timestamp),
                'scraped_at': timestamp,
                'status': 'active',
                'expires_at': int((datetime.utcnow() + timedelta(days=365)).timestamp())
            }
            
            self.table.put_item(Item=item)
            
            self.logger.info("Policy saved", policy_id=policy_id, title=policy['title'])
            return policy_id
        
        except DuplicatePolicyError:
            raise
        except Exception as e:
            self.logger.error("Error saving policy", error=e)
            raise DatabaseError(f"Failed to save: {str(e)}")
    
    def get_policies(self, visa_type: str = None, impact_level: str = None, 
                     days: int = None, limit: int = 10):
        """Get policies with filters"""
        try:
            self.logger.info("Querying policies", visa_type=visa_type, limit=limit)
            
            # Build filter
            filter_expr = Attr('status').eq('active')
            
            if days:
                cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat() + 'Z'
                filter_expr = filter_expr & Attr('published_date').gte(cutoff)
            
            if impact_level:
                filter_expr = filter_expr & Attr('impact_level').eq(impact_level)
            
            # Scan table
            response = self.table.scan(FilterExpression=filter_expr, Limit=limit * 2)
            
            policies = response.get('Items', [])
            
            # Client-side filter for visa_type (it's a list)
            if visa_type:
                policies = [p for p in policies if visa_type in p.get('affected_visas', [])]
            
            # Sort by date (newest first)
            policies.sort(key=lambda x: x.get('published_date', ''), reverse=True)
            
            # Apply limit
            policies = policies[:limit]
            
            self.logger.info(f"Retrieved {len(policies)} policies")
            
            return [decimal_to_native(p) for p in policies]
        
        except Exception as e:
            self.logger.error("Error querying policies", error=e)
            raise DatabaseError(f"Query failed: {str(e)}")
    
    def check_duplicate(self, title: str) -> bool:
        """Check if policy with title exists"""
        try:
            response = self.table.scan(
                FilterExpression=Attr('title').eq(title) & Attr('status').eq('active'),
                Limit=1
            )
            return len(response.get('Items', [])) > 0
        except Exception as e:
            self.logger.error("Error checking duplicate", error=e)
            return False