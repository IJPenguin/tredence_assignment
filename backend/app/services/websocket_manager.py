"""
WebSocket connection manager for handling real-time collaboration.
"""

from fastapi import WebSocket
from typing import Dict, List, Optional
import logging
import json
from app.services.room_service import get_room

# Configure logging
logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages WebSocket connections for real-time code collaboration.

    Maintains an in-memory dictionary of active connections per room
    and provides methods for connection lifecycle management and broadcasting.
    """

    def __init__(self):
        """Initialize the WebSocket manager with an empty connections dictionary."""
        # Dictionary structure: {room_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket) -> None:
        """
        Add a WebSocket connection to the active connections for a room.

        Args:
            room_id: The unique room identifier
            websocket: The WebSocket connection to add

        """
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        self.active_connections[room_id].append(websocket)
        logger.info(
            f"WebSocket connected to room {room_id}. Total connections: {len(self.active_connections[room_id])}"
        )

    async def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        """
        Remove a WebSocket connection from active connections and clean up empty rooms.

        Args:
            room_id: The unique room identifier
            websocket: The WebSocket connection to remove

        """
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
                logger.info(
                    f"WebSocket disconnected from room {room_id}. Remaining connections: {len(self.active_connections[room_id])}"
                )

            # Clean up empty room entries
            if len(self.active_connections[room_id]) == 0:
                del self.active_connections[room_id]
                logger.info(
                    f"Room {room_id} removed from active connections (no remaining connections)"
                )

    async def broadcast(
        self, room_id: str, message: dict, exclude: Optional[WebSocket] = None
    ) -> None:
        """
        Send a message to all WebSocket connections in a room.

        Args:
            room_id: The unique room identifier
            message: The message dictionary to send (will be JSON serialized)
            exclude: Optional WebSocket connection to exclude from broadcast

        """
        if room_id not in self.active_connections:
            logger.warning(f"Attempted to broadcast to non-existent room {room_id}")
            return

        # Convert message to JSON string
        message_json = json.dumps(message)

        # Send to all connections except the excluded one
        disconnected_websockets = []
        for connection in self.active_connections[room_id]:
            if connection != exclude:
                try:
                    await connection.send_text(message_json)
                except Exception as e:
                    logger.error(
                        f"Error sending message to WebSocket in room {room_id}: {e}"
                    )
                    disconnected_websockets.append(connection)

        # Clean up any disconnected websockets
        for ws in disconnected_websockets:
            await self.disconnect(room_id, ws)

    async def send_initial_state(self, websocket: WebSocket, room_id: str, db) -> None:
        """
        Send the current code state to a newly connected WebSocket.

        Args:
            websocket: The WebSocket connection to send the initial state to
            room_id: The unique room identifier
            db: PostgreSQL database session for retrieving room data

        """
        try:
            # Get current room state from database
            room = await get_room(db, room_id)

            if room is None:
                error_message = {"type": "error", "message": "Room not found"}
                await websocket.send_text(json.dumps(error_message))
                logger.warning(
                    f"Attempted to send initial state for non-existent room {room_id}"
                )
                return

            # Send initial state message
            initial_state_message = {
                "type": "initial_state",
                "code": room.code,
                "roomId": room_id,
            }
            await websocket.send_text(json.dumps(initial_state_message))
            logger.info(f"Sent initial state to WebSocket in room {room_id}")

        except Exception as e:
            logger.error(f"Error sending initial state for room {room_id}: {e}")
            error_message = {
                "type": "error",
                "message": "Failed to retrieve initial state",
            }
            await websocket.send_text(json.dumps(error_message))


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
