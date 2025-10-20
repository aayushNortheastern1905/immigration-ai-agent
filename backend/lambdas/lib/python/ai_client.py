"""
Google Gemini AI Client for Policy Analysis
FREE tier - no credit card needed!
"""

import google.generativeai as genai
import os
import json
import time
from errors import AITimeoutError, AIInvalidResponseError
from logger import get_logger
from validators import Validators


class AIClient:
    """Handles Google Gemini API interactions"""
    
    def __init__(self, logger=None):
        self.logger = logger or get_logger()
        
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable required")
        
        print(f"Configuring Gemini API with key: {api_key[:10]}...")
        genai.configure(api_key=api_key)
        
        # Use Gemini 2.5 Flash - latest free model
        model_name = 'models/gemini-2.5-flash'
        print(f"Initializing Gemini model: {model_name}")
        self.model = genai.GenerativeModel(model_name)
        print("Gemini model initialized successfully!")
    
    def analyze_policy(self, title: str, content: str, max_retries: int = 3) -> dict:
        """
        Analyze immigration policy using Google Gemini
        
        Returns:
        {
            'affected_visas': ['F-1', 'OPT'],
            'impact_level': 'High',
            'summary': 'Plain English explanation...',
            'action_items': ['Action 1', 'Action 2']
        }
        """
        print(f"Starting policy analysis for: {title[:50]}...")
        self.logger.info("Starting policy analysis", title=title, content_length=len(content))
        
        prompt = self._build_prompt(title, content)
        
        for attempt in range(max_retries):
            try:
                print(f"Calling Gemini API (attempt {attempt + 1}/{max_retries})")
                self.logger.info(f"Calling Gemini API (attempt {attempt + 1}/{max_retries})")
                
                response = self.model.generate_content(prompt)
                
                print("Gemini API call successful!")
                self.logger.info("Gemini API call successful")
                
                # Parse response
                analysis = self._parse_response(response.text)
                print(f"Analysis parsed: Impact={analysis.get('impact_level')}, Visas={analysis.get('affected_visas')}")
                
                # Validate
                validated = Validators.validate_policy_data({
                    'title': title,
                    **analysis
                })
                
                print("Validation successful!")
                
                return {
                    'affected_visas': validated['affected_visas'],
                    'impact_level': validated['impact_level'],
                    'summary': validated['summary'],
                    'action_items': validated.get('action_items', [])
                }
            
            except Exception as e:
                print(f"Gemini API error (attempt {attempt + 1}/{max_retries}): {str(e)[:200]}")
                self.logger.error(f"Gemini API error (attempt {attempt + 1}/{max_retries})", error=e)
                
                if attempt == max_retries - 1:
                    raise AIInvalidResponseError(f"Failed after {max_retries} attempts: {str(e)}")
                
                time.sleep(2 ** attempt)  # Exponential backoff
        
        raise AIInvalidResponseError("Failed to analyze policy")
    
    def _build_prompt(self, title: str, content: str) -> str:
        """Build analysis prompt"""
        # Truncate content if too long
        max_length = 8000
        if len(content) > max_length:
            content = content[:max_length] + "..."
        
        return f"""Analyze this immigration policy announcement and provide structured analysis.

POLICY TITLE:
{title}

POLICY CONTENT:
{content}

Provide your analysis in this EXACT JSON format:
{{
  "affected_visas": ["F-1", "OPT", "H-1B"],
  "impact_level": "High",
  "summary": "A 2-3 sentence plain English explanation",
  "action_items": ["Specific action 1", "Specific action 2"]
}}

RULES:
1. affected_visas: List visa types affected. Options: F-1, OPT, H-1B, L-1, O-1. Use empty array if none.
2. impact_level: Must be exactly one of: Critical, High, Medium, Low
   - Critical: Immediate action required, deadline-sensitive
   - High: Significant changes affecting many people
   - Medium: Moderate changes
   - Low: Minor updates
3. summary: Write for non-experts. Explain practical implications in 2-3 sentences.
4. action_items: List 2-5 specific actionable steps. Use empty array if none needed.

Return ONLY the JSON object, nothing else."""
    
    def _parse_response(self, response_text: str) -> dict:
        """Parse Gemini response into structured data"""
        try:
            print(f"Parsing Gemini response: {response_text[:200]}...")
            response_text = response_text.strip()
            
            # Remove markdown code blocks
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            # Parse JSON
            data = json.loads(response_text)
            print("JSON parsed successfully!")
            
            # Validate required fields
            required = ['affected_visas', 'impact_level', 'summary']
            for field in required:
                if field not in data:
                    raise AIInvalidResponseError(f"Missing required field: {field}")
            
            # Ensure lists
            if not isinstance(data['affected_visas'], list):
                data['affected_visas'] = [data['affected_visas']] if data['affected_visas'] else []
            
            if 'action_items' in data and not isinstance(data['action_items'], list):
                data['action_items'] = [data['action_items']] if data['action_items'] else []
            
            return data
        
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {str(e)}")
            self.logger.error("Failed to parse Gemini response as JSON", response=response_text[:500], error=str(e))
            raise AIInvalidResponseError(f"Could not parse response: {str(e)}")
        
        except Exception as e:
            print(f"Parse error: {str(e)}")
            self.logger.error("Error parsing Gemini response", error=e)
            raise AIInvalidResponseError(f"Parse error: {str(e)}")