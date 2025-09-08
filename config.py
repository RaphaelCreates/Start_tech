import os
from dotenv import load_dotenv

load_dotenv()

def get_list_env(var_name: str):
    value = os.getenv(var_name, "")
    return [item.strip() for item in value.split(",") if item.strip()]

SECRET_KEY = os.getenv("SECRET_KEY", "default_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))