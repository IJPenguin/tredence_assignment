"""
Room service layer for handling room-related business logic with PostgreSQL.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from app.models.room import Room


async def create_room(db: AsyncSession) -> Room:
    """
    Create a new collaboration room with a unique 8-character room ID.

    Args:
        db: PostgreSQL database session

    Returns:
        Room: The created room object

    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Generate unique 8-character room ID
        room_id = str(uuid.uuid4())[:8]

        # Ensure uniqueness (very unlikely collision, but check anyway)
        while await room_exists(db, room_id):
            room_id = str(uuid.uuid4())[:8]

        # Create new room
        room = Room(room_id=room_id, code="")

        db.add(room)
        await db.commit()
        await db.refresh(room)

        return room
    except SQLAlchemyError as e:
        await db.rollback()
        raise e


async def get_room(db: AsyncSession, room_id: str) -> Optional[Room]:
    """
    Retrieve a room from the database by room ID.

    Args:
        db: PostgreSQL database session
        room_id: The unique room identifier

    Returns:
        Room: The room object if found, None otherwise

    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        result = await db.execute(select(Room).where(Room.room_id == room_id))
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        raise e


async def update_room_code(db: AsyncSession, room_id: str, code: str) -> Optional[Room]:
    """
    Update the code content for a specific room.

    Args:
        db: PostgreSQL database session
        room_id: The unique room identifier
        code: The new code content

    Returns:
        Room: The updated room object if found, None otherwise

    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        room = await get_room(db, room_id)
        if room:
            room.code = code
            room.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(room)
            return room
        return None
    except SQLAlchemyError as e:
        await db.rollback()
        raise e


async def room_exists(db: AsyncSession, room_id: str) -> bool:
    """
    Check if a room exists in the database.

    Args:
        db: PostgreSQL database session
        room_id: The unique room identifier

    Returns:
        bool: True if room exists, False otherwise

    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        result = await db.execute(select(Room).where(Room.room_id == room_id))
        return result.scalar_one_or_none() is not None
    except SQLAlchemyError as e:
        raise e
