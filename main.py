"""
Autonomous Multi-Agent Financial Education System — FastAPI Backend
Now with Detailed Logging + Debugging + Stability
"""

import os
import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from agno.agent import Agent
from agno.team.team import Team
from agno.models.google import Gemini
from agno.tools.reasoning import ReasoningTools
from agno.tools.tavily import TavilyTools

import dotenv

# ─────────────────────────────────────────────
# LOGGING CONFIG
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,  # change to DEBUG for deep logs
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger("finance-ai")

# ─────────────────────────────────────────────
# LOAD ENV
# ─────────────────────────────────────────────
dotenv.load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

logger.info("🔑 Loading environment variables...")

if not GEMINI_API_KEY:
    logger.error("❌ GEMINI_API_KEY missing")
    raise ValueError("GEMINI_API_KEY not set")

if not TAVILY_API_KEY:
    logger.warning("⚠️ TAVILY_API_KEY missing (search disabled)")

# ─────────────────────────────────────────────
# REQUEST MODEL
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str = Field(..., description="User financial query")


# ─────────────────────────────────────────────
# BUILD TEAM
# ─────────────────────────────────────────────
def build_team() -> Team:
    logger.info("🧠 Initializing Gemini model...")

    gemini = Gemini(
        id="gemini-3-flash-preview",
        api_key=GEMINI_API_KEY
    )

    tools = []

    # Tavily init
    if TAVILY_API_KEY:
        try:
            logger.info("🌐 Initializing Tavily tools...")
            tavily = TavilyTools(api_key=TAVILY_API_KEY)
            tools.append(tavily)
        except Exception as e:
            logger.error(f"❌ Tavily init failed: {e}")

    # ── Agents ──
    logger.info("👥 Creating agents...")

    budget_agent = Agent(
        name="Budgeting Analyst",
        role="Cash flow expert",
        model=gemini,
        tools=tools,
        instructions=[
            "You are a compassionate budgeting coach.",
            "Find one spending leak and fix it.",
            "When using tools or providing info, if you found a source, include it as [SOURCE: url].",
            "Always start your response segment with [AGENT: Budgeting Analyst]."
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
            "Include sources as [SOURCE: url] if applicable.",
            "Always start your response segment with [AGENT: Savings Strategist]."
        ],
    )

    invest_agent = Agent(
        name="Investment Educator",
        role="Investment educator",
        model=gemini,
        tools=tools,
        instructions=[
            "Explain investing simply.",
            "No stock recommendations.",
            "Include sources as [SOURCE: url] if applicable.",
            "Always start your response segment with [AGENT: Investment Educator]."
        ],
    )

    logger.info("🧩 Building team supervisor...")

    team = Team(
        name="Financial Advisor",
        mode="coordinate",
        model=gemini,
        members=[budget_agent, saving_agent, invest_agent],
        tools=[ReasoningTools(add_instructions=True)] + tools,
        markdown=True,
        instructions=[
            "Structure response:",
            "1. Understanding",
            "2. Explanation",
            "3. Action steps",
            "4. Next step",
            "5. Disclaimer",
            "Rules:",
            "- When you consult a specialist, the output should begin with [AGENT: Specialist Name].",
            "- When you provide the final consolidated answer, start with [AGENT: Financial Advisor].",
            "- For any internet search results, include sources as [SOURCE: URL].",
        ],
    )

    logger.info("✅ AI Team ready")

    return team


# ─────────────────────────────────────────────
# STREAMING RESPONSE
# ─────────────────────────────────────────────
async def stream_response(team: Team, query: str, request_id: str) -> AsyncGenerator[str, None]:
    logger.info(f"📥 [{request_id}] Incoming query: {query}")

    try:
        # Using team.run with stream=True for real-time streaming
        for chunk in team.run(query, stream=True):
            if hasattr(chunk, 'content') and chunk.content:
                yield chunk.content
            elif isinstance(chunk, str):
                yield chunk
            
            # Optional: yield a tiny delay for smoother UI if needed
            # await asyncio.sleep(0.01)

    except Exception as e:
        logger.exception(f"❌ [{request_id}] Agent execution failed")
        yield f"Error: {str(e)}"
        return

        logger.debug(f"📤 [{request_id}] Chunk: {chunk}")
        yield chunk
        await asyncio.sleep(0.02)

    logger.info(f"🏁 [{request_id}] Streaming complete")


# ─────────────────────────────────────────────
# FASTAPI LIFESPAN
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting application...")

    try:
        app.state.team = build_team()
    except Exception:
        logger.exception("❌ Failed to initialize AI team")
        raise

    logger.info("✅ App startup complete")
    yield
    logger.info("🛑 Shutting down...")


# ─────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────
app = FastAPI(
    title="Financial AI Multi-Agent API",
    version="4.0.0",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────
# PATHS & TEMPLATES
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Verify directories exist to prevent 500 errors
if not os.path.exists(TEMPLATES_DIR):
    logger.error(f"❌ Templates directory NOT FOUND: {TEMPLATES_DIR}")
if not os.path.exists(STATIC_DIR):
    logger.error(f"❌ Static directory NOT FOUND: {STATIC_DIR}")

templates = Jinja2Templates(directory=TEMPLATES_DIR)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

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
    logger.info("🌐 Serving UI")
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/chat")
async def chat(req: ChatRequest):
    request_id = str(uuid.uuid4())[:8]

    logger.info(f"🆔 Request ID: {request_id}")

    if not req.query.strip():
        logger.warning(f"⚠️ [{request_id}] Empty query")
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    team = app.state.team

    return StreamingResponse(
        stream_response(team, req.query, request_id),
        media_type="text/plain"
    )