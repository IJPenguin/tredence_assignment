from typing import Optional
from pydantic import BaseModel


class WebSocketMessage(BaseModel):
    """Schema for WebSocket messages"""

    type: str
    code: Optional[str] = None
    timestamp: Optional[int] = None
    message: Optional[str] = None
    roomId: Optional[str] = None
