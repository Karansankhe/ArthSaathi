# 💸 Financial AI Multi-Agent System

A **human-like conversational financial AI backend** built with FastAPI, Gemini, and Tavily.

This system uses a **multi-agent architecture** to provide personalized financial education on:

* Budgeting
* Saving
* Investing

---

## 🧠 Architecture Overview

```
User Query
   ↓
Supervisor (Intent + Routing)
   ↓
Specialized Agents
   ↓
Tavily Search (External Knowledge)
   ↓
Response Synthesis
   ↓
Streaming Output
```

---

## 🧩 Agents

| Agent               | Role                             |
| ------------------- | -------------------------------- |
| Budgeting Analyst   | Expense & cash flow optimization |
| Savings Strategist  | Saving, emergency funds, debt    |
| Investment Educator | Investing & risk education       |

---

## 🌐 External Knowledge

Powered by **Tavily Search API**

Why Tavily:

* Cleaner results than DuckDuckGo
* Better for LLM reasoning
* Financial content relevance

---

## ⚙️ Tech Stack

* FastAPI
* Gemini (LLM)
* Agno (Agent Framework)
* Tavily (Search / RAG)
* StreamingResponse (real-time output)

---

## 📦 Setup Instructions

### 1. Clone Project

```bash
git clone <your-repo>
cd financial-ai
```

---

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Add Environment Variables

Create `.env` file:

```
GEMINI_API_KEY=your_gemini_key
TAVILY_API_KEY=your_tavily_key
```

---

### 5. Run Server

```bash
uvicorn main:app --reload
```

---

## 📡 API Usage

### Endpoint

`POST /chat`

### Request

```json
{
  "query": "I earn 50k but save nothing"
}
```

---

### Response

* Human-like financial guidance
* Structured markdown
* Actionable steps
* Optional sources
* Streamed output

---

## 🧪 Example Flow

User:

> "I want to save more and start investing"

System:

* Routes to Savings + Investment agents
* Uses Tavily if needed
* Returns unified response

---

## 🛡️ Disclaimer

This system provides **educational financial guidance only** and is not a certified financial advisor.

---

## 🔥 Features

* Multi-agent orchestration
* Dynamic routing
* Tavily-powered search (RAG)
* Human-like responses
* Streaming API
* Clean modular design

---

## 🚀 Future Enhancements

* User financial memory (Redis / DB)
* Personalized financial profiles
* Indian finance integrations (SIP, UPI)
* Dashboard UI (React)
* Voice-based advisor

---

## 🤝 Contribution

Open to contributions:

* Better prompts
* More agents
* Financial datasets
* UI/UX improvements

---

## 💡 Vision

To build a **Jarvis for Personal Finance**—accessible, intelligent, and human-like financial guidance for everyone.

---
