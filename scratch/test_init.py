
import os
import dotenv
from agno.agent import Agent
from agno.team.team import Team
from agno.models.google import Gemini
from agno.tools.reasoning import ReasoningTools
from agno.tools.tavily import TavilyTools

dotenv.load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

def test_init():
    try:
        print("Initializing Gemini...")
        gemini = Gemini(
            id="gemini-2.0-flash-exp", # Using a more common ID
            api_key=GEMINI_API_KEY
        )
        
        print("Creating agents...")
        budget_agent = Agent(name="Budgeting Analyst", model=gemini)
        
        print("Building team...")
        team = Team(
            name="Financial Advisor",
            members=[budget_agent],
            model=gemini
        )
        print("Success!")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_init()
