"""
Rooms router for handling room-related REST API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import RoomCreate, RoomResponse
from app.services import room_service

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(db: AsyncSession = Depends(get_db)):
    """
    Create a new collaboration room with a unique room ID.

    Returns:
        RoomResponse: Contains the generated room ID

    Raises:
        HTTPException: 500 if database operation fails
    """
    try:
        room = await room_service.create_room(db)
        return RoomResponse(roomId=room.room_id)
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create room: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )
