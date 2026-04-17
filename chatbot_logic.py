import os
import google.generativeai as genai
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

# Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

tavily = None
if TAVILY_API_KEY:
    tavily = TavilyClient(api_key=TAVILY_API_KEY)

# Stable model
model = genai.GenerativeModel("gemini-3-flash-preview") # Using a stable name, previous 'gemini-3' was likely a typo or future reference in user's prompt

def generate_followups(question):
    """Generate 3 unique follow-up questions"""
    prompt = f"""
    You are a financial assistant.

    Generate exactly 3 unique follow-up questions 
    to better understand the user's situation.

    Rules:
    - Questions must be different from each other
    - Keep them short and relevant
    - Ask one about income, one about risk, one about obligations

    Question: {question}

    Return ONLY numbered questions.
    """
    try:
        response = model.generate_content(prompt)
        lines = response.text.split("\n")
        questions = []

        for line in lines:
            line = line.strip()
            if line:
                # remove numbering like 1. 2. etc
                cleaned = line.lstrip("1234567890. ").strip()
                if cleaned:
                    questions.append(cleaned)
        
        return questions[:3]
    except Exception as e:
        print(f"Error generating followups: {e}")
        return ["What is your monthly income?", "What is your risk tolerance?", "Do you have any major monthly obligations?"]

def tavily_search(query):
    """Web search using Tavily"""
    if not tavily:
        return "No web data available (Tavily not configured)"
    try:
        result = tavily.search(query=query, max_results=3)
        sources = []
        for r in result["results"]:
            sources.append(f"{r['title']}: {r['content']}")
        return "\n".join(sources)
    except Exception as e:
        print(f"Tavily search error: {e}")
        return "No web data available"

def generate_final_answer(question, answers, web_data):
    """Final reasoning agent"""
    context = "\n".join([f"Q&A: {a}" for a in answers])

    prompt = f"""
    You are an expert financial advisor AI named ArthSaathi.

    User Question:
    {question}

    User Details Provided:
    {context}

    Web Insights:
    {web_data}

    Instructions:
    - Give a personalized investment plan
    - Include allocation (percentages)
    - Keep it simple and practical
    - Avoid generic advice
    - Use a professional yet helpful tone

    Final Answer:
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"I apologize, I encountered an error generating your plan: {str(e)}"
