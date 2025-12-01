"""
Autocomplete router for handling AI-style code suggestion endpoints.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError

from app.schemas import AutocompleteRequest, AutocompleteResponse
from app.services import autocomplete_service

router = APIRouter(prefix="/autocomplete", tags=["autocomplete"])


@router.post("", response_model=AutocompleteResponse, status_code=status.HTTP_200_OK)
def get_autocomplete_suggestion(request: AutocompleteRequest):
    """
    Generate an autocomplete suggestion based on code context.

    Args:
        request: AutocompleteRequest containing code, cursor position, and language

    Returns:
        AutocompleteResponse: Contains suggestion and confidence score

    Raises:
        HTTPException: 400 if request payload is invalid
        HTTPException: 500 if suggestion generation fails
    """
    try:
        suggestion, confidence = autocomplete_service.generate_suggestion(
            code=request.code,
            cursor_position=request.cursorPosition,
            language=request.language,
        )

        return AutocompleteResponse(suggestion=suggestion, confidence=confidence)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request payload: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate suggestion: {str(e)}",
        )
