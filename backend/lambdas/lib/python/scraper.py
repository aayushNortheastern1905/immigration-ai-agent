"""
USCIS Web Scraper with Retry Logic
"""

import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
from urllib.parse import urljoin
from errors import USCISUnreachableError
from logger import get_logger

USCIS_NEWS_URL = "https://www.uscis.gov/newsroom/news-releases"
USCIS_BASE_URL = "https://www.uscis.gov"
MAX_RETRIES = 3
RETRY_DELAY = 2
REQUEST_TIMEOUT = 30


class USCISScraper:
    """Robust USCIS website scraper"""
    
    def __init__(self, logger=None):
        self.logger = logger or get_logger()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Immigration-AI-Bot/1.0',
            'Accept': 'text/html,application/xhtml+xml'
        })
    
    def _make_request(self, url: str, retries: int = MAX_RETRIES):
        """Make HTTP request with retry logic"""
        for attempt in range(retries):
            try:
                print(f"Fetching URL (attempt {attempt + 1}/{retries}): {url}")
                
                response = self.session.get(url, timeout=REQUEST_TIMEOUT)
                response.raise_for_status()
                
                print(f"Request successful: {response.status_code}")
                return response
            
            except requests.Timeout:
                print(f"Timeout (attempt {attempt + 1}/{retries})")
                if attempt == retries - 1:
                    raise USCISUnreachableError(f"Timeout after {retries} attempts")
                time.sleep(RETRY_DELAY * (2 ** attempt))
            
            except requests.RequestException as e:
                print(f"Request failed (attempt {attempt + 1}/{retries}): {str(e)}")
                if attempt == retries - 1:
                    raise USCISUnreachableError(f"Failed after {retries} attempts: {str(e)}")
                time.sleep(RETRY_DELAY * (2 ** attempt))
        
        raise USCISUnreachableError("Request failed")
    
    def scrape_news_page(self):
        """Scrape USCIS news page for policy announcements"""
        try:
            print("Starting USCIS news page scrape...")
            
            response = self._make_request(USCIS_NEWS_URL)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            policies = []
            
            # USCIS uses div.views-row for articles
            print("Looking for articles with class 'views-row'...")
            articles = soup.find_all('div', class_='views-row')
            
            print(f"Found {len(articles)} articles with class 'views-row'")
            
            if not articles:
                print("No articles found!")
                return []
            
            for idx, article in enumerate(articles[:20], 1):
                try:
                    print(f"\nParsing article {idx}...")
                    
                    # Extract title from views-field-title
                    title_div = article.find('div', class_='views-field-title')
                    if not title_div:
                        print(f"  No title div found for article {idx}")
                        continue
                    
                    title_elem = title_div.find('a')
                    if not title_elem:
                        print(f"  No title link found for article {idx}")
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    print(f"  Title: {title[:60]}...")
                    
                    # Extract link
                    url = urljoin(USCIS_BASE_URL, title_elem['href'])
                    print(f"  URL: {url}")
                    
                    # Extract date from time element
                    date_div = article.find('div', class_='views-field-field-display-date')
                    date_elem = date_div.find('time') if date_div else None
                    date_str = date_elem.get('datetime') if date_elem else None
                    print(f"  Date: {date_str}")
                    
                    # Filter for immigration-related content
                    is_immigration = self._is_immigration_related(title)
                    print(f"  Is immigration-related: {is_immigration}")
                    
                    if is_immigration:
                        policies.append({
                            'title': title,
                            'url': url,
                            'published_date': self._parse_date(date_str)
                        })
                        print(f"  ✓ Added to policies list!")
                
                except Exception as e:
                    print(f"  Error parsing article {idx}: {str(e)}")
                    continue
            
            print(f"\n=== SCRAPING SUMMARY ===")
            print(f"Total articles found: {len(articles)}")
            print(f"Immigration-related policies: {len(policies)}")
            
            return policies
        
        except Exception as e:
            print(f"ERROR in scrape_news_page: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise
    
    def fetch_policy_content(self, url: str) -> str:
        """Fetch full content of a policy page"""
        try:
            print(f"Fetching policy content from: {url}")
            
            response = self._make_request(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find main content
            content_div = soup.find('div', class_='field-item') or soup.find('main') or soup.find('article')
            
            if not content_div:
                print("Could not find content div")
                return ""
            
            text = content_div.get_text(separator='\n', strip=True)
            
            print(f"Content fetched: {len(text)} characters")
            return text
        
        except Exception as e:
            print(f"Error fetching content: {str(e)}")
            return ""
    
    def _is_immigration_related(self, title: str) -> bool:
        """Check if title is immigration-related"""
        keywords = [
            'visa', 'immigration', 'opt', 'h-1b', 'f-1', 'stem',
            'work authorization', 'ead', 'i-20', 'i-797', 'green card',
            'petition', 'nonimmigrant', 'employment', 'temporary protected status',
            'tps', 'asylum', 'refugee', 'naturalization', 'citizenship'
        ]
        title_lower = title.lower()
        return any(kw in title_lower for kw in keywords)
    
    def _parse_date(self, date_str: str) -> str:
        """Parse date string to ISO format"""
        if not date_str:
            return datetime.utcnow().isoformat() + 'Z'
        
        try:
            if 'T' in date_str:
                return date_str
            
            for fmt in ['%B %d, %Y', '%m/%d/%Y', '%Y-%m-%d']:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.isoformat() + 'Z'
                except ValueError:
                    continue
            
            return datetime.utcnow().isoformat() + 'Z'
        except Exception:
            return datetime.utcnow().isoformat() + 'Z'