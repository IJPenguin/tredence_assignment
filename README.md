# Real-Time Pair Programming Application

## Live Deployment Link -

Here is the live deployment link.

```
https://tredence-assignment-fa7x.vercel.app
```

This is a collaborative code editing platform where multiple people can write code together in real-time.

## What Can It Do?

-   Create a room with a unique ID and share it
-   See each other's code changes in real-time
-   Multiple people can join the same room
-   Get mocked autocomplete suggestions as you type
-   Everything is saved to a PostgreSQL database

## How to Run

### What You'll Need

-   Python 3.13 or higher
-   Node.js 16+ and npm
-   A PostgreSQL database

### Getting the Backend Running

Open your terminal:

1. **Navigate to backend folder:**

    ```bash
    cd backend
    ```

2. **Install python packages:**

    ```bash
    pip install -r requirements.txt
    ```

3. **Set up your environment variables:**

    ```bash
    cp .env.example .env
    ```

    Now open `.env` and update your database connection string:

    ```env
    DATABASE_URL=postgresql+asyncpg://username:password@host:port/database?ssl=require
    ```

4. **Start the server:**

    ```bash
    uvicorn main:app --reload
    ```

    The backend will start at `http://127.0.0.1:8000`. The first time it runs, it'll automatically create all the database tables.

### Getting the Frontend Running

In a new terminal:

1. **Head to the frontend folder:**

    ```bash
    cd frontend
    ```

2. **Install Node packages:**

    ```bash
    npm install
    ```

3. **(Optional) Configure the backend URL:**

    ```bash
    cp .env.example .env
    ```

    Only needed if your backend isn't running on the default `http://localhost:8000`

4. **Start the dev server:**

    ```bash
    npm run dev
    ```

    Open your browser and go to `http://localhost:5173`

## Architecture & Design Choices

### Backend (FastAPI + PostgreSQL)

**Why FastAPI?** It's fast, has built-in async support (crucial for WebSockets), and auto-generates API docs. Perfect for real-time apps.

**The Stack:**

-   **FastAPI** - Modern Python web framework with async support
-   **SQLAlchemy (async)** - ORM for database operations
-   **asyncpg** - High-performance async PostgreSQL driver
-   **WebSockets** - For real-time bidirectional communication
-   **Pydantic** - Data validation and serialization

**Project Structure:**

```
backend/
├── app/
│   ├── routers/          # API endpoints (REST + WebSocket)
│   ├── services/         # Business logic layer
│   ├── models/           # Database models (SQLAlchemy)
│   ├── schemas/          # Request/response schemas (Pydantic)
│   └── database.py       # DB connection and session management
└── main.py               # App entry point
```

**Key Design Decisions:**

-   **Separation of concerns**: Routers handle HTTP, services handle business logic, models handle data
-   **Async all the way**: Using async/await throughout for better performance under load
-   **WebSocket manager**: Centralized connection management to broadcast changes to all room participants
-   **Room-based isolation**: Each coding session is isolated by a unique room ID
-   **Auto-reconnect**: Frontend automatically reconnects if WebSocket drops

**How It Works:**

1. User creates or joins a room
2. Frontend establishes WebSocket connection to backend
3. Code changes are sent through WebSocket to server
4. Server broadcasts changes to all connected clients in the same room
5. Each client updates their editor with the changes
6. Autocomplete suggestions are fetched via REST API

## What I'd Improve With More Time

If I had another week, here's what I'd add:

### High Priority

-   **User authentication**: Right now anyone can join any room. Would add login/auth.
-   **Cursor positions**: Show where other users are typing (like Google Docs cursors)
-   **Better autocomplete**: The current one is basic. Would integrate with a proper AI model or language server.
-   **Syntax highlighting**: Monaco Editor supports it, just needs proper language detection.
-   **Code execution**: Let users run their code and see output directly in the app.
-   **Operational transforms**: More sophisticated conflict resolution for simultaneous edits
-   **Database connection pooling**: Better connection management for high load

## Known Limitations

1. **Concurrent editing conflicts**: If two people edit the same line simultaneously, last write wins. No fancy operational transforms yet.

2. **Scalability**: WebSocket connections are stored in-memory. Can't scale horizontally without Redis or similar.

3. **No persistence of WebSocket state**: If the server restarts, all active connections are dropped.

4. **Limited autocomplete**: It's rule-based, not AI-powered. Just looks for common patterns.

5. **No code execution**: You can write code but not run it.

6. **Room lifecycle**: Rooms don't expire or get cleaned up automatically.

7. **No mobile support**: The editor experience isn't great on mobile devices.

8. **Database tables reset on startup**: Currently drops and recreates tables each time (for development).
