import re


# ── Validators ─────────────────────────────────────────────────────────────────

def validate_email(email: str) -> bool:
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
    return bool(re.match(pattern, email))


def validate_password(password: str) -> bool:
    """Minimum 6 characters (Firebase minimum)."""
    return isinstance(password, str) and len(password) >= 6


def validate_completion(value) -> bool:
    return isinstance(value, (int, float)) and 0 <= value <= 100


# ── Route-specific validators ───────────────────────────────────────────────────

def validate_register(data: dict) -> str | None:
    """Returns an error message string, or None if valid."""
    required = ["name", "email", "password", "disabilityType"]
    for field in required:
        if not data.get(field):
            return f"'{field}' is required"

    if not validate_email(data["email"]):
        return "Invalid email format"

    if not validate_password(data["password"]):
        return "Password must be at least 6 characters"

    if len(data["name"].strip()) < 2:
        return "Name must be at least 2 characters"

    return None


def validate_login(data: dict) -> str | None:
    if not data.get("idToken"):
        return "'idToken' is required"
    return None


def validate_course(data: dict) -> str | None:
    required = ["title", "description", "video", "audio", "category"]
    for field in required:
        if not data.get(field):
            return f"'{field}' is required"

    if len(data["title"].strip()) < 3:
        return "Title must be at least 3 characters"

    allowed_categories = {"programming", "math", "science", "language", "other"}
    if data["category"].strip().lower() not in allowed_categories:
        return f"'category' must be one of: {', '.join(sorted(allowed_categories))}"

    return None


def validate_progress(data: dict) -> str | None:
    required = ["userId", "courseId", "completion"]
    for field in required:
        if data.get(field) is None:
            return f"'{field}' is required"

    if not isinstance(data["userId"], str) or not data["userId"].strip():
        return "'userId' must be a non-empty string"

    if not isinstance(data["courseId"], str) or not data["courseId"].strip():
        return "'courseId' must be a non-empty string"

    if not validate_completion(data["completion"]):
        return "'completion' must be a number between 0 and 100"

    return None


def validate_user_update(data: dict) -> str | None:
    allowed = {"name", "disabilityType"}
    updates = {k: v for k, v in data.items() if k in allowed}

    if not updates:
        return f"No valid fields provided. Allowed: {allowed}"

    if "name" in updates and len(str(updates["name"]).strip()) < 2:
        return "Name must be at least 2 characters"

    return None