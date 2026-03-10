from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
HF_API_KEY = os.getenv("HF_API_KEY")

AI_API_URL = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest"
headers = {"Authorization": f"Bearer {HF_API_KEY}"}

@app.get("/news")
def fetch_news(topic: str = "technology", page: int = 1):
    # --- 1. Fetch Wikipedia Summary (Only for Page 1) ---
    wiki_summary = ""
    if page == 1:
        try:
            clean_topic = topic.strip()
            search_term = clean_topic.upper() if len(clean_topic) <= 4 else clean_topic.title()
            search_term = search_term.replace(' ', '_')
            wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{search_term}"
            headers_wiki = {'User-Agent': 'NewsSentimentBot/1.0'}
            wiki_res = requests.get(wiki_url, headers=headers_wiki, timeout=5)
            if wiki_res.status_code == 200:
                wiki_summary = wiki_res.json().get("extract", "")
        except Exception as e:
            print(f"WIKI ERROR: {e}")

    # --- 2. NewsAPI Logic with Pagination ---
    url = f"https://newsapi.org/v2/everything?q={topic}&language=en&pageSize=10&page={page}&apiKey={NEWS_API_KEY}"
    response = requests.get(url).json()
    articles = response.get("articles", [])

    processed_articles = []
    
    for art in articles:
        if not art.get('title') or not art.get('url'): 
            continue 
        
        mood = "Neutral" 
        try:
            ai_res = requests.post(AI_API_URL, headers=headers, json={"inputs": art['title']}, timeout=10).json()
            if isinstance(ai_res, list) and len(ai_res) > 0:
                scores = {item['label']: item['score'] for item in ai_res[0]}
                pos, neg = scores.get('positive', 0), scores.get('negative', 0)
                SENSITIVITY = 0.20 
                if pos > SENSITIVITY and pos > neg: mood = "Positive"
                elif neg > SENSITIVITY and neg > pos: mood = "Negative"
        except Exception:
            mood = "Neutral"

        processed_articles.append({
            "title": art['title'],
            "url": art['url'],
            "mood": mood,
            # Attach wiki_summary only to the first article of page 1
            "wiki_summary": wiki_summary if (len(processed_articles) == 0 and page == 1) else ""
        })
        
    return processed_articles