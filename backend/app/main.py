"""
Main FastAPI application module.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.routers import rooms_router, autocomplete_router, websocket_router

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
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
    allow_origins=["http://localhost:3000"],  # Frontend development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(rooms_router)
app.include_router(autocomplete_router)
app.include_router(websocket_router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Real-Time Pair Programming API"}


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}
