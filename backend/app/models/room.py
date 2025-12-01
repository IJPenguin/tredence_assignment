"""
Room model for storing collaboration room data in PostgreSQL.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.sql import func
from app.database import Base


class Room(Base):
    """
    PostgreSQL table model for rooms.

    Stores room data including unique room ID, code content, and timestamps.
    """

    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(String(8), unique=True, nullable=False)
    code = Column(Text, default="", nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Create indexes for better query performance
    __table_args__ = (Index("ix_rooms_created_at", "created_at"),)

    def __repr__(self):
        return f"<Room(id={self.id}, room_id={self.room_id})>"
