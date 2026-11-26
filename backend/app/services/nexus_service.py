import os

import httpx
from dotenv import load_dotenv

load_dotenv()

NEXUS_BASE_URL = os.getenv(
    "NEXUS_BASE_URL",
    "https://saitallyexpert.in/nexus/api/integrations/v1",
).rstrip("/")
NEXUS_CLIENT_ID = os.getenv("NEXUS_CLIENT_ID", "")
NEXUS_CLIENT_SECRET = os.getenv("NEXUS_CLIENT_SECRET", "")
NEXUS_PROJECT_CODE = os.getenv("NEXUS_PROJECT_CODE", "MOTHYS")

TIMEOUT_SECONDS = 15


class NexusError(Exception):
    """Raised when Nexus rejects a request or cannot be reached."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 502,
        fields: dict | None = None,
        request_id: str | None = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.fields = fields
        self.request_id = request_id


def _post(path: str, payload: dict) -> dict:
    if not NEXUS_CLIENT_ID or not NEXUS_CLIENT_SECRET:
        raise NexusError(
            "NEXUS_NOT_CONFIGURED",
            "Nexus credentials are not configured on the server.",
            500,
        )

    headers = {
        "Content-Type": "application/json",
        "X-Client-Id": NEXUS_CLIENT_ID,
        "X-Client-Secret": NEXUS_CLIENT_SECRET,
    }

    try:
        response = httpx.post(
            f"{NEXUS_BASE_URL}{path}",
            json=payload,
            headers=headers,
            timeout=TIMEOUT_SECONDS,
        )
    except httpx.HTTPError:
        raise NexusError(
            "NEXUS_UNREACHABLE",
            "Could not reach the Nexus server. Please try again.",
            503,
        )

    try:
        body = response.json()
    except ValueError:
        body = {}

    if response.status_code >= 400 or not body.get("ok"):
        error = body.get("error") or {}
        raise NexusError(
            error.get("code", "NEXUS_ERROR"),
            error.get("message", "Nexus returned an error."),
            response.status_code,
            error.get("fields"),
            body.get("request_id"),
        )

    return body.get("data") or {}


def register_customer(
    *,
    external_customer_id: str,
    customer_name: str,
    email: str,
    contact_number: str,
) -> dict:
    """
    POST /customers/register  (HTTP 201 on success)
    Returns: status, customer_id, license_id, serial_number, user_id,
             license_type, license_state, expires_at, welcome_email
    Nexus generates the User ID and password and emails them to the customer.
    """
    return _post(
        "/customers/register",
        {
            "project_code": NEXUS_PROJECT_CODE,
            "external_customer_id": external_customer_id,
            "customer_name": customer_name,
            "email": email,
            "contact_number": contact_number,
        },
    )


def verify_login(*, user_id: str, password: str, device_id: str) -> dict:
    """
    POST /auth/verify
    Returns: verified, device_authorized, session_id, customer_id,
             external_customer_id, user_id, name, email,
             must_change_password, license{...}, active_devices
    """
    return _post(
        "/auth/verify",
        {
            "project_code": NEXUS_PROJECT_CODE,
            "user_id": user_id,
            "password": password,
            "device_id": device_id,
        },
    )
def validate_license(*, user_id: str) -> dict:
    """
    POST /licenses/validate
    Returns current Nexus license and subscription information.
    """
    return _post(
        "/licenses/validate",
        {
            "project_code": NEXUS_PROJECT_CODE,
            "user_id": user_id,
        },
    )
