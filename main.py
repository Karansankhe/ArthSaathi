"""
Autonomous Multi-Agent Financial Education System — FastAPI Backend
Stable + Debugged + Production Ready
"""

import os
import logging
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
import shutil
import base64

from agno.agent import Agent
from agno.team.team import Team
from agno.models.google import Gemini
from agno.tools.reasoning import ReasoningTools
from agno.tools.tavily import TavilyTools

import dotenv
import json
from chatbot_logic import generate_followups, tavily_search, generate_final_answer, speech_to_text, text_to_speech, call_llm


# Session state for Analytics Chatbot
chatbot_sessions = {}


# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("finance-ai")

# ─────────────────────────────────────────────
# ENV
# ─────────────────────────────────────────────
dotenv.load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# ─────────────────────────────────────────────
# REQUEST MODEL
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str = Field(..., description="User financial query")
    session_id: str = Field(default="default_session")


# ─────────────────────────────────────────────
# BUILD TEAM
# ─────────────────────────────────────────────
def build_team() -> Team:
    logger.info("🧠 Initializing Gemini model...")

    if not GEMINI_API_KEY:
        raise ValueError("❌ GEMINI_API_KEY is missing")

    # ✅ Stable model
    gemini = Gemini(
        id="gemini-3-flash-preview",
        api_key=GEMINI_API_KEY
    )

    tools = []

    # Tavily (optional)
    if TAVILY_API_KEY:
        try:
            logger.info("🌐 Initializing Tavily...")
            tavily = TavilyTools(api_key=TAVILY_API_KEY)
            tools.append(tavily)
        except Exception as e:
            logger.error(f"Tavily init failed: {e}")

    # ───────── Agents ─────────
    logger.info("👥 Creating agents...")

    budget_agent = Agent(
        name="Budgeting Analyst",
        role="Cash flow expert",
        model=gemini,
        tools=tools,
        instructions=[
            "You are a compassionate budgeting coach.",
            "Find one spending leak and fix it.",
            "Always start with [AGENT: Budgeting Analyst].",
        ],
    )

    saving_agent = Agent(
        name="Savings Strategist",
        role="Savings expert",
        model=gemini,
        tools=tools,
        instructions=[
            "Help build savings habits.",
            "Encourage emergency fund.",
            "Always start with [AGENT: Savings Strategist].",
        ],
    )

    invest_agent = Agent(
        name="Investment Educator",
        role="Investment educator",
        model=gemini,
        tools=tools,
        instructions=[
            "Explain investing simply.",
            "Do NOT give stock tips.",
            "Always start with [AGENT: Investment Educator].",
        ],
    )

    # ───────── Team ─────────
    logger.info("🧩 Building team...")

    team = Team(
        name="Financial Advisor",
        mode="coordinate",
        model=gemini,
        members=[budget_agent, saving_agent, invest_agent],
        tools=[ReasoningTools(add_instructions=True)] + tools,
        markdown=True,
        instructions=[
            "You are a Financial Advisor leading expert agents.",
            "Ask follow-up questions if user input is vague.",
            "Structure output clearly.",
            "Final answer must start with [AGENT: Financial Advisor].",
        ],
    )

    logger.info("✅ Team ready")
    return team


# ─────────────────────────────────────────────
# STREAMING
# ─────────────────────────────────────────────
async def stream_response(team: Team, query: str, request_id: str) -> AsyncGenerator[str, None]:
    logger.info(f"📥 [{request_id}] Query: {query}")

    try:
        for chunk in team.run(query, stream=True):
            if hasattr(chunk, "content") and chunk.content:
                yield chunk.content
            elif isinstance(chunk, str):
                yield chunk

    except Exception as e:
        logger.exception(f"❌ [{request_id}] Error")
        yield f"\nError: {str(e)}"


# ─────────────────────────────────────────────
# LIFESPAN
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting app...")

    try:
        app.state.team = build_team()
    except Exception as e:
        logger.error(f"❌ Init failed: {e}")
        app.state.team = None

    yield
    logger.info("🛑 Shutdown")


# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────
app = FastAPI(
    title="Financial AI API",
    version="5.0.0",
    lifespan=lifespan,
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Blank starter stats
global_stats = {
    "balance": {
        "current": 0.00,
        "history": [],
        "last_month": []
    },
    "income": {"current": 0.00},
    "expense": {
        "current": 0.00,
        "categories": []
    },
    "budget_vs_expense": {
        "months": [],
        "expense": [],
        "budget": []
    }
}

@app.get("/api/stats")
async def get_stats():
    return global_stats

from fastapi import Form
from typing import List

from parser_logic import parse_and_get_stats

@app.post("/api/parse-data")
async def parse_data(files: List[UploadFile] = File(None), text_data: str = Form(None)):
    global global_stats
    try:
        parsed_json = await parse_and_get_stats(files, text_data)
        global_stats = parsed_json
        return {"status": "success", "stats": global_stats}
    except Exception as e:
        logger.error(f"Failed to parse data: {e}")
        raise HTTPException(500, str(e))


@app.post("/chat")
async def chat(req: ChatRequest):
    request_id = str(uuid.uuid4())[:8]

    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Empty query")

    if not app.state.team:
        raise HTTPException(status_code=503, detail="AI not initialized")

    return StreamingResponse(
        stream_response(app.state.team, req.query, request_id),
        media_type="text/plain"
    )


# ─────────────────────────────────────────────
# ANALYTICS CHATBOT (Step-by-Step Flow)
# ─────────────────────────────────────────────

class ChatbotQuery(BaseModel):
    user_input: str
    session_id: str

@app.post("/chatbot/query")
async def chatbot_query(req: ChatbotQuery):
    sid = req.session_id
    user_input = req.user_input.strip()

    if sid not in chatbot_sessions:
        chatbot_sessions[sid] = {
            "questions": [],
            "answers": [],
            "current_q_index": 0,
            "pending_question": None,
            "chat_history": []
        }

    session = chatbot_sessions[sid]

    # STEP 1: First interaction → generate followups
    if not session["questions"]:
        session["pending_question"] = user_input
        session["questions"] = generate_followups(user_input)
        session["current_q_index"] = 0
        session["answers"] = []
        session["chat_history"].append({"role": "user", "content": user_input})

        # Ask first followup
        first_q = session["questions"][0] if session["questions"] else "Could you tell me more about your income?"
        session["chat_history"].append({"role": "bot", "content": f"I understand. To give you the best advice, let me ask a few questions:\n\n**{first_q}**"})
        
        return {
            "response": first_q,
            "history": session["chat_history"],
            "done": False,
            "is_followup": True
        }

    # STEP 2: Collect answers one by one
    else:
        session["answers"].append(user_input)
        session["chat_history"].append({"role": "user", "content": user_input})
        session["current_q_index"] += 1

        # Ask next question
        if session["current_q_index"] < len(session["questions"]):
            next_q = session["questions"][session["current_q_index"]]
            session["chat_history"].append({"role": "bot", "content": next_q})
            return {
                "response": next_q,
                "history": session["chat_history"],
                "done": False,
                "is_followup": True
            }

        # STEP 3: Final Answer
        else:
            orig_question = session["pending_question"]
            web_data = tavily_search(orig_question)
            
            qa_pairs = list(zip(session["questions"], session["answers"]))
            final_answer = generate_final_answer(
                orig_question,
                qa_pairs,
                web_data
            )

            session["chat_history"].append({"role": "bot", "content": final_answer})
            
            # Use Text-to-Speech for the final answer
            audio_path = text_to_speech(final_answer)
            audio_b64 = None
            if audio_path and os.path.exists(audio_path):
                with open(audio_path, "rb") as f:
                    audio_b64 = base64.b64encode(f.read()).decode()

            # Reset flow but keep history (as per user request "RESET FLOW (but keep history)")
            session["questions"] = []
            session["answers"] = []
            session["current_q_index"] = 0
            session["pending_question"] = None

            return {
                "response": final_answer,
                "audio_base64": audio_b64,
                "history": session["chat_history"],
                "done": True,
                "is_followup": False
            }

@app.post("/chatbot/clear")
async def chatbot_clear(req: ChatbotQuery):
    sid = req.session_id
    if sid in chatbot_sessions:
        chatbot_sessions[sid] = {
            "questions": [],
            "answers": [],
            "current_q_index": 0,
            "pending_question": None,
            "chat_history": []
        }
    return {"status": "cleared"}

@app.get("/chatbot/history/{session_id}")
async def chatbot_history(session_id: str):
    if session_id in chatbot_sessions:
        return {"history": chatbot_sessions[session_id]["chat_history"]}
    return {"history": []}

@app.post("/chatbot/speech-to-text")
async def chatbot_stt(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        text = speech_to_text(temp_path)
        return {"text": text}
    except Exception as e:
        logger.error(f"STT Error: {e}")
        return {"text": ""}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)