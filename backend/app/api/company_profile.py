"""
Company profile endpoints (single row, id = 1).

  GET /company-profile  -> any logged-in user
  PUT /company-profile  -> Admin only

Uses raw SQL via SQLAlchemy `text()` so it doesn't depend on your ORM models.
Adjust the two imports marked TODO to match your project.
"""
import base64
import binascii
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.auth import get_current_user  # TODO: your dependency that returns the decoded JWT / user
from app.core.database import get_db        # TODO: your dependency that yields a SQLAlchemy Session

router = APIRouter(prefix="/company-profile", tags=["company-profile"])

MAX_IMAGE_BYTES = 300 * 1024
MAX_NAME_LEN = 150
MAX_ADDRESS_LEN = 1000
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[0-9\s\-()]{7,25}$")
DATA_URL_RE = re.compile(r"^data:image/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$")

SELECT_SQL = text(
    "SELECT name, address, email, phone, logo, signature, updated_at "
    "FROM company_profile WHERE id = 1"
)
    
def require_admin(user=Depends(get_current_user)):
    if user.role_id != 1:
        raise HTTPException(status_code=403, detail="Only admins can update the company profile.")
    return user

# ---------- schema ----------
class CompanyProfileIn(BaseModel):
    # Everything optional here so we can return friendly, all-at-once error messages below.
    name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    logo: Optional[str] = None       # omitted = keep, "" = remove, data URL = replace
    signature: Optional[str] = None  # same as logo


# ---------- helpers ----------
def _detect_mime(raw: bytes) -> Optional[str]:
    if raw.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if raw.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
        return "image/webp"
    return None


def _check_image(value: str, label: str):
    """Returns (normalized_data_url, error_message)."""
    m = DATA_URL_RE.match(value.strip())
    if not m:
        return None, f"{label} must be a PNG, JPG or WEBP image sent as a base64 data URL."
    declared, b64 = m.group(1), re.sub(r"\s+", "", m.group(2))
    if len(b64) > (MAX_IMAGE_BYTES * 4) // 3 + 8:
        return None, f"{label} is too large. Maximum size is {MAX_IMAGE_BYTES // 1024} KB."
    try:
        raw = base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError):
        return None, f"{label} is not valid base64 data."
    if len(raw) > MAX_IMAGE_BYTES:
        return None, f"{label} is too large. Maximum size is {MAX_IMAGE_BYTES // 1024} KB."
    detected = _detect_mime(raw)
    if detected is None:
        return None, f"{label} must be a real PNG, JPG or WEBP image."
    if detected != ("image/jpeg" if declared == "jpg" else f"image/{declared}"):
        return None, f"{label} content does not match its declared image type."
    return f"data:{detected};base64,{b64}", None


def _serialize(row) -> dict:
    return {
        "name": row["name"] or "",
        "address": row["address"] or "",
        "email": row["email"] or "",
        "phone": row["phone"] or "",
        "logo": row["logo"] or "",
        "signature": row["signature"] or "",
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }


def _load_row(db: Session):
    row = db.execute(SELECT_SQL).mappings().first()
    if row is None:  # self-heal if the row was deleted
        db.execute(text(
            "IF NOT EXISTS (SELECT 1 FROM company_profile WHERE id = 1) "
            "INSERT INTO company_profile (id, name, address, email, phone) "
            "VALUES (1, '', '', '', '')"
        ))
        db.commit()
        row = db.execute(SELECT_SQL).mappings().first()
    return row


# ---------- endpoints ----------
@router.get("")
def get_company_profile(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    return _serialize(_load_row(db))


@router.put("")
def update_company_profile(
    payload: CompanyProfileIn,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    errors = {}

    name = (payload.name or "").strip()
    if not name:
        errors["name"] = "Company name is required."
    elif len(name) > MAX_NAME_LEN:
        errors["name"] = f"Company name must be at most {MAX_NAME_LEN} characters."

    address = (payload.address or "").strip()
    if not address:
        errors["address"] = "Address is required."
    elif len(address) > MAX_ADDRESS_LEN:
        errors["address"] = f"Address must be at most {MAX_ADDRESS_LEN} characters."

    email = (payload.email or "").strip()
    if email and (len(email) > 254 or not EMAIL_RE.match(email)):
        errors["email"] = "Enter a valid email address."

    phone = (payload.phone or "").strip()
    if not phone:
        errors["phone"] = "Phone number is required."
    elif not PHONE_RE.match(phone) or sum(c.isdigit() for c in phone) < 7:
        errors["phone"] = "Enter a valid phone number (digits, spaces, +, -, parentheses; at least 7 digits)."

    params = {"name": name, "address": address, "email": email, "phone": phone}
    sets = ["name = :name", "address = :address", "email = :email", "phone = :phone",
            "updated_at = SYSUTCDATETIME()"]  # SQL Server has no ON UPDATE for timestamps

    for field, label in (("logo", "Logo"), ("signature", "Signature")):
        if field not in payload.model_fields_set:
            continue  # not sent -> leave unchanged
        value = getattr(payload, field)
        if not value or not value.strip():
            params[field] = None  # empty string / null -> remove
        else:
            clean, err = _check_image(value, label)
            if err:
                errors[field] = err
            else:
                params[field] = clean
        sets.append(f"{field} = :{field}")  # field names are fixed above, not user input

    if errors:
        raise HTTPException(status_code=422, detail={"message": "Validation failed.", "errors": errors})

    db.execute(text(f"UPDATE company_profile SET {', '.join(sets)} WHERE id = 1"), params)
    db.commit()
    return _serialize(_load_row(db))
