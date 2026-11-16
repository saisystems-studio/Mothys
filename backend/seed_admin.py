from pwdlib import PasswordHash

from app.core.database import get_db
from app.models.role import Role
from app.models.users import User

USERNAME = "admin"
PASSWORD = "Admin@123"      # change if you like

db = next(get_db())
hasher = PasswordHash.recommended()   # same hasher used in users.py

# Make sure both roles exist
roles = {}
for name in ("Admin", "User"):
    role = db.query(Role).filter(Role.role_name == name).first()
    if not role:
        role = Role(role_name=name)
        db.add(role)
        db.flush()
    roles[name] = role

if db.query(User).filter(User.username == USERNAME).first():
    print("Admin already exists")
else:
    db.add(User(
        username=USERNAME,
        name="Administrator",
        password_hash=hasher.hash(PASSWORD),
        auth_provider="LOCAL",
        role_id=roles["Admin"].id,
    ))
    print(f"Created {USERNAME} / {PASSWORD}")

db.commit()