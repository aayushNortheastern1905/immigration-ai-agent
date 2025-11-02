"""
Document Processor Module
Extracts structured data from immigration documents using AWS Textract and Google Gemini AI.

This module provides robust document processing with:
- Multi-stage error handling
- Confidence scoring
- Validation at each step
- Graceful degradation
"""

import boto3
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from ai_client import AIClient
from logger import get_logger
from errors import AIError


# Constants
MIN_TEXT_LENGTH = 100
MIN_CONFIDENCE_THRESHOLD = 0.75
HIGH_CONFIDENCE_THRESHOLD = 0.90
MAX_TEXT_LENGTH_FOR_AI = 8000

# Textract client
textract_client = boto3.client('textract')


class DocumentProcessor:
    """
    Processes immigration documents and extracts structured data.
    
    Supports:
    - I-20 forms (F-1 student visa)
    - EAD cards (Employment Authorization Document)
    
    Attributes:
        logger: Structured logger instance
        ai_client: Google Gemini AI client instance
    """
    
    def __init__(self, logger=None):
        """Initialize DocumentProcessor."""
        self.logger = logger or get_logger()
        self.ai_client = AIClient(logger=logger)
        self.logger.info("DocumentProcessor initialized")
    
    def process_i20(self, s3_bucket: str, s3_key: str) -> Dict:
        """
        Process I-20 form and extract key information.
        
        Args:
            s3_bucket: S3 bucket name containing the document
            s3_key: S3 object key (path to document)
        
        Returns:
            Dict containing:
                - status: 'success', 'extraction_failed', 'ai_failed', 'validation_failed', 'needs_verification'
                - data: Extracted structured data (if successful)
                - validation_errors: List of validation issues (if any)
                - error: Human-readable error message (if failed)
        """
        
        self.logger.info(
            "Starting I-20 processing",
            s3_bucket=s3_bucket,
            s3_key=s3_key
        )
        
        # Stage 1: Text Extraction
        extraction_result = self._extract_text(s3_bucket, s3_key)
        if not extraction_result['success']:
            return {
                'status': 'extraction_failed',
                'error': extraction_result['error'],
                'stage': 'text_extraction'
            }
        
        raw_text = extraction_result['text']
        
        # Stage 2: AI Structuring
        structuring_result = self._structure_i20_data(raw_text)
        if not structuring_result['success']:
            return {
                'status': 'ai_failed',
                'error': structuring_result['error'],
                'stage': 'ai_structuring'
            }
        
        structured_data = structuring_result['data']
        
        # Stage 3: Validation
        validation_result = self._validate_i20_data(structured_data)
        
        # Determine final status
        critical_errors = [e for e in validation_result['errors'] if e.get('severity') == 'critical']
        warning_errors = [e for e in validation_result['errors'] if e.get('severity') == 'warning']
        
        if critical_errors:
            self.logger.warning(
                "I-20 processing completed with critical validation errors",
                critical_count=len(critical_errors),
                warning_count=len(warning_errors)
            )
            return {
                'status': 'validation_failed',
                'data': structured_data,
                'validation_errors': validation_result['errors'],
                'error': f"Critical fields missing or invalid: {', '.join([e['field'] for e in critical_errors])}",
                'stage': 'validation'
            }
        
        elif warning_errors:
            self.logger.info(
                "I-20 processing completed with warnings",
                warning_count=len(warning_errors)
            )
            return {
                'status': 'needs_verification',
                'data': structured_data,
                'validation_errors': validation_result['errors'],
                'message': 'Data extracted but needs verification',
                'stage': 'validation'
            }
        
        else:
            self.logger.info("I-20 processing completed successfully")
            return {
                'status': 'success',
                'data': structured_data,
                'validation_errors': [],
                'stage': 'complete'
            }
    
    def _extract_text(self, s3_bucket: str, s3_key: str) -> Dict:
        """
        Extract text from PDF using AWS Textract.
        
        Args:
            s3_bucket: S3 bucket name
            s3_key: S3 object key
        
        Returns:
            Dict with 'success' (bool), 'text' (str) or 'error' (str)
        """
        
        try:
            self.logger.info("Calling AWS Textract", s3_bucket=s3_bucket, s3_key=s3_key)
            
            response = textract_client.analyze_document(
                Document={
                    'S3Object': {
                        'Bucket': s3_bucket,
                        'Name': s3_key
                    }
                },
                FeatureTypes=['FORMS', 'TABLES']
            )
            
            # Extract text from all LINE blocks
            text_blocks = []
            for block in response.get('Blocks', []):
                if block.get('BlockType') == 'LINE':
                    text = block.get('Text', '')
                    if text:
                        text_blocks.append(text)
            
            raw_text = '\n'.join(text_blocks)
            
            self.logger.info(
                "Textract extraction completed",
                text_length=len(raw_text),
                blocks_found=len(text_blocks)
            )
            
            # Validate minimum text length
            if len(raw_text) < MIN_TEXT_LENGTH:
                self.logger.warning(
                    "Extracted text too short",
                    text_length=len(raw_text),
                    minimum_required=MIN_TEXT_LENGTH
                )
                return {
                    'success': False,
                    'error': f'Could not extract enough text ({len(raw_text)} chars). Please upload a clear, readable PDF.'
                }
            
            return {
                'success': True,
                'text': raw_text
            }
        
        except Exception as e:
            error_name = type(e).__name__
            
            if 'InvalidS3ObjectException' in error_name:
                self.logger.error("Invalid S3 object for Textract")
                return {
                    'success': False,
                    'error': 'Document not found or cannot be accessed. Please try uploading again.'
                }
            
            elif 'UnsupportedDocumentException' in error_name:
                self.logger.error("Unsupported document type")
                return {
                    'success': False,
                    'error': 'Document type not supported. Please upload a PDF file.'
                }
            
            else:
                self.logger.error("Textract extraction failed", error=str(e), error_type=error_name)
                return {
                    'success': False,
                    'error': 'Text extraction failed. Please try a different file or contact support.'
                }
    
    def _structure_i20_data(self, raw_text: str) -> Dict:
        """
        Use Gemini AI to extract structured fields from I-20 text.
        
        Args:
            raw_text: Extracted text from Textract
        
        Returns:
            Dict with 'success' (bool), 'data' (dict) or 'error' (str)
        """
        
        try:
            # Truncate text if too long
            text_to_process = raw_text[:MAX_TEXT_LENGTH_FOR_AI]
            if len(raw_text) > MAX_TEXT_LENGTH_FOR_AI:
                self.logger.info(
                    "Truncating text for AI processing",
                    original_length=len(raw_text),
                    truncated_length=MAX_TEXT_LENGTH_FOR_AI
                )
            
            prompt = self._build_i20_extraction_prompt(text_to_process)
            
            self.logger.info("Calling Gemini AI for I-20 structuring")
            
            response = self.ai_client.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean markdown code blocks
            response_text = self._clean_ai_response(response_text)
            
            # Parse JSON
            try:
                data = json.loads(response_text)
            except json.JSONDecodeError as json_err:
                self.logger.error(
                    "Failed to parse AI response as JSON",
                    response_preview=response_text[:200],
                    error=str(json_err)
                )
                return {
                    'success': False,
                    'error': 'AI response could not be parsed. Please try again.'
                }
            
            self.logger.info(
                "Gemini AI structuring completed",
                fields_extracted=len(data)
            )
            
            return {
                'success': True,
                'data': data
            }
        
        except AIError as ai_err:
            self.logger.error("Gemini AI processing failed", error=str(ai_err))
            return {
                'success': False,
                'error': 'AI processing failed. Please try again or contact support.'
            }
        
        except Exception as e:
            self.logger.error(
                "Unexpected error in AI structuring",
                error=str(e),
                error_type=type(e).__name__
            )
            return {
                'success': False,
                'error': 'An unexpected error occurred during data extraction. Please try again.'
            }
    
    def _build_i20_extraction_prompt(self, text: str) -> str:
        """Build prompt for Gemini AI to extract I-20 fields."""
        
        prompt = f"""Extract the following fields from this I-20 form text.
Return ONLY valid JSON with confidence scores (0.0 to 1.0) for each field.

Required fields:
- full_name: Student's full legal name
- sevis_id: SEVIS ID number (format: N followed by 10 digits)
- date_of_birth: Date of birth (YYYY-MM-DD format)
- program_end_date: Program end date (YYYY-MM-DD format)
- school_name: School/university name
- degree_program: Degree and major (e.g., "Master of Science in Computer Science")
- school_address: School's full address

Return format:
{{
  "full_name": {{"value": "John Doe", "confidence": 0.95}},
  "sevis_id": {{"value": "N0012345678", "confidence": 0.98}},
  "date_of_birth": {{"value": "1995-06-15", "confidence": 0.90}},
  "program_end_date": {{"value": "2025-12-15", "confidence": 0.92}},
  "school_name": {{"value": "Northeastern University", "confidence": 0.99}},
  "degree_program": {{"value": "Master of Science in Computer Science", "confidence": 0.93}},
  "school_address": {{"value": "360 Huntington Ave, Boston, MA 02115", "confidence": 0.88}}
}}

I-20 Text:
{text}

Return ONLY the JSON object, nothing else."""
        
        return prompt
    
    def _clean_ai_response(self, response_text: str) -> str:
        """Clean AI response by removing markdown code blocks."""
        
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        return response_text.strip()
    
    def _validate_i20_data(self, data: Dict) -> Dict:
        """
        Validate extracted I-20 data against business rules.
        
        Args:
            data: Structured I-20 data from AI
        
        Returns:
            Dict with 'errors' list containing validation issues
        """
        
        errors = []
        
        # Required fields
        required_fields = {
            'full_name': 'Student name',
            'sevis_id': 'SEVIS ID',
            'program_end_date': 'Program end date',
            'school_name': 'School name'
        }
        
        # Check for missing fields
        for field, display_name in required_fields.items():
            if field not in data:
                errors.append({
                    'field': field,
                    'severity': 'critical',
                    'message': f'{display_name} is missing and is required',
                    'suggestion': 'Please upload a clearer I-20 or enter manually'
                })
                continue
            
            # Check confidence threshold
            confidence = data[field].get('confidence', 0)
            if confidence < MIN_CONFIDENCE_THRESHOLD:
                errors.append({
                    'field': field,
                    'severity': 'warning',
                    'message': f'Low confidence ({confidence:.0%}) for {display_name}',
                    'suggestion': 'Please verify this value is correct',
                    'value': data[field].get('value')
                })
        
        # Validate SEVIS ID format
        if 'sevis_id' in data:
            sevis_value = data['sevis_id'].get('value', '')
            if not self._validate_sevis_format(sevis_value):
                errors.append({
                    'field': 'sevis_id',
                    'severity': 'critical',
                    'message': f'Invalid SEVIS ID format: "{sevis_value}"',
                    'suggestion': 'SEVIS ID should be "N" followed by 10 digits (e.g., N0012345678)',
                    'value': sevis_value
                })
        
        # Validate program end date
        if 'program_end_date' in data:
            date_errors = self._validate_program_end_date(data['program_end_date'].get('value'))
            errors.extend(date_errors)
        
        # Validate name
        if 'full_name' in data:
            name = data['full_name'].get('value', '')
            if len(name) < 3:
                errors.append({
                    'field': 'full_name',
                    'severity': 'critical',
                    'message': 'Name is too short or missing',
                    'value': name
                })
        
        # Validate school name
        if 'school_name' in data:
            school = data['school_name'].get('value', '')
            if len(school) < 3:
                errors.append({
                    'field': 'school_name',
                    'severity': 'critical',
                    'message': 'School name is too short or missing',
                    'value': school
                })
        
        self.logger.info(
            "Validation completed",
            total_errors=len(errors),
            critical_errors=len([e for e in errors if e['severity'] == 'critical']),
            warnings=len([e for e in errors if e['severity'] == 'warning'])
        )
        
        return {'errors': errors}
    
    def _validate_sevis_format(self, sevis_id: str) -> bool:
        """Validate SEVIS ID format (N + 10 digits)."""
        pattern = r'^N\d{10}$'
        return bool(re.match(pattern, sevis_id))
    
    def _validate_program_end_date(self, date_str: str) -> List[Dict]:
        """Validate program end date is logical and in expected range."""
        errors = []
        
        try:
            end_date = datetime.fromisoformat(date_str)
            today = datetime.now()
            
            # Check if date is too far in the past (> 2 years)
            two_years_ago = today - timedelta(days=730)
            if end_date < two_years_ago:
                errors.append({
                    'field': 'program_end_date',
                    'severity': 'warning',
                    'message': f'Program end date ({date_str}) is over 2 years ago',
                    'suggestion': 'This may be an old I-20. Please verify this is your current I-20.',
                    'value': date_str
                })
            
            # Check if date is too far in future (> 6 years)
            six_years_from_now = today + timedelta(days=2190)
            if end_date > six_years_from_now:
                errors.append({
                    'field': 'program_end_date',
                    'severity': 'warning',
                    'message': f'Program end date ({date_str}) is over 6 years away',
                    'suggestion': 'Please verify this date is correct.',
                    'value': date_str
                })
        
        except (ValueError, TypeError):
            errors.append({
                'field': 'program_end_date',
                'severity': 'critical',
                'message': 'Invalid date format for program end date',
                'suggestion': 'Date should be in YYYY-MM-DD format',
                'value': date_str
            })
        
        return errors