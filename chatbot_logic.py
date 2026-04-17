import os
import re
import json
import requests
from dotenv import load_dotenv
from groq import Groq
from tavily import TavilyClient

load_dotenv()

# ================= CONFIG =================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

client = Groq(api_key=GROQ_API_KEY)
tavily = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None

MODEL = "openai/gpt-oss-120b"


# ================= RESPONSE CLEANER =================
def clean_response(text: str) -> str:
    """
    Strips markdown bold/italic markers (*** and **) from LLM output.
    Converts markdown-style tables to clean plain-text (kept intact for HTML rendering).
    """
    if not text:
        return text
    # Remove triple-star bold+italic: ***text***
    text = re.sub(r'\*{3}(.+?)\*{3}', r'\1', text, flags=re.DOTALL)
    # Remove double-star bold: **text**
    text = re.sub(r'\*{2}(.+?)\*{2}', r'\1', text, flags=re.DOTALL)
    # Remove single-star italic: *text*
    text = re.sub(r'\*(.+?)\*', r'\1', text, flags=re.DOTALL)
    # Remove leftover lone stars
    text = re.sub(r'\*+', '', text)
    # Clean up excessive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ================= LLM CALL =================
def call_llm(prompt):
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are ArthSaathi, a financial AI advisor. Always respond in clean plain text. Do NOT use markdown bold (**) or italic (*) markers. Use plain numbered lists and dashes. Use ASCII tables where tabular data is needed."},
            {"role": "user", "content": prompt}
        ]
    )
    return clean_response(response.choices[0].message.content)


# ================= FOLLOWUPS (PROMPT-DRIVEN) =================
def generate_followups(question):
    prompt = f"""
You are an expert financial interviewer.

Given a user's question, generate 3 highly relevant follow-up questions.

Rules:
- Do NOT use fixed categories like income/risk/obligations
- Instead, infer what information is missing
- Each question must explore a DIFFERENT aspect
- Questions must help build a better financial plan
- Keep them simple and conversational

Return ONLY valid JSON in this format:

{{
  "questions": [
    "...",
    "...",
    "..."
  ]
}}

User Question:
{question}
"""

    text = call_llm(prompt)

    try:
        data = json.loads(text)
        return data["questions"][:3]
    except:
        # fallback if model breaks JSON
        return [
            "What is your monthly income range?",
            "What is your investment time horizon?",
            "How much risk are you comfortable with?"
        ]


# ================= TAVILY SEARCH =================
def tavily_search(query):
    if not tavily:
        return "No web data"

    res = tavily.search(query=query, max_results=3)
    data = []
    for r in res["results"]:
        url = r.get("url", "Unknown Source")
        content = r.get("content", "")
        data.append(f"Source URL: {url}\nContent: {content}")
    return "\n\n".join(data)


# ================= FINAL ANSWER =================
def generate_final_answer(question, answers, web_data):
    context = "\n".join([
        f"Q{i+1}: {q}\nA{i+1}: {a}"
        for i, (q, a) in enumerate(answers)
    ])

    prompt = f"""
You are ArthSaathi, an expert financial advisor.

User Question:
{question}

User Profile Details:
{context}

Web Data:
{web_data}

Task:
- Create a personalized investment plan
- Provide asset allocation in %
- Keep it simple and practical
- Add a financial confidence score (0-100)
- Break down score into:
  Risk Alignment, Practicality, Data Completeness
- Mention sources used

Return clear structured output.
"""

    return call_llm(prompt)


# ================= VOICE SUMMARY =================
def summarize_for_voice(text):
    prompt = f"""
Summarize this in simple spoken English under 500 characters:

{text}
"""
    return call_llm(prompt)[:500]


# ================= SARVAM STT =================
def speech_to_text(audio_file_path):
    url = "https://api.sarvam.ai/v1/speech-to-text"

    headers = {
        "Authorization": f"Bearer {SARVAM_API_KEY}"
    }

    files = {
        "file": open(audio_file_path, "rb")
    }

    data = {
        "model": "saaras:v2",
        "language": "auto"
    }

    try:
        response = requests.post(url, headers=headers, files=files, data=data)
        return response.json().get("text", "")
    except:
        return ""


# ================= SARVAM TTS =================
def text_to_speech(text):
    url = "https://api.sarvam.ai/v1/text-to-speech"

    headers = {
        "Authorization": f"Bearer {SARVAM_API_KEY}",
        "Content-Type": "application/json"
    }

    short_text = summarize_for_voice(text)

    payload = {
        "text": short_text,
        "voice": "shubh",
        "format": "wav"
    }

    res = requests.post(url, headers=headers, json=payload)

    if res.status_code == 200:
        with open("output.wav", "wb") as f:
            f.write(res.content)
        return "output.wav"
    return None


# ================= PIPELINE =================
def run_agent(question, qa_pairs):
    web_data = tavily_search(question)
    final = generate_final_answer(question, qa_pairs, web_data)

    print("\n💡 FINAL ANSWER:\n", final)

    audio = text_to_speech(final)
    return final, audio


# ================= MAIN =================
if __name__ == "__main__":

    q = input("Ask your financial question: ")

    followups = generate_followups(q)

    answers = []

    print("\n🤖 Answer these:\n")

    for f in followups:
        print("Q:", f)
        answers.append(input("A: "))

    qa_pairs = list(zip(followups, answers))
    final_text, audio = run_agent(q, qa_pairs)

    print("\nFINAL:\n", final_text)

    if audio:
        print("\n🔊 Voice saved:", audio)