"""
Get Document Status Lambda
Returns the current processing status of a document.

This Lambda:
1. Queries DynamoDB for document status
2. Returns extracted data if processing is complete
3. Returns error messages if processing failed
4. Provides real-time status updates for frontend polling
"""

import json
import boto3
import os
from decimal import Decimal

# AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
DOCUMENTS_TABLE = os.environ.get('DOCUMENTS_TABLE', 'immigration-documents')

# DynamoDB table
documents_table = dynamodb.Table(DOCUMENTS_TABLE)


def decimal_to_native(obj):
    """
    Convert DynamoDB Decimal types to native Python types.
    
    Args:
        obj: Object that may contain Decimal types
    
    Returns:
        Object with Decimals converted to int/float
    """
    if isinstance(obj, list):
        return [decimal_to_native(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: decimal_to_native(value) for key, value in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj


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
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Credentials': 'false',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(decimal_to_native(body), default=str)
    }


def lambda_handler(event, context):
    """
    Main Lambda handler for getting document status.
    
    Path parameters:
        document_id: The document ID to check
    
    Returns:
    {
        "success": true,
        "data": {
            "document_id": "uuid",
            "status": "success|processing|failed|needs_verification",
            "stage": "text_extraction|ai_structuring|validation|complete",
            "extracted_data": {...},  // if status is success
            "validation_errors": [...],  // if any warnings/errors
            "error_message": "...",  // if status is failed
            "created_at": "2025-11-01T...",
            "updated_at": "2025-11-01T..."
        }
    }
    """
    
    print("=== Get Status Lambda Started ===")
    print(f"Request ID: {event.get('requestContext', {}).get('requestId', 'N/A')}")
    
    # Handle OPTIONS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'OK'})
    
    try:
        # Extract document_id from path parameters
        path_params = event.get('pathParameters', {})
        document_id = path_params.get('document_id')
        
        if not document_id:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'MISSING_DOCUMENT_ID',
                    'message': 'document_id path parameter is required'
                }
            })
        
        print(f"Checking status for document: {document_id}")
        
        # TODO: Extract user_id from JWT token
        # For now, use test user
        user_id = 'test-user-123'
        
        # Query DynamoDB
        try:
            response = documents_table.get_item(
                Key={
                    'user_id': user_id,
                    'document_id': document_id
                }
            )
        except Exception as e:
            print(f"DynamoDB query error: {str(e)}")
            return create_response(500, {
                'success': False,
                'error': {
                    'code': 'DATABASE_ERROR',
                    'message': 'Error retrieving document status'
                }
            })
        
        # Check if document exists
        if 'Item' not in response:
            print(f"Document not found: {document_id}")
            return create_response(404, {
                'success': False,
                'error': {
                    'code': 'DOCUMENT_NOT_FOUND',
                    'message': f'Document {document_id} not found'
                }
            })
        
        document = response['Item']
        print(f"Document status: {document.get('status')}")
        
        # Build response based on status
        status = document.get('status', 'unknown')
        
        response_data = {
            'document_id': document_id,
            'document_type': document.get('document_type'),
            'file_name': document.get('file_name'),
            'status': status,
            'processing_stage': document.get('processing_stage'),
            'created_at': document.get('created_at'),
            'updated_at': document.get('updated_at')
        }
        
        # Add status-specific data
        if status == 'success':
            response_data['extracted_data'] = document.get('extracted_data', {})
            response_data['validation_errors'] = document.get('validation_errors', [])
            response_data['message'] = 'Document processed successfully'
        
        elif status == 'needs_verification':
            response_data['extracted_data'] = document.get('extracted_data', {})
            response_data['validation_errors'] = document.get('validation_errors', [])
            response_data['message'] = 'Document processed but needs verification'
        
        elif status == 'processing':
            response_data['message'] = f'Processing document: {document.get("processing_stage", "unknown stage")}'
        
        elif status == 'uploading':
            response_data['message'] = 'Document is being uploaded'
        
        elif status == 'failed':
            response_data['error_message'] = document.get('error_message', 'Processing failed')
            response_data['validation_errors'] = document.get('validation_errors', [])
        
        else:
            response_data['message'] = f'Document status: {status}'
        
        print(f"Returning status for {document_id}: {status}")
        
        return create_response(200, {
            'success': True,
            'data': response_data
        })
    
    except Exception as e:
        print(f"Unexpected error in get_status Lambda: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        return create_response(500, {
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred',
                'details': str(e) if os.environ.get('ENVIRONMENT') == 'dev' else None
            }
        })