import os
from dotenv import load_dotenv

load_dotenv()

def get_list_env(var_name: str):
    value = os.getenv(var_name, "")
    return [item.strip() for item in value.split(",") if item.strip()]

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

ALLOWED_ORIGINS = get_list_env("ALLOWED_ORIGINS")


INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")