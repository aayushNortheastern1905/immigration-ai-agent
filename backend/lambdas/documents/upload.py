"""
Upload Document Lambda
Generates presigned S3 URL for direct upload from frontend.

This Lambda:
1. Validates document type
2. Generates unique document ID
3. Creates presigned S3 URL for upload
4. Creates initial document record in DynamoDB
"""

import json
import boto3
import os
import uuid
from datetime import datetime

# AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
BUCKET_NAME = os.environ.get('DOCUMENTS_BUCKET', 'immigration-ai-documents-dev')
DOCUMENTS_TABLE = os.environ.get('DOCUMENTS_TABLE', 'immigration-documents')

# DynamoDB table
documents_table = dynamodb.Table(DOCUMENTS_TABLE)

# Constants
ALLOWED_DOCUMENT_TYPES = ['i20', 'ead', 'passport', 'i765', 'i983']
MAX_FILE_SIZE = 10485760  # 10MB in bytes
PRESIGNED_URL_EXPIRY = 300  # 5 minutes


def create_response(status_code: int, body: dict) -> dict:
    """
    Create standardized API response with CORS headers.
    
    Args:
        status_code: HTTP status code
        body: Response body dict
    
    Returns:
        API Gateway response dict
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Credentials': 'false',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body, default=str)
    }


def validate_request(body: dict) -> tuple:
    """
    Validate request parameters.
    
    Args:
        body: Request body dict
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    
    # Check document_type
    document_type = body.get('document_type', '').lower()
    if not document_type:
        return False, 'document_type is required'
    
    if document_type not in ALLOWED_DOCUMENT_TYPES:
        return False, f'document_type must be one of: {", ".join(ALLOWED_DOCUMENT_TYPES)}'
    
    # Check file_name
    file_name = body.get('file_name', '')
    if not file_name:
        return False, 'file_name is required'
    
    # Validate file extension
    if not file_name.lower().endswith('.pdf'):
        return False, 'Only PDF files are supported'
    
    return True, None


def lambda_handler(event, context):
    """
    Main Lambda handler for document upload URL generation.
    
    Expected request body:
    {
        "document_type": "i20",
        "file_name": "my-i20.pdf"
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "document_id": "uuid",
            "upload_url": "https://s3...",
            "upload_fields": {...}
        }
    }
    """
    
    request_id = event.get('requestContext', {}).get('requestId', 'N/A')
    print(f"=== Upload Lambda Started ===")
    print(f"Request ID: {request_id}")
    
    # Handle OPTIONS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'OK'})
    
    try:
        # Parse request body
        if not event.get('body'):
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'MISSING_BODY',
                    'message': 'Request body is required'
                }
            })
        
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'INVALID_JSON',
                    'message': 'Invalid JSON in request body'
                }
            })
        
        # Validate request
        is_valid, error_message = validate_request(body)
        if not is_valid:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': error_message
                }
            })
        
        document_type = body['document_type'].lower()
        file_name = body['file_name']
        
        # TODO: Extract user_id from JWT token
        # For now, use test user
        user_id = 'test-user-123'
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        print(f"Generating upload URL for document: {document_id}")
        print(f"Document type: {document_type}, File: {file_name}")
        
        # S3 key format: user_id/document_id/filename
        s3_key = f'{user_id}/{document_id}/{file_name}'
        
        # Generate presigned POST URL for direct upload
        try:
            presigned_post = s3_client.generate_presigned_post(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Fields={
                    'Content-Type': 'application/pdf'
                },
                Conditions=[
                    {'Content-Type': 'application/pdf'},
                    ['content-length-range', 0, MAX_FILE_SIZE]
                ],
                ExpiresIn=PRESIGNED_URL_EXPIRY
            )
        except Exception as e:
            print(f"Error generating presigned URL: {str(e)}")
            return create_response(500, {
                'success': False,
                'error': {
                    'code': 'S3_ERROR',
                    'message': 'Failed to generate upload URL. Please try again.'
                }
            })
        
        # Create initial document record in DynamoDB
        document_record = {
            'user_id': user_id,
            'document_id': document_id,
            'document_type': document_type,
            'file_name': file_name,
            's3_key': s3_key,
            's3_bucket': BUCKET_NAME,
            'status': 'uploading',
            'created_at': timestamp,
            'updated_at': timestamp,
            'processing_stages': {
                'upload': {
                    'status': 'in_progress',
                    'started_at': timestamp
                }
            }
        }
        
        try:
            documents_table.put_item(Item=document_record)
            print(f"Document record created in DynamoDB: {document_id}")
        except Exception as e:
            print(f"Error creating DynamoDB record: {str(e)}")
            return create_response(500, {
                'success': False,
                'error': {
                    'code': 'DATABASE_ERROR',
                    'message': 'Failed to create document record. Please try again.'
                }
            })
        
        # Return success response
        print(f"Upload URL generated successfully for {document_id}")
        
        return create_response(200, {
            'success': True,
            'message': 'Upload URL generated successfully',
            'data': {
                'document_id': document_id,
                'upload_url': presigned_post['url'],
                'upload_fields': presigned_post['fields'],
                'expires_in': PRESIGNED_URL_EXPIRY
            }
        })
    
    except Exception as e:
        print(f"Unexpected error in upload Lambda: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        return create_response(500, {
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred. Please try again.',
                'details': str(e) if os.environ.get('ENVIRONMENT') == 'dev' else None
            }
        })