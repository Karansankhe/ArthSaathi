import os
import requests
import dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt

dotenv.load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/keys"

security = HTTPBearer()

# Fetch public keys
try:
    response = requests.get(JWKS_URL)
    response.raise_for_status()
    jwks = response.json()
except Exception as e:
    print(f"⚠️ Could not fetch JWKS keys from Supabase: {e}")
    jwks = {"keys": []}

def verify_token(token: str):
    try:
        header = jwt.get_unverified_header(token)
        # Find the key that matches the header's kid (Key ID)
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == header.get("kid")), None)
        
        if not key:
            raise Exception("Key not found in JWKS")

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="authenticated"
        )
        return payload

    except Exception as e:
        # Log the exception for debugging but return a generic 401
        print(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials=Depends(security)):
    token = credentials.credentials
    return verify_token(token)
