import google.generativeai as genai
import os

# Configure API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("\n🔍 Available Gemini Models:\n")

for model in genai.list_models():
    if "generateContent" in model.supported_generation_methods:
        print(f"✅ {model.name}")