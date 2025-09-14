from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import create_db_and_tables, close_connector
from routers import line_router, city_router, schedule_router, bus_router, user_router, authentication_router
import uvicorn, os
import redis.asyncio as redis
from config import ALLOWED_ORIGINS
from datetime import datetime, timezone
from utils import encrypt
import logging
from models import audit_model as log
from core.database import get_session, init_engine

from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_engine()
    await create_db_and_tables()
    #redis_url = os.getenv("REDIS_URL")
    #if redis_url:
     #   r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
      #  await FastAPILimiter.init(r, identifier=get_remote_address)
    yield  
    await close_connector()


async def get_remote_address(request: Request) -> str:
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host
    return ip

app = FastAPI(lifespan=lifespan, title="Fretotvs API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        ip = await get_remote_address(request)
        method = request.method
        path = request.url.path
        timestamp = datetime.utcnow()
        user_agent = request.headers.get("user-agent")
        secret_key = os.getenv("SECRET_KEY")

        logging.info(f"Audit: {method} {path} from {ip}")

        response = await call_next(request)
        status_code = response.status_code

        try:
            async for session in get_session():
                audit_entry = log.AuditLog(
                    ip=encrypt.encrypt_data(secret_key, ip),
                    method=method,
                    path=path,
                    timestamp=timestamp,
                    user_agent=user_agent,
                    status_code=status_code,
                )
                session.add(audit_entry)
                await session.commit()
                logging.info(f"Audit log saved: {method} {path} -> {status_code}")
        except Exception as e:
            logging.error(f"Error saving audit log: {e}")

        return response
    
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "font-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        ).strip().replace("    ", " ")

        response.headers["Content-Security-Policy"] = csp
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

        for header in ["server", "x-powered-by"]:
            try:
                del response.headers[header]
            except KeyError:
                pass

        return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(AuditMiddleware)


#app.add_middleware(SecurityHeadersMiddleware)


#app.add_middleware(HTTPSRedirectMiddleware)

app.include_router(line_router.router)
app.include_router(city_router.router)
app.include_router(schedule_router.router)
app.include_router(bus_router.router)
app.include_router(user_router.router)
app.include_router(authentication_router.router)

port = int(os.environ.get("PORT", 8080))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=port)