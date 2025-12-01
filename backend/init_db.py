"""
Database initialization script for MongoDB.

This script connects to MongoDB and creates necessary indexes.
Run this script to initialize the database before starting the application.

Usage:
    python init_db.py
"""

import logging
import asyncio
from app.database import connect_to_mongo, close_mongo_connection, get_database

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


async def init_database():
    """Initialize the MongoDB database by creating indexes."""
    try:
        logger.info("Starting MongoDB initialization...")

        # Connect to MongoDB
        await connect_to_mongo()
        db = get_database()

        logger.info(f"Connected to database: {db.name}")

        # List existing collections
        collections = await db.list_collection_names()
        logger.info(f"Existing collections: {collections}")

        # Get indexes for rooms collection
        if "rooms" in collections:
            indexes = await db.rooms.index_information()
            logger.info("Indexes on 'rooms' collection:")
            for index_name, index_info in indexes.items():
                logger.info(f"  - {index_name}: {index_info}")
        else:
            logger.info("'rooms' collection will be created on first insert")

        logger.info("MongoDB initialization completed successfully!")

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(init_database())
