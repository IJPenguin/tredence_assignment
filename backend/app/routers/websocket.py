"""
WebSocket router for real-time code collaboration.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import logging
import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.websocket_manager import websocket_manager
from app.services.room_service import room_exists, update_room_code
from app.schemas import WebSocketMessage
from pydantic import ValidationError

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, room_id: str, db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time code collaboration.

    Args:
        websocket: The WebSocket connection
        room_id: The unique room identifier
        db: PostgreSQL database session
    """
    # Validate room existence before accepting connection
    if not await room_exists(db, room_id):
        await websocket.close(code=4004, reason="Room not found")
        logger.warning(f"WebSocket connection rejected: Room {room_id} does not exist")
        return

    # Accept connection and add to manager
    await websocket_manager.connect(room_id, websocket)

    try:
        # Send initial code state to newly connected client
        await websocket_manager.send_initial_state(websocket, room_id, db)

        # Listen for incoming messages
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                # Parse message as JSON
                message_dict = json.loads(data)

                # Validate message against WebSocketMessage schema
                message = WebSocketMessage(**message_dict)

                # Handle different message types
                if message.type == "code_update":
                    # Validate required fields for code_update
                    if message.code is None:
                        error_msg = {
                            "type": "error",
                            "message": "Missing 'code' field in code_update message",
                        }
                        await websocket.send_text(json.dumps(error_msg))
                        logger.warning(
                            f"Invalid code_update message in room {room_id}: missing 'code' field"
                        )
                        continue

                    try:
                        # Update code in database (last-write-wins strategy)
                        updated_room = await update_room_code(db, room_id, message.code)

                        if updated_room is None:
                            error_msg = {
                                "type": "error",
                                "message": "Failed to update room code",
                            }
                            await websocket.send_text(json.dumps(error_msg))
                            logger.error(f"Failed to update code for room {room_id}")
                            continue

                        # Broadcast code update to all other clients in the room
                        broadcast_message = {
                            "type": "code_update",
                            "code": message.code,
                            "timestamp": message.timestamp,
                        }
                        await websocket_manager.broadcast(
                            room_id, broadcast_message, exclude=websocket
                        )

                        logger.info(f"Code updated and broadcasted in room {room_id}")

                    except Exception as e:
                        logger.error(f"Database error updating room {room_id}: {e}")
                        error_msg = {
                            "type": "error",
                            "message": "Database error occurred",
                        }
                        await websocket.send_text(json.dumps(error_msg))

                else:
                    # Unknown message type
                    logger.warning(
                        f"Unknown message type '{message.type}' received in room {room_id}"
                    )
                    error_msg = {
                        "type": "error",
                        "message": f"Unknown message type: {message.type}",
                    }
                    await websocket.send_text(json.dumps(error_msg))

            except json.JSONDecodeError as e:
                logger.warning(f"Invalid JSON received in room {room_id}: {e}")
                error_msg = {"type": "error", "message": "Invalid JSON format"}
                await websocket.send_text(json.dumps(error_msg))

            except ValidationError as e:
                logger.warning(f"Invalid message format in room {room_id}: {e}")
                error_msg = {"type": "error", "message": "Invalid message format"}
                await websocket.send_text(json.dumps(error_msg))

    except WebSocketDisconnect:
        # Handle disconnection
        await websocket_manager.disconnect(room_id, websocket)
        logger.info(f"WebSocket disconnected from room {room_id}")

    except Exception as e:
        # Handle unexpected errors
        logger.error(
            f"Unexpected error in WebSocket connection for room {room_id}: {e}"
        )
        await websocket_manager.disconnect(room_id, websocket)
