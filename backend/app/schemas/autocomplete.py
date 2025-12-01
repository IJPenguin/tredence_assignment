from pydantic import BaseModel, Field


class AutocompleteRequest(BaseModel):
    """Schema for autocomplete request with field validation"""

    code: str = Field(..., description="The code content")
    cursorPosition: int = Field(
        ..., ge=0, description="Cursor position in the code (must be non-negative)"
    )
    language: str = Field(
        ..., description="Programming language (e.g., 'python', 'javascript')"
    )


class AutocompleteResponse(BaseModel):
    """Schema for autocomplete response"""

    suggestion: str = Field(..., description="The autocomplete suggestion")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score between 0 and 1"
    )
