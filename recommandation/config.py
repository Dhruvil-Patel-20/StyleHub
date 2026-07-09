from dotenv import load_dotenv
import os

# Explicitly load the .env file from the current folder
load_dotenv(dotenv_path=".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# print("SUPABASE_URL:", SUPABASE_URL)
# print("SUPABASE_KEY exists:", SUPABASE_KEY is not None)