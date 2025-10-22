"""
User Signup Lambda Function
Handles new user registration with validation, password hashing, and JWT token generation
"""

import json
import boto3
import os
import uuid
import hashlib
import jwt
import re
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USERS_TABLE', 'immigration-users'))

ALLOWED_VISA_TYPES = ['F-1', 'OPT', 'H-1B', 'L-1', 'O-1']

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Valid"

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_jwt_token(user_id: str, email: str) -> str:
    """Create JWT token for new user"""
    jwt_secret = os.environ.get('JWT_SECRET', 'your-secret-key')
    
    payload = {
        'user_id': user_id,
        'email': email,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    
    token = jwt.encode(payload, jwt_secret, algorithm='HS256')
    return token

def create_response(status_code, body):
    """Create standardized API response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Credentials': 'false',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body, default=str)
    }

def lambda_handler(event, context):
    """Main Lambda handler for user signup"""
    
    # Handle OPTIONS preflight request
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'OK'})
    
    try:
        print(f"Signup request received: {event.get('requestContext', {}).get('requestId', 'N/A')}")
        
        if not event.get('body'):
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'MISSING_BODY',
                    'message': 'Request body is required'
                }
            })
        
        body = json.loads(event['body'])
        
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        full_name = body.get('full_name', '').strip()
        visa_type = body.get('visa_type', 'F-1').strip()
        
        if not email or not password or not full_name:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'MISSING_FIELDS',
                    'message': 'Email, password, and full name are required'
                }
            })
        
        if not validate_email(email):
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'INVALID_EMAIL',
                    'message': 'Invalid email format'
                }
            })
        
        is_valid, message = validate_password(password)
        if not is_valid:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'WEAK_PASSWORD',
                    'message': message
                }
            })
        
        if visa_type not in ALLOWED_VISA_TYPES:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'INVALID_VISA_TYPE',
                    'message': f'Visa type must be one of: {", ".join(ALLOWED_VISA_TYPES)}'
                }
            })
        
        try:
            response = table.query(
                IndexName='email-index',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={
                    ':email': email
                },
                Limit=1
            )
            
            if response.get('Items'):
                return create_response(409, {
                    'success': False,
                    'error': {
                        'code': 'USER_EXISTS',
                        'message': 'User with this email already exists'
                    }
                })
        except Exception as e:
            print(f"Error checking existing user: {str(e)}")
        
        user_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'
        password_hash = hash_password(password)
        
        user_data = {
            'user_id': user_id,
            'email': email,
            'password_hash': password_hash,
            'full_name': full_name,
            'visa_type': visa_type,
            'login_count': 0,
            'created_at': timestamp,
            'last_login': timestamp,
            'is_active': True
        }
        
        table.put_item(Item=user_data)
        
        print(f"User created successfully: {user_id}")
        
        jwt_token = create_jwt_token(user_id, email)
        
        user_response = {
            'user_id': user_id,
            'email': email,
            'full_name': full_name,
            'visa_type': visa_type,
            'login_count': 0,
            'created_at': timestamp,
            'is_active': True
        }
        
        return create_response(201, {
            'success': True,
            'message': 'User created successfully',
            'data': {
                'user': user_response,
                'token': jwt_token
            }
        })
        
    except json.JSONDecodeError:
        return create_response(400, {
            'success': False,
            'error': {
                'code': 'INVALID_JSON',
                'message': 'Invalid JSON in request body'
            }
        })
    except Exception as e:
        print(f"Unexpected error in signup: {str(e)}")
        return create_response(500, {
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred',
                'details': str(e) if os.environ.get('ENVIRONMENT') == 'dev' else None
            }
        })