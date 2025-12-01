"""
Autocomplete service layer for generating code suggestions.
"""

from typing import Tuple


def generate_suggestion(
    code: str, cursor_position: int, language: str
) -> Tuple[str, float]:
    """
    Generate a mocked autocomplete suggestion based on code context and language.

    Args:
        code: The current code content
        cursor_position: The cursor position in the code
        language: The programming language (e.g., 'python', 'javascript')

    Returns:
        Tuple[str, float]: A tuple containing (suggestion, confidence_score)
    """
    # Normalize language to lowercase
    lang = language.lower()

    # Get the code before cursor
    code_before_cursor = (
        code[:cursor_position] if cursor_position <= len(code) else code
    )

    # Get the last line before cursor
    lines = code_before_cursor.split("\n")
    current_line = lines[-1] if lines else ""

    # Check if we should show AI mock suggestion
    # Show AI suggestion when user types and there's content
    if len(current_line.strip()) > 0 and not current_line.strip().startswith("//"):
        # Return AI-style mock suggestion
        return _generate_ai_mock_suggestion(lang, current_line)

    # Python-specific suggestions
    if lang == "python":
        return _generate_python_suggestion(code_before_cursor, current_line)

    # JavaScript-specific suggestions
    elif lang in ["javascript", "js"]:
        return _generate_javascript_suggestion(code_before_cursor, current_line)

    # Default generic suggestions
    else:
        return _generate_generic_suggestion(current_line)


def _generate_ai_mock_suggestion(language: str, current_line: str) -> Tuple[str, float]:
    """Generate AI-style mock suggestions with phantom text."""

    # Determine comment syntax based on language
    if language == "python":
        comment = "# AI generated code here"
    elif language in ["javascript", "js", "typescript", "ts"]:
        comment = "// AI generated code here"
    elif language in ["html", "xml"]:
        comment = "<!-- AI generated code here -->"
    elif language in ["css", "scss", "less"]:
        comment = "/* AI generated code here */"
    else:
        comment = "// AI generated code here"

    # Return the AI suggestion with high confidence (no leading newline for inline display)
    return comment, 0.85


def _generate_python_suggestion(
    code_before_cursor: str, current_line: str
) -> Tuple[str, float]:
    """Generate Python-specific suggestions."""

    # Check for return statement with trailing space
    if (
        current_line.rstrip().endswith("return")
        and current_line != current_line.rstrip()
    ):
        # Has trailing space after return
        return "True", 0.80

    # Check for return statement without trailing space
    if current_line.strip().endswith("return"):
        return " None", 0.85

    # Check for if __name__ pattern
    if "if __name__" in current_line:
        return ' == "__main__":', 0.95

    # Check for function definition
    if current_line.strip().startswith("def ") and current_line.strip().endswith("):"):
        return "\n    pass", 0.90

    # Check for class definition
    if current_line.strip().startswith("class ") and current_line.strip().endswith(":"):
        return "\n    pass", 0.90

    # Check for import statement
    if current_line.strip() == "import":
        return " os", 0.75

    if current_line.strip() == "from":
        return " typing import", 0.75

    # Check for print statement
    if current_line.strip().endswith("print("):
        return '"Hello, World!")', 0.70

    # Check for common patterns (don't strip to preserve trailing spaces)
    if current_line.rstrip().endswith("for"):
        return " i in range(", 0.80

    if current_line.rstrip().endswith("if"):
        return " True:", 0.75

    # Default Python suggestion
    return "pass", 0.60


def _generate_javascript_suggestion(
    code_before_cursor: str, current_line: str
) -> Tuple[str, float]:
    """Generate JavaScript-specific suggestions."""

    # Check for console.log
    if current_line.strip().endswith("console."):
        return "log()", 0.95

    if current_line.strip().endswith("console.log("):
        return '"Hello, World!")', 0.85

    # Check for function declaration
    if current_line.strip().startswith("function ") and current_line.strip().endswith(
        ")"
    ):
        return " {\n    \n}", 0.90

    # Check for arrow function
    if current_line.strip().endswith("=>"):
        return " {\n    \n}", 0.90

    # Check for variable declaration
    if current_line.strip() == "const":
        return " value = ", 0.80

    if current_line.strip() == "let":
        return " value = ", 0.80

    if current_line.strip() == "var":
        return " value = ", 0.75

    # Check for return statement
    if current_line.strip().endswith("return"):
        return " null;", 0.80

    if current_line.strip().endswith("return "):
        return "true;", 0.75

    # Check for if statement
    if current_line.strip().endswith("if ("):
        return "true) {\n    \n}", 0.80

    # Check for for loop
    if current_line.strip().endswith("for ("):
        return "let i = 0; i < 10; i++) {\n    \n}", 0.85

    # Default JavaScript suggestion
    return ";", 0.60


def _generate_generic_suggestion(current_line: str) -> Tuple[str, float]:
    """Generate generic suggestions for unknown languages."""

    # Very basic suggestions
    if current_line.strip() == "":
        return "// TODO: ", 0.50

    if current_line.strip().endswith("="):
        return " ", 0.40

    return "", 0.30
