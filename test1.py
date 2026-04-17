from dotenv import load_dotenv
load_dotenv()

import streamlit as st
import os
import google.generativeai as genai
from tavily import TavilyClient

# ================== CONFIG ==================
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

# ✅ Use stable model (your previous one will break)
model = genai.GenerativeModel("gemini-3-flash-preview")

# ================== SESSION STATE ==================
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

if "questions" not in st.session_state:
    st.session_state.questions = []

if "current_q_index" not in st.session_state:
    st.session_state.current_q_index = 0

if "answers" not in st.session_state:
    st.session_state.answers = []

if "pending_question" not in st.session_state:
    st.session_state.pending_question = None


# ================== AGENT FUNCTIONS ==================

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

    response = model.generate_content(prompt)

    lines = response.text.split("\n")
    questions = []

    for line in lines:
        line = line.strip()
        if line:
            # remove numbering like 1. 2. etc
            cleaned = line.lstrip("1234567890. ").strip()
            questions.append(cleaned)

    return questions[:3]


def tavily_search(query):
    """Web search using Tavily"""
    try:
        result = tavily.search(query=query, max_results=3)
        sources = []
        for r in result["results"]:
            sources.append(f"{r['title']}: {r['content']}")
        return "\n".join(sources)
    except:
        return "No web data available"


def generate_final_answer(question, answers, web_data):
    """Final reasoning agent"""
    context = "\n".join(answers)

    prompt = f"""
    You are an expert financial advisor AI.

    User Question:
    {question}

    User Details:
    {context}

    Web Insights:
    {web_data}

    Instructions:
    - Give a personalized investment plan
    - Include allocation (percentages)
    - Keep it simple and practical
    - Avoid generic advice

    Final Answer:
    """

    response = model.generate_content(prompt)
    return response.text


# ================== STREAMLIT UI ==================

st.set_page_config(page_title="Agentic Finance Chatbot")
st.title("💡 Agentic Finance AI (Gemini + Tavily)")

user_input = st.text_input("Enter your message")

col1, col2 = st.columns(2)
submit = col1.button("Submit")
reset = col2.button("Reset")

# ================== RESET ==================
if reset:
    st.session_state.questions = []
    st.session_state.answers = []
    st.session_state.current_q_index = 0
    st.session_state.pending_question = None
    st.session_state.chat_history = []
    st.success("Reset complete")


# ================== MAIN FLOW ==================

if submit and user_input:

    # STEP 1: First interaction → generate followups
    if not st.session_state.questions:

        st.session_state.pending_question = user_input
        st.session_state.questions = generate_followups(user_input)
        st.session_state.current_q_index = 0
        st.session_state.answers = []

        st.session_state.chat_history.append(("User", user_input))

        st.subheader("🤖 Let me understand first:")
        st.write(st.session_state.questions[0])

    # STEP 2: Collect answers one by one
    else:
        st.session_state.answers.append(user_input)
        st.session_state.chat_history.append(("User", user_input))

        st.session_state.current_q_index += 1

        # Ask next question
        if st.session_state.current_q_index < len(st.session_state.questions):

            next_q = st.session_state.questions[st.session_state.current_q_index]
            st.write(next_q)

        # STEP 3: Final Answer
        else:
            question = st.session_state.pending_question

            with st.spinner("🔍 Analyzing + Searching web..."):
                web_data = tavily_search(question)

                answer = generate_final_answer(
                    question,
                    st.session_state.answers,
                    web_data
                )

            st.subheader("✅ Final Answer")
            st.write(answer)

            st.session_state.chat_history.append(("Bot", answer))

            # RESET FLOW (but keep history)
            st.session_state.questions = []
            st.session_state.answers = []
            st.session_state.current_q_index = 0
            st.session_state.pending_question = None


# ================== CHAT HISTORY ==================

st.subheader("📜 Chat History")

for role, text in st.session_state.chat_history:
    if role == "User":
        st.write(f"🧑 **You:** {text}")
    else:
        st.write(f"🤖 **Bot:** {text}")