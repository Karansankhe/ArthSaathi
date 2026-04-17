import os
import json
import logging
from chatbot_logic import call_llm
import google.generativeai as genai

logger = logging.getLogger("finance-ai")

def extract_text_from_pdf(file_path: str) -> str:
    """Attempt to extract text from a PDF, primarily using pymupdf4llm, falling back to Gemini Vision on failure."""
    
    # 1. Try pymupdf4llm
    try:
        import pymupdf4llm
        logger.info(f"Attempting to parse {file_path} using pymupdf4llm...")
        md_text = pymupdf4llm.to_markdown(file_path)
        
        if md_text and len(md_text.strip()) > 20: 
            # Basic sanity check to ensure it actually extracted content
            logger.info("Successfully parsed with pymupdf4llm.")
            return md_text
        else:
            logger.warning("pymupdf4llm returned empty or very short text. Possibly scanned image. Falling back to Gemini.")
    except ImportError:
        logger.warning("pymupdf4llm not installed. Falling back to Gemini.")
    except Exception as e:
        logger.error(f"pymupdf4llm failed with error: {e}. Falling back to Gemini.")
        
    # 2. Fallback to Gemini
    try:
        logger.info(f"Using Gemini to extract text from {file_path}...")
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        
        # Uploading file directly to Gemini's File API allows robust multimodal extraction
        uploaded_file = genai.upload_file(file_path)
        
        # We ensure a capable multimodal model is used for document processing
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = "Please accurately extract all the text, numbers, and data tables from this document. Format any tables gracefully."
        
        result = model.generate_content([uploaded_file, prompt])
        text = result.text
        
        # Cleanup file from Gemini API storage
        try:
            genai.delete_file(uploaded_file.name)
        except Exception:
            pass
            
        logger.info("Successfully parsed with Gemini.")
        return text
    except Exception as e:
        logger.error(f"Gemini fallback failed: {e}")
        return ""

async def extract_all_data(files, text_data: str) -> str:
    """Process a mix of text data and uploaded files to consolidate text context."""
    content = ""
    
    if files:
        for f in files:
            if not f.filename: 
                continue
                
            # Temporarily save to disk to allow PDF processing
            temp_path = f"temp_{f.filename}"
            try:
                with open(temp_path, "wb") as buffer:
                    buffer.write(await f.read())
                
                if f.filename.lower().endswith('.pdf'):
                    extracted = extract_text_from_pdf(temp_path)
                    content += extracted + "\n"
                else:
                    # Generic text file reading fallback
                    with open(temp_path, "r", encoding="utf-8", errors="ignore") as txt_f:
                        content += txt_f.read() + "\n"
            except Exception as e:
                logger.error(f"Failed to process file {f.filename}: {e}")
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
    if text_data:
        content += text_data + "\n"
        
    return content

async def parse_and_get_stats(files, text_data: str) -> dict:
    """Takes user inputs, extracts text, and runs it through the analyzer LLM to yield dashboard JSON."""
    content = await extract_all_data(files, text_data)
    
    if not content.strip():
        raise ValueError("No data provided or extraction completely failed")
        
    prompt = f"""
    You are an expert data parser. Extract the financial data from the text and return ONLY valid JSON matching this schema exactly:
    {{
      "balance": {{"current": number, "history": [10 numbers], "last_month": [10 numbers]}},
      "income": {{"current": number}},
      "expense": {{
         "current": number,
         "categories": [{{"name": string, "value": number, "color": string hex}}]
      }},
      "budget_vs_expense": {{
         "months": [7 short string month names],
         "expense": [7 numbers],
         "budget": [7 numbers]
      }}
    }}
    
    If the text has specific expenses, use them to form the categories correctly. Synthesize realistic plausible data for the rest (history arrays, budget_vs_expense) to complement the provided numbers nicely so the charts look good.
    Text: {content}
    """
    
    try:
        text = call_llm(prompt)
        # Strip potential markdown blocks
        text = text.replace("```json", "").replace("```", "").strip()
        parsed_json = json.loads(text)
        return parsed_json
    except Exception as e:
        logger.error(f"Failed to parse data with LLM: {e}")
        raise ValueError(f"AI failed to parse data: {e}")
