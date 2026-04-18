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

if not GROQ_API_KEY:
    print("⚠️ GROQ_API_KEY is missing in chatbot_logic.py")
    client = None
else:
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


# ================= LLM CALL (WITH RETRY) =================
def call_llm(prompt):
    import time
    max_retries = 3
    base_delay = 2
    
    for i in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": "You are ArthSaathi, a premium financial AI advisor. Always provide a 'Financial Health Score' (0-100) and a 'Confidence Level' (%) based on the data available. Respond in clean plain text. Do NOT use markdown bold (**) or italic (*) markers. Use plain numbered lists and dashes."},
                    {"role": "user", "content": prompt}
                ]
            )
            return clean_response(response.choices[0].message.content)
        except Exception as e:
            if "quota" in str(e).lower() or "429" in str(e):
                if i < max_retries - 1:
                    time.sleep(base_delay * (i + 1))
                    continue
            return f"Service currently busy. Please try again in a moment. (Error: {str(e)})"


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
Summarize this in VERY brief conversational English (maximum 2-3 sentences, strictly under 250 characters):

{text}
"""
    short = call_llm(prompt)
    return short[:250]


# ================= SARVAM STT =================
def speech_to_text(audio_file_path):
    """
    Transcribe an audio file using Sarvam AI's Speech-to-Text API.
    """
    url = "https://api.sarvam.ai/speech-to-text"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Accept": "application/json"
    }
    
    try:
        with open(audio_file_path, "rb") as f:
            files = {
                "file": (audio_file_path, f, "audio/wav")
            }
            data = {
                "language_code": "en-IN", # Supports multilingual, en-IN is a safe start
                "model": "saaras:v3",
                "with_timestamps": "false"
            }
            
            print(f"DEBUG: Sending STT request for {audio_file_path}")
            response = requests.post(url, headers=headers, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                transcript = response.json().get("transcript", "")
                print(f"DEBUG: STT Transcription: {transcript}")
                return transcript
            else:
                print(f"Sarvam STT Error: {response.status_code} - {response.text}")
                return ""
    except Exception as e:
        print(f"STT Exception: {e}")
        return ""


# ================= SARVAM TTS =================
def text_to_speech(text):
    url = "https://api.sarvam.ai/text-to-speech"
    import uuid
    import base64

    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    short_text = summarize_for_voice(text)
    print(f"DEBUG: Summarized text for TTS: {short_text}")

    if not short_text:
        return None

    payload = {
        "inputs": [short_text],
        "target_language_code": "en-IN",
        "speaker": "shubh",
        "pace": 1.0,
        "temperature": 0.6,
        "speech_sample_rate": 22050,
        "model": "bulbul:v3"
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        if res.status_code == 200:
            data = res.json()
            if "audios" in data and len(data["audios"]) > 0:
                audio_b64 = data["audios"][0]
                filename = f"tts_out_{uuid.uuid4().hex[:8]}.wav"
                with open(filename, "wb") as f:
                    f.write(base64.b64decode(audio_b64))
                print(f"DEBUG: Bulbul v3 TTS Successful: {filename}")
                return filename
            else:
                print(f"Sarvam JSON Error: {data}")
        else:
            print(f"Sarvam API Error: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Sarvam TTS Exception: {e}")
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