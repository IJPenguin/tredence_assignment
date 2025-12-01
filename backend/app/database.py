"""
Database connection and session management module for PostgreSQL.
"""

import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Load environment variables
load_dotenv()

# Get PostgreSQL URL from environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/pairprog"
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()


async def get_db():
    """
    Dependency for getting async database session.

    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables on application startup.
    """
    import logging

    logger = logging.getLogger(__name__)

    async with engine.begin() as conn:
        # Import models to register them with Base
        from app.models.room import Room  # noqa: F401

        # Drop all tables first (clean slate)
        logger.info("Dropping existing tables...")
        await conn.run_sync(Base.metadata.drop_all)

        # Create all tables
        logger.info("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")


async def close_db():
    """
    Close database connection on application shutdown.
    """
    await engine.dispose()
