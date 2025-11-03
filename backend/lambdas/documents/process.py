import json
import os
import boto3
from datetime import datetime
from decimal import Decimal
import traceback

s3_client = boto3.client('s3')
textract_client = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')

DOCUMENTS_TABLE = os.environ.get('DOCUMENTS_TABLE', 'immigration-documents')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Gemini error: {e}")

def lambda_handler(event, context):
    print(f"Event: {json.dumps(event)}")
    try:
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        parts = key.split('/')
        user_id = parts[1]
        doc_id = parts[2].split('_')[0]
        
        update_status(user_id, doc_id, 'processing')
        text = extract_text(bucket, key)
        data = analyze_ai(text)
        save_data(user_id, doc_id, data, text)
        update_status(user_id, doc_id, 'success')
        
        return {'statusCode': 200}
    except Exception as e:
        print(f"ERROR: {e}\n{traceback.format_exc()}")
        try:
            parts = event['Records'][0]['s3']['object']['key'].split('/')
            update_status(parts[1], parts[2].split('_')[0], 'failed', str(e))
        except: pass
        return {'statusCode': 500}

def extract_text(bucket, key):
    resp = textract_client.detect_document_text(
        Document={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    return '\n'.join([b['Text'] for b in resp.get('Blocks', []) if b['BlockType'] == 'LINE'])

def analyze_ai(text):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""Extract I-20 data as JSON only:
{{"full_name":"","sevis_id":"","date_of_birth":"","school_name":"","program_end_date":"","confidence_scores":{{}}}}
Text: {text[:2000]}"""
        result = model.generate_content(prompt).text.strip()
        if '```' in result:
            result = result.split('```')[1].replace('json','').strip()
        return json.loads(result)
    except Exception as e:
        return {"error": str(e)}

def save_data(uid, did, data, text):
    if 'confidence_scores' in data:
        data['confidence_scores'] = {k: Decimal(str(v)) for k, v in data['confidence_scores'].items() if isinstance(v, (int, float))}
    dynamodb.Table(DOCUMENTS_TABLE).update_item(
        Key={'user_id': uid, 'document_id': did},
        UpdateExpression='SET extracted_data=:d, raw_text=:t, processed_at=:time',
        ExpressionAttributeValues={':d': data, ':t': text[:5000], ':time': datetime.utcnow().isoformat()}
    )

def update_status(uid, did, status, error=None):
    try:
        expr = 'SET #s=:st, updated_at=:t'
        vals = {':st': status, ':t': datetime.utcnow().isoformat()}
        if error:
            expr += ', error_message=:e'
            vals[':e'] = error[:500]
        dynamodb.Table(DOCUMENTS_TABLE).update_item(
            Key={'user_id': uid, 'document_id': did},
            UpdateExpression=expr,
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues=vals
        )
    except Exception as e:
        print(f"Status error: {e}")