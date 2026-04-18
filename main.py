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
import requests
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

from agno.agent import Agent
from agno.team.team import Team
from agno.models.google import Gemini
from agno.tools.reasoning import ReasoningTools
from agno.tools.tavily import TavilyTools

import dotenv
import json
from chatbot_logic import generate_followups, tavily_search, generate_final_answer, speech_to_text, text_to_speech, call_llm
from shopping_logic import analyze_shopping_query
from gst_advisor import query_gst, ingest_gst_pdf



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
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "ArthSaathi")
COLLECTION_NAME = os.getenv("MONGODB_COLLECTION_NAME", "financial_data")

# MongoDB initialization
db_client = None
db = None
collection = None

if MONGODB_URI and "<db_password>" not in MONGODB_URI:
    try:
        db_client = AsyncIOMotorClient(MONGODB_URI)
        db = db_client[DB_NAME]
        collection = db[COLLECTION_NAME]
        logger.info(f"✅ Connected to MongoDB: {DB_NAME}.{COLLECTION_NAME}")
    except Exception as e:
        logger.error(f"❌ MongoDB Connection failed: {e}")
else:
    logger.warning("⚠️ MONGODB_URI not configured or password placeholder remains.")

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

    # Pre-index GST PDF (runs once; idempotent)
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, ingest_gst_pdf)
    except Exception as e:
        logger.error(f"❌ GST PDF indexing failed: {e}")

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

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("auth.html", {
        "request": request,
        "supabase_url": os.getenv("SUPABASE_URL", ""),
        "supabase_anon_key": os.getenv("SUPABASE_ANON_KEY", "")
    })

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("static/favicon.ico")

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {
        "request": request, 
        "active_view": "dashboard",
        "supabase_url": os.getenv("SUPABASE_URL", ""),
        "supabase_anon_key": os.getenv("SUPABASE_ANON_KEY", "")
    })

@app.get("/offline", response_class=HTMLResponse)
async def offline_mode(request: Request):
    return templates.TemplateResponse("offline.html", {"request": request})

@app.get("/shopping-assistant", response_class=HTMLResponse)
async def shopping_assistant_page(request: Request):
    return templates.TemplateResponse("shopping_assistant.html", {"request": request})

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
    global global_stats
    
    if collection is not None:
        try:
            # Fetch the most recent financial data
            latest_data = await collection.find_one(sort=[("timestamp", -1)])
            if latest_data:
                logger.info(f"📥 Retrieved latest stats from MongoDB (ID: {latest_data.get('_id')})")
                # Remove MongoDB internal _id for serialization
                latest_data.pop("_id", None)
                latest_data.pop("timestamp", None)
                return latest_data
            else:
                logger.info("ℹ️ No data found in MongoDB, using session defaults.")
        except Exception as e:
            logger.error(f"❌ Failed to fetch stats from MongoDB: {e}")
            
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
        
        # Save to MongoDB
        if collection is not None:
            try:
                # Ensure we store it with a timestamp
                data_to_store = parsed_json.copy()
                data_to_store["timestamp"] = datetime.utcnow()
                result = await collection.insert_one(data_to_store)
                logger.info(f"📊 Financial data persisted to MongoDB. ID: {result.inserted_id}")
            except Exception as mongo_err:
                logger.error(f"❌ MongoDB insert failed: {mongo_err}")
                
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
# STOCK ANALYZER
# ─────────────────────────────────────────────

@app.get("/api/stock/{symbol}")
def get_stock_data(symbol: str):
    AV_API_KEY = "6DSHED5Q11VQ2CCX"
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={AV_API_KEY}"
    response = requests.get(url)
    data = response.json()
    if "Global Quote" in data and data["Global Quote"]:
        quote = data["Global Quote"]
        return {
            "symbol": quote.get("01. symbol"),
            "price": quote.get("05. price"),
            "change": quote.get("09. change"),
            "change_percent": quote.get("10. change percent"),
            "volume": quote.get("06. volume"),
        }
    else:
        raise HTTPException(404, "Stock data not found or API limit reached")

class StockAnalyzeRequest(BaseModel):
    symbol: str

@app.post("/api/stock/analyze")
def analyze_stock(req: StockAnalyzeRequest):
    AV_API_KEY = "6DSHED5Q11VQ2CCX"
    symbol = req.symbol.upper()
    
    quote_url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={AV_API_KEY}"
    quote_data = requests.get(quote_url).json().get("Global Quote", {})
    
    news_url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={symbol}&sort=LATEST&limit=5&apikey={AV_API_KEY}"
    news_data = requests.get(news_url).json().get("feed", [])
        
    news_summaries = []
    for item in news_data[:5]:
        news_summaries.append(f"- {item.get('title')} ({item.get('overall_sentiment_label')})")
    
    news_text = "\n".join(news_summaries)
    
    prompt = f"""
    You are an expert stock market analyst. I need a recommendation for the stock {symbol}.
    
    Current Data:
    Price: {quote_data.get('05. price', 'N/A')}
    Change: {quote_data.get('09. change', 'N/A')} ({quote_data.get('10. change percent', 'N/A')})
    Volume: {quote_data.get('06. volume', 'N/A')}
    
    Recent News:
    {news_text}
    
    Based on this data and your general knowledge about the company, provide a clear, concise recommendation (Buy, Hold, or Sell) and a brief reasoning in markdown. Provide actionable steps too if needed.
    """
    
    try:
        analysis = call_llm(prompt)
        return {"analysis": analysis}
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return {"analysis": "Error generating recommendation. Please try again."}

@app.get("/api/stock/history/{symbol}")
def get_stock_history(symbol: str):
    AV_API_KEY = "6DSHED5Q11VQ2CCX"
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=compact&apikey={AV_API_KEY}"
    response = requests.get(url)
    data = response.json()
    
    if "Time Series (Daily)" in data:
        series = data["Time Series (Daily)"]
        # Take last 30 days
        labels = list(series.keys())[:30]
        values = [float(series[date]["4. close"]) for date in labels]
        return {
            "labels": labels[::-1],
            "values": values[::-1]
        }
    else:
        # Fallback/Error
        return {"labels": [], "values": []}

@app.get("/api/commodity/{type}")
def get_commodity_data(type: str):
    AV_API_KEY = "6DSHED5Q11VQ2CCX"
    # Mapping for AV commodity functions
    mapping = {
        "WTI": "WTI",
        "BRENT": "BRENT",
        "GOLD": "GOLD",
        "SILVER": "SILVER",
        "NATURAL_GAS": "NATURAL_GAS"
    }
    func = mapping.get(type.upper(), "WTI")
    url = f"https://www.alphavantage.co/query?function={func}&interval=daily&apikey={AV_API_KEY}"
    response = requests.get(url)
    data = response.json()
    
    if "data" in data:
        # Latest data
        latest = data["data"][0]
        # History for chart (last 30 points)
        history = data["data"][:30]
        return {
            "name": data.get("name"),
            "unit": data.get("unit"),
            "price": latest.get("value"),
            "labels": [d["date"] for d in history][::-1],
            "values": [float(d["value"]) if d["value"] != "." else 0 for d in history][::-1]
        }
    return {"error": "No data"}

# ─────────────────────────────────────────────
# SHOPPING ASSISTANT
# ─────────────────────────────────────────────

class ShoppingRequest(BaseModel):
    query: str

@app.post("/api/shopping/analyze")
async def shopping_analyze(req: ShoppingRequest):
    global global_stats
    
    # 1. Fetch latest stats from MongoDB cluster for accurate mapping
    user_data = global_stats
    if collection is not None:
        try:
            latest = await collection.find_one(sort=[("timestamp", -1)])
            if latest:
                user_data = latest
                logger.info("📡 Using latest MongoDB data for shopping analysis")
        except Exception as e:
            logger.error(f"Mongo fetch failed for shopping assistant: {e}")

    try:
        analysis = analyze_shopping_query(req.query, user_data)
        return {"analysis": analysis}
    except Exception as e:
        logger.error(f"Shopping analysis error: {e}")
        raise HTTPException(500, str(e))


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


# ─────────────────────────────────────────────
# GST ADVISOR
# ─────────────────────────────────────────────

@app.get("/gst-advisor", response_class=HTMLResponse)
async def gst_advisor_page(request: Request):
    """Serve the GST Advisor chat UI."""
    return templates.TemplateResponse("gst_advisor.html", {"request": request})


@app.get("/api/gst/status")
async def gst_status():
    """Return current KB indexing status."""
    from gst_advisor import _store, _pdf_indexed
    return {
        "indexed": _pdf_indexed,
        "kb_chunks": _store.size,
    }


class GSTQuery(BaseModel):
    question: str
    session_id: str = "gst_default"


@app.post("/api/gst/query")
async def gst_query_endpoint(req: GSTQuery):
    """
    Main GST advisory endpoint.
    Returns a structured JSON report built from MGST KB + Tavily web search.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, query_gst, req.question)
        return result
    except Exception as e:
        logger.error(f"GST query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))