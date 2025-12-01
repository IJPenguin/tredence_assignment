from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

from app.database import init_db, close_db
from app.routers import rooms, autocomplete, websocket

# Load environment variables
load_dotenv()

# Get configuration from environment variables
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Real-Time Pair Programming API",
    description="Backend API for collaborative code editing with WebSocket support",
    version="1.0.0",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Load from environment variable
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(rooms.router)
app.include_router(autocomplete.router)
app.include_router(websocket.router)


@app.on_event("startup")
async def startup_event():
    """Initialize PostgreSQL database and create tables on application startup"""
    logger.info("Initializing PostgreSQL database...")
    await init_db()
    logger.info("PostgreSQL database initialized successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Close PostgreSQL connection on application shutdown"""
    logger.info("Closing PostgreSQL connection...")
    await close_db()
    logger.info("PostgreSQL connection closed")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Real-Time Pair Programming API"}


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    # Get port from environment variable (for Render deployment) or default to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
