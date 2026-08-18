"""
FastAPI Application Entry Point

Starts the AI Security Assistant backend with:
- CORS configured for Chrome Extension origin
- Rate limiting
- Request size limits
- Structured logging
- Lifespan management
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import get_settings
from app.core.logging_config import setup_logging
from app.api.routes import analyze

# Initialize logging before anything else
setup_logging()
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    logger.info(
        "AI Security Assistant starting up",
        extra={"version": settings.app_version, "debug": settings.debug}
    )
    yield
    logger.info("AI Security Assistant shutting down")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Security Assistant API",
    description="""
    **AI-powered browser security analysis backend.**
    
    Analyzes URLs and page content for phishing, brand impersonation, 
    credential harvesting, and social engineering attacks.
    
    🔒 **Privacy**: Never stores passwords, cookies, or personal data.
    """,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Chrome extensions send requests from chrome-extension://<extension-id>
# We allow all origins in dev. In production, restrict to your extension ID.

if settings.allow_all_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Accept", "X-Request-ID"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Accept", "X-Request-ID"],
    )

# ── Request Size Limit Middleware ─────────────────────────────────────────────

@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.max_html_content_bytes:
        return JSONResponse(
            status_code=413,
            content={"detail": f"Request too large (max {settings.max_html_content_bytes // 1024}KB)"}
        )
    return await call_next(request)


# ── Exception Handlers ────────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    logger.warning("Request validation error", extra={"errors": str(exc.errors())[:500]})
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "detail": "Invalid request data",
            "errors": exc.errors()[:5]   # Cap error list
        }
    )


@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": "Internal server error"}
    )


# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(analyze.router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/health"
    }
