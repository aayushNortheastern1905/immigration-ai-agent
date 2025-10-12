"""
User Login Lambda Function
Handles user authentication and login tracking
"""

import json
import boto3
import os
import hashlib
from datetime import datetime
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USERS_TABLE', 'immigration-users'))

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_response(status_code, body):
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Requested-With',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body, default=str)
    }

def lambda_handler(event, context):
    """
    Main Lambda handler for user login
    
    Expected body:
    {
        "email": "user@example.com",
        "password": "SecurePass123"
    }
    """
    try:
        # Log the request
        print(f"Login request received: {event.get('requestContext', {}).get('requestId', 'N/A')}")
        
        # Parse request body
        if not event.get('body'):
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'MISSING_BODY',
                    'message': 'Request body is required'
                }
            })
        
        body = json.loads(event['body'])
        
        # Extract credentials
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        
        # Validate required fields
        if not email or not password:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'MISSING_CREDENTIALS',
                    'message': 'Email and password are required'
                }
            })
        
        # Hash password
        password_hash = hash_password(password)
        
        # Find user by email
        try:
            response = table.query(
                IndexName='email-index',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={
                    ':email': email
                },
                Limit=1
            )
            
            if not response.get('Items'):
                return create_response(401, {
                    'success': False,
                    'error': {
                        'code': 'INVALID_CREDENTIALS',
                        'message': 'Invalid email or password'
                    }
                })
            
            user = response['Items'][0]
            
        except Exception as e:
            print(f"Error querying user: {str(e)}")
            return create_response(500, {
                'success': False,
                'error': {
                    'code': 'DATABASE_ERROR',
                    'message': 'Error accessing user data'
                }
            })
        
        # Verify password
        if user.get('password_hash') != password_hash:
            return create_response(401, {
                'success': False,
                'error': {
                    'code': 'INVALID_CREDENTIALS',
                    'message': 'Invalid email or password'
                }
            })
        
        # Check if account is active
        if not user.get('is_active', True):
            return create_response(403, {
                'success': False,
                'error': {
                    'code': 'ACCOUNT_DISABLED',
                    'message': 'This account has been disabled'
                }
            })
        
        # Update login tracking
        current_login_count = int(user.get('login_count', 0))
        new_login_count = current_login_count + 1
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        try:
            table.update_item(
                Key={'user_id': user['user_id']},
                UpdateExpression='SET login_count = :count, last_login = :time',
                ExpressionAttributeValues={
                    ':count': new_login_count,
                    ':time': timestamp
                }
            )
        except Exception as e:
            print(f"Error updating login tracking: {str(e)}")
            # Continue anyway - login still successful
        
        # Check if first login
        is_first_login = (current_login_count == 0)
        
        print(f"User logged in successfully: {user['user_id']} (Login #{new_login_count})")
        
        # Remove sensitive data from response
        user_response = {
            'user_id': user['user_id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'visa_type': user['visa_type'],
            'login_count': new_login_count,
            'last_login': timestamp,
            'created_at': user.get('created_at'),
            'is_active': user.get('is_active', True)
        }
        
        return create_response(200, {
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': user_response,
                'is_first_login': is_first_login
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
        print(f"Unexpected error in login: {str(e)}")
        return create_response(500, {
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred',
                'details': str(e) if os.environ.get('ENVIRONMENT') == 'dev' else None
            }
        })