"""
Policy Scraper Lambda Function
Scrapes USCIS, analyzes with Gemini AI, stores in DynamoDB
"""

import json

# Import directly - Lambda Layer adds /opt/python to path
from errors import (
    USCISUnreachableError,
    AIError,
    DuplicatePolicyError,
    DatabaseError
)
from logger import get_logger
from scraper import USCISScraper
from ai_client import AIClient
from dynamodb import PolicyRepository


def create_response(status_code, body):
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body, default=str)
    }


def lambda_handler(event, context):
    """Main Lambda handler for policy scraping"""
    
    print("=== LAMBDA HANDLER STARTED ===")
    
    # Initialize logger
    request_id = context.aws_request_id if context else 'local-test'
    logger = get_logger(correlation_id=request_id)
    
    print(f"Logger initialized with request_id: {request_id}")
    logger.info("=== Policy Scraper Lambda Started ===")
    
    # Initialize components
    print("Initializing scraper components...")
    scraper = USCISScraper(logger=logger)
    ai_client = AIClient(logger=logger)
    policy_repo = PolicyRepository(logger=logger)
    print("All components initialized!")
    
    # Track results
    results = {
        'scraped': 0,
        'analyzed': 0,
        'saved': 0,
        'duplicates': 0,
        'errors': 0,
        'policies': []
    }
    
    try:
        # Step 1: Scrape USCIS news page
        print("Step 1: Starting USCIS scrape...")
        logger.info("Step 1: Scraping USCIS news page")
        
        try:
            policies = scraper.scrape_news_page()
            results['scraped'] = len(policies)
            
            print(f"Scraped {len(policies)} policies from USCIS")
            logger.info(f"Scraped {len(policies)} policies from USCIS")
            
            if not policies:
                print("No policies found - ending scrape")
                logger.info("No policies found - ending scrape")
                return create_response(200, {
                    'success': True,
                    'message': 'No new policies found',
                    'results': results
                })
        
        except USCISUnreachableError as e:
            print(f"USCIS website unreachable: {str(e)}")
            logger.error("USCIS website unreachable", error=e)
            return create_response(503, {
                'success': False,
                'error': {
                    'code': 'USCIS_UNREACHABLE',
                    'message': 'Could not reach USCIS website'
                },
                'results': results
            })
        
        # Step 2: Process each policy
        print(f"Step 2: Processing {len(policies)} policies")
        logger.info(f"Step 2: Processing {len(policies)} policies")
        
        for idx, policy in enumerate(policies[:10], 1):
            try:
                print(f"Processing policy {idx}: {policy['title'][:50]}...")
                logger.info(f"Processing policy {idx}/{len(policies[:10])}", title=policy['title'])
                
                # Fetch full content
                content = scraper.fetch_policy_content(policy['url'])
                print(f"Fetched content length: {len(content)}")
                
                if not content:
                    content = policy['title']
                
                # Analyze with Gemini AI
                print("Calling Gemini AI for analysis...")
                logger.info("Analyzing policy with Gemini AI")
                
                try:
                    analysis = ai_client.analyze_policy(
                        title=policy['title'],
                        content=content
                    )
                    
                    results['analyzed'] += 1
                    print(f"AI analysis complete: {analysis['impact_level']}")
                    
                    logger.info(
                        "AI analysis complete",
                        affected_visas=analysis['affected_visas'],
                        impact_level=analysis['impact_level']
                    )
                
                except AIError as e:
                    print(f"AI analysis failed: {str(e)}")
                    logger.error(f"AI analysis failed for policy {idx}", error=e)
                    results['errors'] += 1
                    continue
                
                # Prepare policy data
                policy_data = {
                    'title': policy['title'],
                    'summary': analysis['summary'],
                    'impact_level': analysis['impact_level'],
                    'affected_visas': analysis['affected_visas'],
                    'action_items': analysis.get('action_items', []),
                    'source_url': policy['url'],
                    'raw_content': content[:5000],
                    'published_date': policy['published_date']
                }
                
                # Save to DynamoDB
                print("Saving to DynamoDB...")
                try:
                    policy_id = policy_repo.save_policy(policy_data, check_duplicate=True)
                    
                    results['saved'] += 1
                    results['policies'].append({
                        'policy_id': policy_id,
                        'title': policy['title'],
                        'impact_level': analysis['impact_level']
                    })
                    
                    print(f"Policy saved with ID: {policy_id}")
                    logger.info("Policy saved to database", policy_id=policy_id)
                
                except DuplicatePolicyError:
                    print("Duplicate policy - skipping")
                    logger.info("Duplicate policy - skipping", title=policy['title'])
                    results['duplicates'] += 1
                    continue
                
                except DatabaseError as e:
                    print(f"Database error: {str(e)}")
                    logger.error(f"Database error for policy {idx}", error=e)
                    results['errors'] += 1
                    continue
            
            except Exception as e:
                print(f"Unexpected error processing policy {idx}: {str(e)}")
                logger.error(f"Unexpected error processing policy {idx}", error=e)
                results['errors'] += 1
                continue
        
        # Final summary
        print(f"=== SCRAPING COMPLETE ===")
        print(f"Scraped: {results['scraped']}, Analyzed: {results['analyzed']}, Saved: {results['saved']}")
        logger.info(
            "=== Scraping Complete ===",
            scraped=results['scraped'],
            analyzed=results['analyzed'],
            saved=results['saved'],
            duplicates=results['duplicates'],
            errors=results['errors']
        )
        
        return create_response(200, {
            'success': True,
            'message': f"Processed {results['analyzed']} policies, saved {results['saved']} new ones",
            'results': results
        })
    
    except Exception as e:
        print(f"FATAL ERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())
        logger.error("Fatal error in scraper Lambda", error=e)
        return create_response(500, {
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred',
                'details': str(e)
            },
            'results': results
        })