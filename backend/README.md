# Real-Time Pair Programming Backend

A FastAPI-based backend service for collaborative code editing with WebSocket support and AI-style autocomplete suggestions.

## Features

-   **Real-time collaboration**: Multiple users can edit code simultaneously with instant synchronization
-   **Room-based sessions**: Create and join collaboration rooms with unique IDs
-   **WebSocket support**: Bidirectional communication for real-time updates
-   **Autocomplete suggestions**: Mocked AI-style code completion
-   **MongoDB persistence**: Room data and code state stored in database

## Architecture

The application follows a clean architecture with separation of concerns:

```
backend/
├── app/
│   ├── routers/          # API endpoints (REST and WebSocket)
│   ├── services/         # Business logic layer
│   ├── models/           # MongoDB document models
│   ├── schemas/          # Pydantic validation schemas
│   └── database.py       # Database connection setup
├── tests/                # Unit and integration tests
├── main.py              # Application entry point
└── requirements.txt     # Python dependencies
```

## Prerequisites

-   Python 3.11+
-   MongoDB 6.0+ (or use Docker)
-   pip or poetry for dependency management

## Environment Setup

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Database Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=pairprog

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging Configuration
LOG_LEVEL=INFO
```

### 5. Set Up Database

#### Option A: Using Docker (Recommended)

From the project root directory:

```bash
docker-compose up -d mongodb
```

This starts a MongoDB container with the default configuration.

#### Option B: Local MongoDB

Install MongoDB and start the service:

```bash
# Windows (as service)
net start MongoDB

# Linux
sudo systemctl start mongod

# Mac
brew services start mongodb-community
```

The database `pairprog` will be created automatically on first use.

### 6. Initialize Database Indexes

Run the initialization script:

```bash
python init_db.py
```

Or let the application create indexes automatically on startup.

## Running the Application

### Development Mode

```bash
# From backend directory
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

-   API: http://localhost:8000
-   Interactive docs: http://localhost:8000/docs
-   Alternative docs: http://localhost:8000/redoc

### Using Docker Compose

From the project root directory:

```bash
docker-compose up
```

This starts both MongoDB and the backend service.

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### REST Endpoints

#### Create Room

```http
POST /rooms
Content-Type: application/json

Response:
{
  "roomId": "abc123xyz"
}
```

#### Get Autocomplete Suggestion

```http
POST /autocomplete
Content-Type: application/json

{
  "code": "def calculate_sum(a, b):\n    return ",
  "cursorPosition": 35,
  "language": "python"
}

Response:
{
  "suggestion": "a + b",
  "confidence": 0.95
}
```

#### Health Check

```http
GET /health

Response:
{
  "status": "healthy"
}
```

### WebSocket Endpoint

#### Connect to Room

```
WS /ws/{room_id}
```

**Client → Server Messages:**

```json
{
    "type": "code_update",
    "code": "print('Hello, World!')",
    "timestamp": 1638360000000
}
```

**Server → Client Messages:**

Initial state on connection:

```json
{
    "type": "initial_state",
    "code": "print('Hello, World!')",
    "roomId": "abc123xyz"
}
```

Code update broadcast:

```json
{
    "type": "code_update",
    "code": "print('Hello, World!')",
    "timestamp": 1638360000000
}
```

Error message:

```json
{
    "type": "error",
    "message": "Room not found"
}
```

## Architecture and Design Choices

### WebSocket Manager

The WebSocket manager maintains an in-memory dictionary mapping room IDs to lists of active WebSocket connections:

```python
{
    "room_abc123": [websocket1, websocket2],
    "room_xyz789": [websocket3]
}
```

**Design Rationale:**

-   **Simplicity**: No external dependencies required for basic functionality
-   **Performance**: In-memory operations are fast for small-scale deployments
-   **Automatic Cleanup**: Connections are removed on disconnect, preventing memory leaks
-   **Room Isolation**: Messages are only broadcast to connections in the same room

**Trade-offs:**

-   Cannot scale horizontally across multiple server instances
-   State is lost on server restart
-   Limited to single-server deployments

### Last-Write-Wins Synchronization

The system uses a simple last-write-wins strategy for conflict resolution:

1. Client sends code update via WebSocket
2. Server immediately updates database with new code
3. Server broadcasts update to all other clients in the room
4. No conflict detection or operational transformation

**Design Rationale:**

-   **Simplicity**: Easy to implement and reason about
-   **Sufficient for Use Case**: Works well for 2-user collaboration
-   **Low Latency**: No complex conflict resolution algorithms
-   **Predictable Behavior**: Users understand that latest edit wins

**Trade-offs:**

-   Simultaneous edits can result in lost changes
-   No merge capabilities for concurrent modifications
-   Not suitable for large teams or high-conflict scenarios

### Service Layer Pattern

The application separates concerns into distinct layers:

```
Routers (HTTP/WebSocket) → Services (Business Logic) → Models (Data Access)
```

**Design Rationale:**

-   **Testability**: Business logic can be tested independently of HTTP layer
-   **Reusability**: Services can be called from multiple routers
-   **Maintainability**: Clear separation makes code easier to understand
-   **Flexibility**: Easy to swap implementations (e.g., different database)

**Key Services:**

-   `RoomService`: Manages room creation, retrieval, and code updates
-   `AutocompleteService`: Generates mocked code suggestions
-   `WebSocketManager`: Handles connection lifecycle and message broadcasting

### Database Design

Simple schema with a single `rooms` collection in MongoDB:

```json
{
    "_id": ObjectId("..."),
    "room_id": "abc123xy",
    "code": "print('Hello, World!')",
    "created_at": ISODate("2024-01-01T00:00:00Z"),
    "updated_at": ISODate("2024-01-01T00:00:00Z")
}
```

**Fields:**

-   **\_id**: MongoDB ObjectId (primary key)
-   **room_id**: Unique 8-character identifier (indexed for fast lookups)
-   **code**: Current code state (string, no size limit)
-   **created_at**: Timestamp when room was created
-   **updated_at**: Timestamp of last code update

**Design Rationale:**

-   **Minimal Complexity**: Single collection sufficient for MVP
-   **Fast Queries**: Unique index on room_id ensures quick lookups
-   **Persistence**: Code survives server restarts
-   **Audit Trail**: Timestamps help with debugging
-   **Flexibility**: MongoDB's schema-less design allows easy future extensions

### Autocomplete Implementation

Currently uses rule-based mocked suggestions:

-   Python: Suggests common patterns like `return`, `if __name__ == "__main__":`
-   JavaScript: Suggests `console.log()`, `function`, `const`
-   Response time under 500ms

**Design Rationale:**

-   **No External Dependencies**: Works without AI service integration
-   **Predictable**: Consistent suggestions for testing
-   **Extensible**: Easy to replace with real AI model later

## WebSocket Message Flow

### Connection Flow

```
1. Client connects to WS /ws/{room_id}
   ↓
2. Server validates room exists in database
   ↓
3. Server retrieves current code state
   ↓
4. Server sends initial_state message to client
   ↓
5. Server adds connection to WebSocketManager
   ↓
6. Connection established - ready for real-time updates
```

### Code Update Flow

```
1. User types in editor
   ↓
2. Client sends code_update message via WebSocket
   {
     "type": "code_update",
     "code": "updated code content",
     "timestamp": 1638360000000
   }
   ↓
3. Server receives message
   ↓
4. Server updates database with new code
   ↓
5. Server broadcasts to all OTHER clients in room
   (excludes sender to avoid echo)
   ↓
6. Other clients receive update and refresh editor
```

### Disconnection Flow

```
1. Client closes connection or network drops
   ↓
2. Server detects disconnection
   ↓
3. Server removes connection from WebSocketManager
   ↓
4. If room has no more connections, cleanup room entry
   ↓
5. Connection closed
```

### Error Handling

-   **Room Not Found**: Close connection with code 4004
-   **Invalid Message**: Send error message, keep connection open
-   **Database Error**: Log error, send error message to client

## Testing

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_room_service.py
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

## Current Limitations

The current implementation has some limitations that would be addressed with more development time:

### 1. In-Memory WebSocket Connections

**Limitation**: WebSocket connections are stored in memory on a single server instance.

**Impact**:

-   Cannot scale horizontally with load balancers
-   All connections lost on server restart
-   Limited to single-server deployments

**Why It Matters**: Production applications need to handle server failures and scale with user growth.

### 2. No Conflict Resolution

**Limitation**: Uses simple last-write-wins strategy without operational transformation.

**Impact**:

-   Simultaneous edits can overwrite each other
-   No merge capabilities for concurrent changes
-   Users may lose work if editing same section

**Why It Matters**: Real collaborative editors need sophisticated conflict resolution for smooth UX.

### 3. No User Presence Indicators

**Limitation**: Users cannot see who else is in the room or where they're editing.

**Impact**:

-   No awareness of collaborators
-   Cannot see cursor positions or selections
-   Difficult to coordinate who edits what

**Why It Matters**: Presence awareness is crucial for effective collaboration.

### 4. No Authentication or Authorization

**Limitation**: Anyone with a room ID can join and edit.

**Impact**:

-   No access control or permissions
-   Cannot identify users or track contributions
-   Security risk for sensitive code

**Why It Matters**: Production apps need user management and access control.

### 5. No Room Cleanup or Expiration

**Limitation**: Rooms persist indefinitely in the database.

**Impact**:

-   Database grows without bounds
-   Stale rooms consume storage
-   No automatic cleanup of inactive sessions

**Why It Matters**: Resource management is essential for long-running services.

### 6. No Code History or Versioning

**Limitation**: Only current code state is stored, no history or undo.

**Impact**:

-   Cannot revert to previous versions
-   No audit trail of changes
-   Lost work cannot be recovered

**Why It Matters**: Version control is fundamental for code collaboration.

## Improvements with More Time

If this were a production application, here are the key improvements to implement:

### 1. Redis for Distributed WebSocket Management

**Implementation**:

-   Use Redis pub/sub for message broadcasting across servers
-   Store active connections metadata in Redis
-   Enable horizontal scaling with multiple backend instances

**Benefits**:

-   Scale to thousands of concurrent users
-   Survive individual server failures
-   Deploy behind load balancers

**Estimated Effort**: 2-3 days

### 2. JWT-Based Authentication

**Implementation**:

-   Add user registration and login endpoints
-   Issue JWT tokens for authenticated sessions
-   Validate tokens on WebSocket connections
-   Add user_id to room participants

**Benefits**:

-   Secure access control
-   Track user contributions
-   Enable user-specific features

**Estimated Effort**: 3-4 days

### 3. Operational Transformation or CRDT

**Implementation**:

-   Implement OT algorithm (e.g., similar to Google Docs)
-   Or use CRDT library (e.g., Yjs, Automerge)
-   Handle concurrent edits gracefully
-   Maintain consistency across clients

**Benefits**:

-   No lost edits from simultaneous changes
-   Smooth collaborative experience
-   Support for many concurrent users

**Estimated Effort**: 1-2 weeks

### 4. User Presence and Cursor Sharing

**Implementation**:

-   Broadcast user join/leave events
-   Send cursor position updates (throttled)
-   Display collaborator cursors in editor
-   Show active user list

**Benefits**:

-   Awareness of who's editing
-   Avoid editing conflicts
-   Better collaboration coordination

**Estimated Effort**: 2-3 days

### 5. Room Management Features

**Implementation**:

-   Add room expiration (e.g., 24 hours of inactivity)
-   Background task to clean up expired rooms
-   Room settings (private/public, max users)
-   Room ownership and permissions

**Benefits**:

-   Controlled resource usage
-   Better security and privacy
-   Organized collaboration spaces

**Estimated Effort**: 3-4 days

### 6. Code History and Versioning

**Implementation**:

-   Store code snapshots at intervals
-   Add version table with timestamps
-   Implement undo/redo functionality
-   Show diff between versions

**Benefits**:

-   Recover from mistakes
-   Audit trail of changes
-   Time-travel debugging

**Estimated Effort**: 4-5 days

### 7. Enhanced Autocomplete

**Implementation**:

-   Integrate with real AI model (OpenAI, Anthropic)
-   Context-aware suggestions based on full code
-   Language-specific intelligence
-   Caching for performance

**Benefits**:

-   Genuinely helpful suggestions
-   Faster coding workflow
-   Better developer experience

**Estimated Effort**: 1 week

### 8. Monitoring and Observability

**Implementation**:

-   Add Prometheus metrics (connections, messages, latency)
-   Structured logging with correlation IDs
-   Error tracking (Sentry, Rollbar)
-   Health check endpoints

**Benefits**:

-   Detect issues proactively
-   Debug production problems
-   Understand usage patterns

**Estimated Effort**: 2-3 days

## Troubleshooting

### Database Connection Issues

If you see `connection refused` errors:

-   Ensure MongoDB is running: `docker-compose ps` or check local service
-   Verify MONGODB_URL in `.env` matches your setup
-   Check MongoDB logs: `docker-compose logs mongodb`
-   Test connection: `mongosh` (MongoDB Shell)

### Port Already in Use

If port 8000 is already in use:

```bash
# Find process using port 8000
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000

# Kill the process or use a different port
uvicorn main:app --port 8001
```

### Import Errors

If you see module import errors:

-   Ensure virtual environment is activated
-   Reinstall dependencies: `pip install -r requirements.txt`
-   Check Python version: `python --version` (should be 3.11+)

## Development

### Adding New Endpoints

1. Create router in `app/routers/`
2. Implement business logic in `app/services/`
3. Define schemas in `app/schemas/`
4. Register router in `main.py`
5. Add tests in `tests/`

### Database Schema Changes

MongoDB is schema-less, so no migrations are needed for most changes. However, for index management or data transformations:

```bash
# Connect to MongoDB shell
mongosh

# Use the database
use pairprog

# Create or modify indexes
db.rooms.createIndex({ "room_id": 1 }, { unique: true })

# For complex data transformations, write migration scripts
python scripts/migrate_data.py
```

## License

This project is for demonstration purposes.
