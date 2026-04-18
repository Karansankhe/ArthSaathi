"""
GST Advisor — RAG Agent (UPGRADED)
- Gemini Embeddings (semantic retrieval)
- FAISS vector DB
- Parent-child chunking
- Tavily web search
- Groq LLM structured GST report
"""

import os
import re
import json
import time
import logging
import hashlib
import numpy as np
import faiss
from dotenv import load_dotenv
from pypdf import PdfReader

import google.generativeai as genai

load_dotenv()

logger = logging.getLogger("gst-advisor")

# ───────────────── CONFIG ─────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEYY")

MODEL = "llama3-70b-8192"
EMBED_MODEL = "models/text-embedding-004"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GST_PDF_PATH = os.path.join(
    BASE_DIR,
    "gst.pdf"
)

# ───────────────── INIT CLIENTS ─────────────────
if not GOOGLE_API_KEY:
    logger.error("❌ GOOGLE_API_KEY is missing in gst_advisor.py")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

from groq import Groq
from tavily import TavilyClient

if not GROQ_API_KEY:
    logger.error("❌ GROQ_API_KEY is missing in gst_advisor.py")
    groq_client = None
else:
    groq_client = Groq(api_key=GROQ_API_KEY)

if not TAVILY_API_KEY:
    logger.warning("⚠️ TAVILY_API_KEY is missing in gst_advisor.py. Web search will be disabled.")
    tavily = None
else:
    tavily = TavilyClient(api_key=TAVILY_API_KEY)

# ───────────────── EMBEDDINGS ─────────────────
DIM = 768


def embed(text: str) -> np.ndarray:
    """Gemini embedding"""
    res = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_document"
    )
    vec = np.array(res["embedding"], dtype="float32")
    vec = vec / np.linalg.norm(vec)
    return vec


def embed_batch(texts):
    res = genai.embed_content(
        model=EMBED_MODEL,
        content=texts,
        task_type="retrieval_document"
    )
    vecs = np.array(res["embedding"], dtype="float32")
    vecs = vecs / np.linalg.norm(vecs, axis=1, keepdims=True)
    return vecs


# ───────────────── CLEANER ─────────────────
def clean(text: str) -> str:
    text = re.sub(r'\*{3}(.+?)\*{3}', r'\1', text)
    text = re.sub(r'\*{2}(.+?)\*{2}', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    return text.strip()


# ───────────────── FAISS STORE ─────────────────
class FAISSStore:
    def __init__(self, dim=DIM):
        self.index = faiss.IndexFlatIP(dim)
        self.children = []
        self.parents = []
        self.child_to_parent = []

    @property
    def size(self):
        return self.index.ntotal

    def add_chunks(self, children, c2p, parents):
        self.parents = parents
        self.child_to_parent = c2p

        vecs = embed_batch(children)
        self.index.add(vecs)

        self.children.extend(children)
        logger.info(f"Indexed {len(children)} chunks")

    def search(self, query, k=6):
        if self.index.ntotal == 0:
            return [], []

        q = embed(query).reshape(1, -1)
        _, I = self.index.search(q, k)

        child_hits = []
        parent_hits = []
        seen = set()

        for i in I[0]:
            if i == -1:
                continue

            child_hits.append(self.children[i])

            pidx = self.child_to_parent[i]
            if pidx not in seen:
                parent_hits.append(self.parents[pidx])
                seen.add(pidx)

        return child_hits, parent_hits


_store = FAISSStore()
_pdf_indexed = False


# ───────────────── CHUNKING ─────────────────
def chunk(text, psize=1800, csize=400):
    parents = [text[i:i+psize] for i in range(0, len(text), psize)]

    children, c2p = [], []
    for pi, p in enumerate(parents):
        for j in range(0, len(p), csize):
            children.append(p[j:j+csize])
            c2p.append(pi)

    return parents, children, c2p


# ───────────────── INGEST PDF ─────────────────
def ingest_gst_pdf():
    global _pdf_indexed
    if _pdf_indexed:
        return

    if not os.path.exists(GST_PDF_PATH):
        logger.warning("GST PDF not found")
        return

    logger.info("Indexing GST PDF...")

    reader = PdfReader(GST_PDF_PATH)
    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    parents, children, c2p = chunk(text)
    _store.add_chunks(children, c2p, parents)

    _pdf_indexed = True
    logger.info("Indexing complete")


# ───────────────── WEB SEARCH ─────────────────
def web_search(q):
    try:
        res = tavily.search(query=f"GST India {q} 2025", max_results=4)
        return "\n\n".join(
            f"{r['url']}\n{r['content']}" for r in res["results"]
        )
    except Exception as e:
        logger.error(f"Web search failed: {e}")
        return ""


# ───────────────── ROUTER ─────────────────
def route(question):
    try:
        prompt = [
            {"role": "system", "content":
             'Return ONLY JSON: {"route":"kb"} or {"route":"web"} or {"route":"both"}'},
            {"role": "user", "content": question}
        ]

        res = groq_client.chat.completions.create(
            model=MODEL,
            messages=prompt,
            max_tokens=20
        ).choices[0].message.content

        return json.loads(res)["route"]
    except Exception as e:
        logger.error(f"Routing failed: {e}. Falling back to 'both'.")
        return "both"


# ───────────────── LLM REPORT ─────────────────
def generate(question, kb, web):
    system = """
You are a senior GST expert (India).
Return ONLY JSON. No markdown.
"""

    user = f"""
QUESTION: {question}

KB:
{kb}

WEB:
{web}

Return JSON with:
summary, applicable_rules, legal_provisions,
compliance_requirements, forms_required,
deadlines, penalties, recent_updates,
practical_guidance, risk_notes, confidence
"""

    try:
        res = groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            temperature=0.2,
            max_tokens=2000
        ).choices[0].message.content
        
        logger.info(f"LLM Response received (len: {len(res)})")
        return json.loads(res)

    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return {"error": str(e), "message": "Failed to generate structured report", "confidence": 0}


# ───────────────── MAIN API ─────────────────
def query_gst(question: str):
    ingest_gst_pdf()

    mode = route(question)

    kb, web = "", ""

    if mode in ["kb", "both"]:
        _, parents = _store.search(question)
        kb = "\n\n".join(parents[:3])

    if mode in ["web", "both"]:
        web = web_search(question)

    report = generate(question, kb, web)

    return {
        "mode": mode,
        "report": report,
        "chunks_indexed": _store.index.ntotal
    }


# ───────────────── TEST ─────────────────
if __name__ == "__main__":
    q = "Input tax credit eligibility under GST for IT services"
    print(json.dumps(query_gst(q), indent=2))