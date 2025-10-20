"""
JWT Authorizer Lambda for API Gateway
Validates JWT tokens and returns IAM policy
"""

import json
import jwt
import os
import re

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')


def lambda_handler(event, context):
    """
    API Gateway Lambda Authorizer
    Validates JWT token and returns policy
    """
    print(f"Authorizer invoked: {json.dumps(event)}")
    
    # Extract token from Authorization header
    token = extract_token(event)
    
    if not token:
        print("No token found in request")
        raise Exception('Unauthorized')
    
    try:
        # Validate JWT token
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=['HS256']
        )
        
        user_id = payload.get('user_id')
        
        if not user_id:
            print("Token missing user_id")
            raise Exception('Unauthorized')
        
        print(f"Token validated for user: {user_id}")
        
        # Generate IAM policy
        policy = generate_policy(user_id, 'Allow', event['methodArn'])
        
        # Add user context
        policy['context'] = {
            'user_id': user_id,
            'email': payload.get('email', '')
        }
        
        return policy
    
    except jwt.ExpiredSignatureError:
        print("Token expired")
        raise Exception('Unauthorized - Token expired')
    
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {str(e)}")
        raise Exception('Unauthorized - Invalid token')
    
    except Exception as e:
        print(f"Authorization error: {str(e)}")
        raise Exception('Unauthorized')


def extract_token(event):
    """Extract JWT token from request"""
    # Check Authorization header
    headers = event.get('headers', {})
    
    # Handle case-insensitive headers
    auth_header = None
    for key, value in headers.items():
        if key.lower() == 'authorization':
            auth_header = value
            break
    
    if auth_header:
        # Remove 'Bearer ' prefix if present
        if auth_header.startswith('Bearer '):
            return auth_header[7:]
        return auth_header
    
    # Check query string
    query_params = event.get('queryStringParameters', {})
    if query_params and 'token' in query_params:
        return query_params['token']
    
    return None


def generate_policy(principal_id, effect, resource):
    """
    Generate IAM policy document
    
    Args:
        principal_id: User ID
        effect: 'Allow' or 'Deny'
        resource: Method ARN
    
    Returns:
        IAM policy document
    """
    # Build resource ARN - allow all methods in same API
    resource_parts = resource.split('/')
    resource_base = '/'.join(resource_parts[:2])  # arn:aws:execute-api:region:account:api-id/stage
    
    policy = {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': f"{resource_base}/*/*"  # Allow all methods
                }
            ]
        }
    }
    
    return policy