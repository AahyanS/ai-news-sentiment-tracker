from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from dotenv import load_dotenv

load_dotenv()
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
HF_API_KEY = os.getenv("HF_API_KEY")

# The URL for the specific AI model we want to use on their servers
AI_API_URL = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest"
headers = {"Authorization": f"Bearer {HF_API_KEY}"}

@app.get("/news")
@app.get("/news")
def fetch_news(topic: str = "technology"):
    # --- Fetch Wikipedia Summary ---
    wiki_summary = ""
    try:
        # Clean the topic
        clean_topic = topic.strip()
        
        # Wikipedia prefers Title Case (e.g., 'Artificial Intelligence') 
        # but for short words, it often wants Upper Case (e.g., 'NASA')
        search_term = clean_topic.upper() if len(clean_topic) <= 4 else clean_topic.title()
        search_term = search_term.replace(' ', '_')

        wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{search_term}"
        
        # Added a User-Agent header to prevent Wikipedia from blocking the request
        headers_wiki = {'User-Agent': 'NewsSentimentBot/1.0'}
        wiki_res = requests.get(wiki_url, headers=headers_wiki, timeout=5)
        
        if wiki_res.status_code == 200:
            wiki_summary = wiki_res.json().get("extract", "")
        else:
            print(f"Wiki lookup failed for {search_term} (Status: {wiki_res.status_code})")
            
    except Exception as e:
        print(f"WIKI ERROR: {e}")

    # --- Existing NewsAPI Logic ---
    url = f"https://newsapi.org/v2/everything?q={topic}&language=en&pageSize=10&apiKey={NEWS_API_KEY}"
    response = requests.get(url).json()
    articles = response.get("articles", [])

    processed_articles = []
    
    for art in articles:
        if not art.get('title') or not art.get('url'): 
            continue 
        
        mood = "Neutral" 
        try:
            ai_response = requests.post(AI_API_URL, headers=headers, json={"inputs": art['title']}, timeout=10).json()
            
            if isinstance(ai_response, list) and len(ai_response) > 0:
                scores = {item['label']: item['score'] for item in ai_response[0]}
                pos = scores.get('positive', 0)
                neg = scores.get('negative', 0)
                
                SENSITIVITY = 0.20 
                if pos > SENSITIVITY and pos > neg:
                    mood = "Positive"
                elif neg > SENSITIVITY and neg > pos:
                    mood = "Negative"
        except Exception:
            mood = "Neutral"

        processed_articles.append({
            "title": art['title'],
            "url": art['url'],
            "mood": mood,
            # We ONLY attach the summary to the very first article
            "wiki_summary": wiki_summary if len(processed_articles) == 0 else ""
        })
        
    return processed_articles