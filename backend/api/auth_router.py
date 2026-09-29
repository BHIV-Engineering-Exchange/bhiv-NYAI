import os
import jwt
import hashlib
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Authentication"])

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "nyai_sovereign_jwt_secret_key_2026")
JWT_ALGORITHM = "HS256"
USERS_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "users_db.json"

def _load_users():
    if not USERS_DB_PATH.exists():
        USERS_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        default_users = {
            "lawyer@nyai.bhiv": {
                "id": "usr_lawyer_01",
                "name": "Senior Legal Counsel",
                "email": "lawyer@nyai.bhiv",
                "password_hash": hashlib.sha256("NyaiLawyer2026!".encode()).hexdigest(),
                "role": "lawyer",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        }
        with open(USERS_DB_PATH, "w") as f:
            json.dump(default_users, f, indent=2)
        return default_users
    try:
        with open(USERS_DB_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_users(users: dict):
    USERS_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(USERS_DB_PATH, "w") as f:
        json.dump(users, f, indent=2)

def _hash_password(password: str) -> str:
    return hashlib.sha256(f"nyai_salt_{password}".encode()).hexdigest()

def _create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "researcher"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def signup(req: SignupRequest):
    users = _load_users()
    email_clean = req.email.lower().strip()
    if email_clean in users:
        raise HTTPException(status_code=400, detail="User email is already registered")

    user_id = f"usr_{hashlib.md5(email_clean.encode()).hexdigest()[:8]}"
    pwd_hash = _hash_password(req.password)
    user_entry = {
        "id": user_id,
        "name": req.name.strip(),
        "email": email_clean,
        "password_hash": pwd_hash,
        "role": req.role or "researcher",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    users[email_clean] = user_entry
    _save_users(users)

    token = _create_access_token({"sub": user_id, "email": email_clean, "name": req.name, "role": user_entry["role"]})
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "name": req.name, "email": email_clean, "role": user_entry["role"]}
    }

@router.post("/login")
async def login(req: LoginRequest):
    users = _load_users()
    email_clean = req.email.lower().strip()
    user = users.get(email_clean)
    if not user or user.get("password_hash") != _hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password credential")

    token = _create_access_token({"sub": user["id"], "email": email_clean, "name": user["name"], "role": user.get("role", "user")})
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "name": user["name"], "email": email_clean, "role": user.get("role", "user")}
    }

@router.get("/me")
async def get_me(user_claims: dict = Depends(verify_token)):
    return {"status": "success", "user": user_claims}