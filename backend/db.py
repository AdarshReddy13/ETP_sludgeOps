import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# load .env from the backend folder no matter where you run the command from
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

_client = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SECRET_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL or SUPABASE_SECRET_KEY missing in backend/.env")
        _client = create_client(url, key)
    return _client


def check():
    """Real connection test: returns (ok, error_text)."""
    try:
        get_client().table("plants").select("id").limit(1).execute()
        return True, None
    except Exception as e:
        return False, str(e)[:300]