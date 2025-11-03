"""
Get Documents Lambda
Returns list of all documents for a user
"""

import json
import boto3
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
DOCUMENTS_TABLE = os.environ.get('DOCUMENTS_TABLE', 'immigration-documents')

# DynamoDB table
documents_table = dynamodb.Table(DOCUMENTS_TABLE)


def decimal_to_native(obj):
    """Convert DynamoDB Decimal types to native Python types."""
    if isinstance(obj, list):
        return [decimal_to_native(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: decimal_to_native(value) for key, value in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj


def create_response(status_code: int, body: dict) -> dict:
    """Create standardized API response with CORS headers."""
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
    Main Lambda handler for getting user's documents.
    
    Query parameters:
        status: Filter by status (optional)
        limit: Max number of documents (default: 50)
    
    Returns:
    {
        "success": true,
        "data": {
            "documents": [...],
            "count": 5
        }
    }
    """
    
    print("=== Get Documents Lambda Started ===")
    print(f"Request ID: {event.get('requestContext', {}).get('requestId', 'N/A')}")
    
    # Handle OPTIONS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'OK'})
    
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        status_filter = query_params.get('status')
        limit = int(query_params.get('limit', 50))
        
        # Validate limit
        if limit < 1 or limit > 100:
            return create_response(400, {
                'success': False,
                'error': {
                    'code': 'INVALID_LIMIT',
                    'message': 'Limit must be between 1 and 100'
                }
            })
        
        # TODO: Extract user_id from JWT token
        # For now, use test user
        user_id = 'test-user-123'
        
        print(f"Fetching documents for user: {user_id}")
        
        # Query DynamoDB for all user's documents
        try:
            response = documents_table.query(
                KeyConditionExpression=Key('user_id').eq(user_id),
                ScanIndexForward=False,  # Sort by document_id descending (newest first)
                Limit=limit
            )
            
            documents = response.get('Items', [])
            print(f"Found {len(documents)} documents")
            
        except Exception as e:
            print(f"DynamoDB query error: {str(e)}")
            return create_response(500, {
                'success': False,
                'error': {
                    'code': 'DATABASE_ERROR',
                    'message': 'Error retrieving documents'
                }
            })
        
        # Filter by status if specified
        if status_filter:
            documents = [
                doc for doc in documents 
                if doc.get('status', '').lower() == status_filter.lower()
            ]
            print(f"Filtered to {len(documents)} documents with status: {status_filter}")
        
        # Sort by created_at (newest first)
        try:
            documents.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        except Exception as e:
            print(f"Sorting error: {str(e)}")
            # Continue without sorting
        
        # Build response with document summaries
        document_summaries = []
        for doc in documents:
            summary = {
                'document_id': doc.get('document_id'),
                'document_type': doc.get('document_type'),
                'file_name': doc.get('file_name'),
                'status': doc.get('status'),
                'created_at': doc.get('created_at'),
                'updated_at': doc.get('updated_at')
            }
            
            # Add extracted data preview if available
            if doc.get('extracted_data'):
                extracted = doc.get('extracted_data', {})
                summary['preview'] = {
                    'full_name': extracted.get('full_name', {}).get('value'),
                    'sevis_id': extracted.get('sevis_id', {}).get('value'),
                    'program_end_date': extracted.get('program_end_date', {}).get('value')
                }
            
            # Add error message if failed
            if doc.get('status') == 'failed':
                summary['error_message'] = doc.get('error_message')
            
            document_summaries.append(summary)
        
        print(f"Returning {len(document_summaries)} documents")
        
        return create_response(200, {
            'success': True,
            'data': {
                'documents': document_summaries,
                'count': len(document_summaries)
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
        print(f"Unexpected error in get_documents Lambda: {str(e)}")
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