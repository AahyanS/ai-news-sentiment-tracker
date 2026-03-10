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
    url = f"https://newsapi.org/v2/everything?q={topic}&language=en&pageSize=10&apiKey={NEWS_API_KEY}"
    response = requests.get(url).json()
    articles = response.get("articles", [])

    processed_articles = []
    
    for art in articles:
        if not art.get('title') or not art.get('url'): 
            continue 
        
        try:
            # Ask Hugging Face
            ai_response = requests.post(AI_API_URL, headers=headers, json={"inputs": art['title']}).json()
            
            if isinstance(ai_response, dict) and "error" in ai_response:
                print(f"HUGGING FACE ERROR: {ai_response['error']}")
                mood = "Neutral"
            else:
                # The AI returns a list of dictionaries with all 3 scores. 
                # Let's organize them so we can see the exact percentages.
                scores = {item['label']: item['score'] for item in ai_response[0]}
                
                pos = scores.get('positive', 0)
                neg = scores.get('negative', 0)
                
                # --- SENSITIVITY DIAL ---
                # Lower number = more sensitive. (0.20 means if it's even 20% emotional, we flag it!)
                SENSITIVITY = 0.20 
                
                if pos > SENSITIVITY and pos > neg:
                    mood = "Positive"
                elif neg > SENSITIVITY and neg > pos:
                    mood = "Negative"
                else:
                    mood = "Neutral"
                    
                print(f"Success! '{art['title'][:20]}...' -> {mood} (Pos: {pos:.2f}, Neg: {neg:.2f})")

        except Exception as e:
            print(f"CODE ERROR: {e}")
            mood = "Neutral"

        processed_articles.append({
            "title": art['title'],
            "url": art['url'],
            "mood": mood
        })
        
    return processed_articles