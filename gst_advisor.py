"""
GST Advisor — RAG Agent
Indexes: MGST Rules 2017 (MGST Rules PDF)
Stack:  FAISS (local) + Groq LLM + Tavily Web Search
"""

import os
import re
import json
import hashlib
import logging
import faiss
import numpy as np
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv()

logger = logging.getLogger("gst-advisor")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
MODEL = "openai/gpt-oss-120b"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GST_PDF_PATH = os.path.join(
    BASE_DIR,
    "1760438646MGST Rules, 2017  updated upto Notification 07-2025-State Tax.pdf"
)

# ─── Groq + Tavily clients ────────────────────────────────────────────────────
try:
    from groq import Groq
    _groq_client = Groq(api_key=GROQ_API_KEY)
    logger.info("✅ Groq client ready")
except Exception as e:
    logger.error(f"Groq init failed: {e}")
    _groq_client = None

try:
    from tavily import TavilyClient
    _tavily = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None
except Exception:
    _tavily = None

# ─── Deterministic Bag-of-Words Hash Embedding ───────────────────────────────
DIM = 512


# ─── Response Cleaner ─────────────────────────────────────────────────────────
def clean_response(text: str) -> str:
    """Strip markdown ** and *** bold/italic markers from LLM string output."""
    if not text:
        return text
    text = re.sub(r'\*{3}(.+?)\*{3}', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*{2}(.+?)\*{2}', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*(.+?)\*', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*+', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def embed(text: str) -> np.ndarray:
    """
    Deterministic, keyword-based hash embedding.
    Same text → same vector every time (no random seeds).
    Uses SHA-256 per word → dimension index to build a BoW vector.
    L2-normalised so FAISS inner-product == cosine similarity.
    """
    words = text.lower().split()
    vec = np.zeros(DIM, dtype="float32")
    for word in words:
        idx = int(hashlib.sha256(word.encode()).hexdigest(), 16) % DIM
        vec[idx] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec


# ─── FAISS Vector Store (parent-child) ───────────────────────────────────────
class FAISSStore:
    def __init__(self, dim: int = DIM):
        # Inner Product on normalised vectors == cosine similarity
        self.index = faiss.IndexFlatIP(dim)
        self.children: list[str] = []
        self.parents: list[str] = []
        self.child_to_parent: list[int] = []

    @property
    def size(self) -> int:
        return self.index.ntotal

    def add_chunks(
        self,
        children: list[str],
        c2p: list[int],
        parents: list[str],
    ):
        self.parents = parents
        self.child_to_parent = c2p
        vecs = np.array([embed(c) for c in children], dtype="float32")
        self.index.add(vecs)
        self.children.extend(children)
        logger.info(f"FAISS: {len(children)} child chunks | {len(parents)} parents")

    def search(self, query: str, k: int = 6) -> tuple[list[str], list[str]]:
        if self.size == 0:
            return [], []
        k = min(k, self.size)
        vec = embed(query)
        _, I = self.index.search(np.array([vec]), k)

        child_hits: list[str] = []
        parent_hits: list[str] = []
        seen: set[int] = set()

        for i in I[0]:
            if 0 <= i < len(self.children):
                child_hits.append(self.children[i])
                pidx = self.child_to_parent[i] if i < len(self.child_to_parent) else -1
                if pidx >= 0 and pidx not in seen and pidx < len(self.parents):
                    parent_hits.append(self.parents[pidx])
                    seen.add(pidx)

        return child_hits, parent_hits


# ─── Global singleton ─────────────────────────────────────────────────────────
_store = FAISSStore()
_pdf_indexed = False


# ─── Chunking ─────────────────────────────────────────────────────────────────
def _chunk(text: str, parent_size: int = 1800, child_size: int = 400):
    parents = [text[i: i + parent_size] for i in range(0, len(text), parent_size)]
    children, c2p = [], []
    for pi, p in enumerate(parents):
        for j in range(0, len(p), child_size):
            children.append(p[j: j + child_size])
            c2p.append(pi)
    return parents, children, c2p


# ─── PDF ingestion (idempotent) ───────────────────────────────────────────────
def ingest_gst_pdf():
    global _pdf_indexed
    if _pdf_indexed:
        return
    if not os.path.exists(GST_PDF_PATH):
        logger.warning(f"⚠️  GST PDF not found: {GST_PDF_PATH}")
        return
    try:
        logger.info("📄 Indexing GST PDF …")
        reader = PdfReader(GST_PDF_PATH)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() or ""

        parents, children, c2p = _chunk(full_text)
        _store.add_chunks(children, c2p, parents)
        _pdf_indexed = True
        logger.info(f"✅ GST PDF indexed — {_store.size} chunks")
    except Exception as e:
        logger.error(f"❌ PDF indexing failed: {e}")


# ─── Tavily Web Search ────────────────────────────────────────────────────────
def _web_search(query: str) -> str:
    if not _tavily:
        return ""
    try:
        res = _tavily.search(query=f"GST India {query} 2024 2025", max_results=4)
        return "\n\n".join(
            f"[{r['url']}]\n{r['content']}" for r in res.get("results", [])
        )
    except Exception as e:
        logger.error(f"Tavily error: {e}")
        return ""


# ─── Query Router ─────────────────────────────────────────────────────────────
def _route(question: str) -> str:
    if not _groq_client:
        return "both"
    prompt = [
        {"role": "system", "content": (
            "Route the GST query. Reply ONLY with valid JSON: "
            '{"route":"kb"} or {"route":"web"} or {"route":"both"}. '
            'Use "kb" for rule/section/schedule/form lookups. '
            'Use "web" for recent amendments, notifications, court orders. '
            'Use "both" for comprehensive analysis.'
        )},
        {"role": "user", "content": question},
    ]
    try:
        text = _groq_client.chat.completions.create(
            model=MODEL, messages=prompt, max_tokens=30
        ).choices[0].message.content.strip()
        return json.loads(text)["route"]
    except Exception:
        return "both"


# ─── LLM Report Generator ─────────────────────────────────────────────────────
def _generate_report(question: str, kb_ctx: str, web_ctx: str) -> dict:
    if not _groq_client:
        return {"summary": "LLM unavailable", "confidence": 0}

    system = (
        "You are a senior GST Compliance Expert and Chartered Accountant for India. "
        "You have exhaustive knowledge of CGST/SGST/IGST/MGST Rules 2017 and all notifications up to 2025. "
        "Provide structured, accurate, legally-sound guidance. "
        "Cite Rule numbers and Section numbers from the context where possible. "
        "Respond in clean plain text only — do NOT use ** or *** markdown bold/italic markers anywhere in your response."
    )

    user = f"""
User Query: {question}

--- MGST Knowledge Base ---
{kb_ctx or "No specific rule retrieved from knowledge base."}

--- Latest Web Data ---
{web_ctx or "No web data available."}

Generate a DETAILED GST ADVISORY REPORT as a JSON object with these EXACT keys:
{{
  "summary": "2-3 sentence executive summary",
  "applicable_rules": ["Rule X – Description", "Section Y – Title"],
  "legal_provisions": "Detailed explanation of relevant legal provisions with citations",
  "compliance_requirements": ["Step 1", "Step 2"],
  "forms_required": ["GSTR-X – Purpose"],
  "deadlines": ["Due date 1", "Due date 2"],
  "penalties": "Penalty provisions under MGST/CGST for non-compliance",
  "recent_updates": "Notifications or amendments from 2024-2025 if any",
  "practical_guidance": "Numbered, step-by-step practical guidance for a taxpayer",
  "risk_notes": "Key compliance risks and mitigation",
  "confidence": 82
}}

Return ONLY the JSON object. No markdown fences, no extra text.
"""
    try:
        raw = _groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": user}],
            max_tokens=2500,
            temperature=0.25,
        ).choices[0].message.content.strip()

        # Strip markdown code fences if present
        if "```" in raw:
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else parts[0]
            if raw.startswith("json"):
                raw = raw[4:].strip()

        report = json.loads(raw)
        # Clean all string fields in the report
        for key, val in report.items():
            if isinstance(val, str):
                report[key] = clean_response(val)
            elif isinstance(val, list):
                report[key] = [clean_response(item) if isinstance(item, str) else item for item in val]
        return report
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        return {
            "summary": (
                "Could not generate a fully structured report. "
                "Please try rephrasing your question."
            ),
            "legal_provisions": str(e),
            "applicable_rules": [],
            "compliance_requirements": [],
            "forms_required": [],
            "deadlines": [],
            "penalties": "",
            "recent_updates": "",
            "practical_guidance": "",
            "risk_notes": "",
            "confidence": 0,
        }


# ─── Public API ───────────────────────────────────────────────────────────────
def query_gst(question: str) -> dict:
    """
    Entry point called by FastAPI.
    Returns:
        {
          "report":    { structured report dict },
          "mode":      "kb" | "web" | "both",
          "kb_chunks": int  (total indexed chunks)
        }
    """
    ingest_gst_pdf()  # no-op if already indexed

    mode = _route(question)
    kb_ctx = ""
    web_ctx = ""

    if mode in ("kb", "both"):
        _, parents = _store.search(question, k=6)
        kb_ctx = "\n\n---\n\n".join(parents[:3] if parents else [])

    if mode in ("web", "both"):
        web_ctx = _web_search(question)

    report = _generate_report(question, kb_ctx, web_ctx)

    return {
        "report": report,
        "mode": mode,
        "kb_chunks": _store.size,
    }
