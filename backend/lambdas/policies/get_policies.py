"""
Get Policies Lambda Function
Retrieves and filters immigration policy updates
"""

import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('POLICIES_TABLE', 'immigration-policies'))

# Allowed visa types for filtering
ALLOWED_VISA_TYPES = ['F-1', 'OPT', 'H-1B', 'L-1', 'O-1']

def decimal_to_native(obj):
    """Convert DynamoDB Decimal types to native Python types"""
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj

def create_response(status_code, body):
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(decimal_to_native(body), default=str)
    }

def lambda_handler(event, context):
    """
    Main Lambda handler for getting policies
    
    Query parameters:
    - visa_type: Filter by visa type (F-1, OPT, H-1B, etc.)
    - limit: Max number of policies to return (default: 10, max: 50)
    - impact_level: Filter by impact level (High, Medium, Low)
    """
    try:
        # Log the request
        print(f"Get policies request: {event.get('requestContext', {}).get('requestId', 'N/A')}")
        
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        
        visa_type = query_params.get('visa_type', '').strip()
        limit = int(query_params.get('limit', 10))
        impact_level = query_params.get('impact_level', '').strip()
        
        # Validate limit
        if limit < 1 or limit > 50:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'INVALID_LIMIT',
                    'message': 'Limit must be between 1 and 50'
                }
            })
        
        # Validate visa type if provided
        if visa_type and visa_type not in ALLOWED_VISA_TYPES:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'INVALID_VISA_TYPE',
                    'message': f'Visa type must be one of: {", ".join(ALLOWED_VISA_TYPES)}'
                }
            })
        
        # Validate impact level if provided
        allowed_impact_levels = ['High', 'Medium', 'Low']
        if impact_level and impact_level not in allowed_impact_levels:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'INVALID_IMPACT_LEVEL',
                    'message': f'Impact level must be one of: {", ".join(allowed_impact_levels)}'
                }
            })
        
        # Scan table (for MVP - will optimize with better access patterns later)
        try:
            response = table.scan(
                Limit=100  # Get more than needed for filtering
            )
            policies = response.get('Items', [])
            
            # Continue scanning if there are more items (pagination)
            while 'LastEvaluatedKey' in response and len(policies) < 100:
                response = table.scan(
                    Limit=100,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                policies.extend(response.get('Items', []))
            
        except Exception as e:
            print(f"Error scanning policies table: {str(e)}")
            return create_response(500, {
                'success': False,
                'error': {
                    'code': 'DATABASE_ERROR',
                    'message': 'Error retrieving policies'
                }
            })
        
        # Filter by visa type if specified
        if visa_type:
            policies = [
                p for p in policies
                if visa_type in p.get('affected_visas', [])
            ]
        
        # Filter by impact level if specified
        if impact_level:
            policies = [
                p for p in policies
                if p.get('impact_level', '').lower() == impact_level.lower()
            ]
        
        # Sort by published date (newest first)
        try:
            policies.sort(
                key=lambda x: x.get('published_date', ''),
                reverse=True
            )
        except Exception as e:
            print(f"Error sorting policies: {str(e)}")
            # Continue with unsorted if sorting fails
        
        # Apply limit
        policies = policies[:limit]
        
        # Add metadata to each policy
        for policy in policies:
            policy['retrieved_at'] = datetime.utcnow().isoformat() + 'Z'
        
        print(f"Returning {len(policies)} policies")
        
        return create_response(200, {
            'success': True,
            'data': {
                'count': len(policies),
                'policies': policies,
                'filters_applied': {
                    'visa_type': visa_type if visa_type else None,
                    'impact_level': impact_level if impact_level else None,
                    'limit': limit
                }
            }
        })
        
    except ValueError as e:
        return create_response(400, {
            'success': False,
            'error': {
                'code': 'INVALID_PARAMETER',
                'message': str(e)
            }
        })
    except Exception as e:
        print(f"Unexpected error in get_policies: {str(e)}")
        return create_response(500, {
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred',
                'details': str(e) if os.environ.get('ENVIRONMENT') == 'dev' else None
            }
        })