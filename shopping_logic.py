import os
import re
import json
import streamlit as st
from dotenv import load_dotenv
from groq import Groq
from tavily import TavilyClient
import pymongo # Using synchronous pymongo for Streamlit integration

# ================= LOAD ENV =================
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")

groq_client = Groq(api_key=GROQ_API_KEY)
tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None

MODEL = "openai/gpt-oss-120b"

# ================= RESPONSE CLEANER =================
def clean_response(text: str) -> str:
    """Strip markdown bold/italic markers and clean excess whitespace."""
    if not text:
        return text
    text = re.sub(r'\*{3}(.+?)\*{3}', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*{2}(.+?)\*{2}', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*(.+?)\*', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*+', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# ================= FUNCTIONS =================

def fetch_latest_db_stats():
    """Retrieves the most recent financial data from MongoDB"""
    if not MONGODB_URI or "<db_password>" in MONGODB_URI:
        return None
    try:
        client = pymongo.MongoClient(MONGODB_URI)
        db = client[os.getenv("MONGODB_DB_NAME", "ArthSaathi")]
        collection = db[os.getenv("MONGODB_COLLECTION_NAME", "financial_data")]
        data = collection.find_one(sort=[("timestamp", -1)])
        return data
    except Exception as e:
        print(f"DB Fetch Error: {e}")
        return None

def call_llm(prompt):
    import time
    max_retries = 2
    for i in range(max_retries):
        try:
            res = groq_client.chat.completions.create(
                model=MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are ArthSaathi, a premium financial shopping advisor. "
                            "Always provide an 'Affordability Score' (0-100) and 'Logical Confidence Level' (%). "
                            "Analyze affordability, risks, EMI options, and give ranked recommendations. "
                            "Respond in clean plain text only. Do NOT use ** or *** markdown markers. "
                            "Use numbered lists and dashes for structure."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            return clean_response(res.choices[0].message.content)
        except Exception as e:
            if ("429" in str(e) or "quota" in str(e).lower()) and i < max_retries - 1:
                time.sleep(2)
                continue
            return f"Service currently unavailable due to high demand. (Error: {str(e)})"

def tavily_search(query):
    if not tavily_client:
        return []
    try:
        res = tavily_client.search(query=query, max_results=5)
        return res.get("results", [])
    except Exception as e:
        return [{"error": str(e)}]

def analyze(query, user_stats):
    income = user_stats["income"]["current"]
    expenses = user_stats["expense"]["current"]
    balance = user_stats["balance"]["current"]
    categories = user_stats["expense"]["categories"]

    disposable = income - expenses

    market_data = tavily_search(f"buy {query} price india best deals")

    prompt = f"""
You are ArthSaathi AI Shopping + Finance Advisor.

USER QUERY:
{query}

USER FINANCIAL DATA:
- Income: ₹{income}
- Expenses: ₹{expenses}
- Balance: ₹{balance}
- Monthly Savings: ₹{disposable}

Expense Breakdown:
{json.dumps(categories, indent=2)}

MARKET DATA:
{json.dumps(market_data, indent=2)}

TASK:
1. Check if user can afford this safely.
2. Suggest BUY / WAIT / EMI.
3. Rank top 3 options if available.
4. Show financial impact (months of savings used).
5. Give simple explanation in human tone.
"""

    return call_llm(prompt)

# Alias for main.py compatibility
def analyze_shopping_query(query, user_stats):
    return analyze(query, user_stats)

# ================= STREAMLIT UI =================

if __name__ == "__main__":
    st.set_page_config(page_title="ArthSaathi AI", layout="wide")

    st.title("🛒 ArthSaathi AI - Smart Shopping & Finance Advisor")
    st.caption("AI-powered affordability + product recommendation engine")

    # ================= SIDEBAR =================

    st.sidebar.header("💰 Financial Profile")

    # Auto-fetch from MongoDB on load
    if "db_data" not in st.session_state:
        with st.sidebar:
            with st.spinner("Fetching data from MongoDB..."):
                st.session_state.db_data = fetch_latest_db_stats()
                if st.session_state.db_data:
                    st.sidebar.success("✅ Auto-synced with MongoDB")
                else:
                    st.sidebar.info("💡 Using default values (DB not found or empty)")

    db_data = st.session_state.db_data

    # Use DB data as default if available
    def_income = float(db_data["income"]["current"]) if db_data else 80000.0
    def_expenses = float(db_data["expense"]["current"]) if db_data else 40000.0
    def_balance = float(db_data["balance"]["current"]) if db_data else 150000.0
    def_categories = db_data["expense"]["categories"] if db_data else [{"food": 10000}, {"rent": 20000}, {"travel": 5000}]

    income_input = st.sidebar.number_input("Monthly Income (₹)", value=def_income)
    expenses_input = st.sidebar.number_input("Monthly Expenses (₹)", value=def_expenses)
    balance_input = st.sidebar.number_input("Current Balance (₹)", value=def_balance)

    categories_input = st.sidebar.text_area(
        "Expense Categories (JSON)",
        value=json.dumps(def_categories, indent=2)
    )

    try:
        categories = json.loads(categories_input)
    except:
        categories = []

    user_stats = {
        "income": {"current": income_input},
        "expense": {
            "current": expenses_input,
            "categories": categories
        },
        "balance": {"current": balance_input}
    }

    # ================= MAIN =================

    st.subheader("🔍 Search Product / Service")

    query = st.text_input("Enter product (e.g. iPhone 15, MacBook, Bike, Shoes)")

    col1, col2 = st.columns([1, 1])

    with col1:
        run = st.button("Analyze 💡")

    with col2:
        st.info("Get affordability + EMI + alternatives + recommendation")

    # ================= OUTPUT =================

    if run and query:
        with st.spinner("Analyzing your financial safety + fetching market data..."):
            result = analyze(query, user_stats)

        st.success("Analysis Complete")

        st.subheader("📊 AI Financial Recommendation")
        st.markdown(result)

        st.divider()

        st.subheader("📌 Raw Market Data (Debug View)")

        market = tavily_search(f"{query} price india buy")
        st.json(market)

    # ================= FOOTER =================

    st.divider()
    st.caption("Built with Groq + Tavily + Streamlit | ArthSaathi Smart Finance Engine")