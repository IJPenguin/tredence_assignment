from pydantic import BaseModel


class RoomCreate(BaseModel):
    """Schema for room creation request - no input required"""

    pass


class RoomResponse(BaseModel):
    """Schema for room creation response"""

    roomId: str
