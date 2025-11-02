"""
Process Document Lambda
Triggered by S3 upload event. Processes document and extracts data.

This Lambda:
1. Gets triggered when file is uploaded to S3
2. Extracts text using AWS Textract
3. Structures data using Gemini AI
4. Validates extracted data
5. Calculates OPT timeline
6. Updates DynamoDB with results
"""

import json
import boto3
import os
from datetime import datetime

# Import from Lambda Layer
from document_processor import DocumentProcessor
from timeline_calculator import TimelineCalculator
from logger import get_logger

# AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
DOCUMENTS_TABLE = os.environ.get('DOCUMENTS_TABLE', 'immigration-documents')

# DynamoDB table
documents_table = dynamodb.Table(DOCUMENTS_TABLE)


def update_document_status(user_id: str, document_id: str, status: str, 
                          stage: str = None, data: dict = None, 
                          error: str = None, validation_errors: list = None):
    """
    Update document status in DynamoDB.
    
    Args:
        user_id: User ID
        document_id: Document ID
        status: New status (processing, success, failed, etc.)
        stage: Current processing stage
        data: Extracted data (if successful)
        error: Error message (if failed)
        validation_errors: List of validation errors
    """
    
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    update_expr_parts = ['status = :status', 'updated_at = :timestamp']
    expr_values = {
        ':status': status,
        ':timestamp': timestamp
    }
    
    if stage:
        update_expr_parts.append('processing_stage = :stage')
        expr_values[':stage'] = stage
    
    if data:
        update_expr_parts.append('extracted_data = :data')
        expr_values[':data'] = data
    
    if error:
        update_expr_parts.append('error_message = :error')
        expr_values[':error'] = error
    
    if validation_errors:
        update_expr_parts.append('validation_errors = :val_errors')
        expr_values[':val_errors'] = validation_errors
    
    try:
        documents_table.update_item(
            Key={
                'user_id': user_id,
                'document_id': document_id
            },
            UpdateExpression='SET ' + ', '.join(update_expr_parts),
            ExpressionAttributeValues=expr_values
        )
        print(f"Updated document {document_id} status to: {status}")
    except Exception as e:
        print(f"Error updating DynamoDB: {str(e)}")


def extract_s3_info(event: dict) -> tuple:
    """
    Extract S3 bucket and key from S3 event.
    
    Args:
        event: S3 event dict
    
    Returns:
        Tuple of (bucket, key, success)
    """
    
    try:
        # S3 event structure
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        print(f"S3 Event - Bucket: {bucket}, Key: {key}")
        
        return bucket, key, True
    
    except (KeyError, IndexError) as e:
        print(f"Error parsing S3 event: {str(e)}")
        return None, None, False


def extract_user_and_doc_id(s3_key: str) -> tuple:
    """
    Extract user_id and document_id from S3 key.
    
    S3 key format: user_id/document_id/filename.pdf
    
    Args:
        s3_key: S3 object key
    
    Returns:
        Tuple of (user_id, document_id, success)
    """
    
    try:
        parts = s3_key.split('/')
        if len(parts) < 3:
            print(f"Invalid S3 key format: {s3_key}")
            return None, None, False
        
        user_id = parts[0]
        document_id = parts[1]
        
        print(f"Extracted - User ID: {user_id}, Document ID: {document_id}")
        
        return user_id, document_id, True
    
    except Exception as e:
        print(f"Error extracting IDs from S3 key: {str(e)}")
        return None, None, False


def lambda_handler(event, context):
    """
    Main Lambda handler for document processing.
    
    Triggered by: S3 ObjectCreated event
    
    Processing stages:
    1. Extract text (Textract)
    2. Structure data (Gemini AI)
    3. Validate data
    4. Calculate timeline
    5. Update DynamoDB
    """
    
    request_id = context.aws_request_id if context else 'local-test'
    logger = get_logger(correlation_id=request_id)
    
    print("=== Process Document Lambda Started ===")
    logger.info("Document processing started", request_id=request_id)
    
    try:
        # Extract S3 info from event
        bucket, s3_key, success = extract_s3_info(event)
        if not success:
            logger.error("Failed to parse S3 event")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid S3 event'})
            }
        
        # Extract user_id and document_id from S3 key
        user_id, document_id, success = extract_user_and_doc_id(s3_key)
        if not success:
            logger.error("Failed to extract user_id/document_id from S3 key")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid S3 key format'})
            }
        
        # Update status to processing
        update_document_status(
            user_id, 
            document_id, 
            'processing',
            stage='text_extraction'
        )
        
        # Initialize document processor
        logger.info("Initializing document processor")
        processor = DocumentProcessor(logger=logger)
        
        # Process I-20 document
        print(f"Starting I-20 processing for document {document_id}")
        result = processor.process_i20(bucket, s3_key)
        
        print(f"Processing result: {result['status']}")
        logger.info(
            "Document processing completed",
            document_id=document_id,
            status=result['status'],
            stage=result.get('stage', 'unknown')
        )
        
        # Handle different result statuses
        if result['status'] == 'success':
            # Calculate timeline
            try:
                print("Calculating OPT timeline")
                program_end_date = result['data']['program_end_date']['value']
                
                timeline = TimelineCalculator.calculate_opt_timeline(
                    program_end_date=program_end_date,
                    current_status='planning_opt'
                )
                
                result['data']['timeline'] = timeline
                print(f"Timeline calculated: {timeline['status']}")
            
            except Exception as timeline_err:
                print(f"Timeline calculation failed: {str(timeline_err)}")
                logger.error("Timeline calculation failed", error=str(timeline_err))
                # Continue anyway - timeline is nice-to-have
            
            # Update DynamoDB with success
            update_document_status(
                user_id,
                document_id,
                'success',
                stage='complete',
                data=result['data'],
                validation_errors=result.get('validation_errors', [])
            )
            
            logger.info("Document processing successful", document_id=document_id)
        
        elif result['status'] == 'needs_verification':
            # Extraction successful but needs user verification
            update_document_status(
                user_id,
                document_id,
                'needs_verification',
                stage=result.get('stage'),
                data=result['data'],
                validation_errors=result.get('validation_errors', [])
            )
            
            logger.warning(
                "Document needs verification",
                document_id=document_id,
                warnings=len(result.get('validation_errors', []))
            )
        
        else:
            # Processing failed
            update_document_status(
                user_id,
                document_id,
                'failed',
                stage=result.get('stage'),
                error=result.get('error', 'Processing failed'),
                validation_errors=result.get('validation_errors', [])
            )
            
            logger.error(
                "Document processing failed",
                document_id=document_id,
                error=result.get('error'),
                stage=result.get('stage')
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed',
                'document_id': document_id,
                'status': result['status']
            })
        }
    
    except Exception as e:
        print(f"FATAL ERROR in process Lambda: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        logger.error("Fatal error in document processing", error=str(e))
        
        # Try to update DynamoDB with error
        try:
            if 'user_id' in locals() and 'document_id' in locals():
                update_document_status(
                    user_id,
                    document_id,
                    'failed',
                    stage='error',
                    error=f'Processing failed: {str(e)}'
                )
        except:
            pass
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal processing error',
                'message': str(e) if os.environ.get('ENVIRONMENT') == 'dev' else 'Processing failed'
            })
        }