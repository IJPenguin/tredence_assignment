# Routers package
from .rooms import router as rooms_router
from .autocomplete import router as autocomplete_router
from .websocket import router as websocket_router

__all__ = ["rooms_router", "autocomplete_router", "websocket_router"]
