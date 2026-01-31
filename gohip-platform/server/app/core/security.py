"""
GOHIP Platform - Security Utilities
====================================

Phase 26: Authentication & Security

Provides:
- Password hashing and verification
- JWT token creation and validation
- API key encryption/decryption
"""

from datetime import datetime, timedelta
from typing import Optional, Any
import secrets
import base64

from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings


# ============================================================================
# PASSWORD HASHING
# ============================================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to check against
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password string
    """
    return pwd_context.hash(password)


# ============================================================================
# JWT TOKEN HANDLING
# ============================================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary of claims to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: The JWT token string to decode
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> Optional[str]:
    """
    Verify a JWT token and extract the subject (user email).
    
    Args:
        token: The JWT token string to verify
        
    Returns:
        The user email (subject) if valid, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None
    
    email: str = payload.get("sub")
    if email is None:
        return None
    
    return email


# ============================================================================
# API KEY ENCRYPTION
# ============================================================================

def _get_encryption_key() -> bytes:
    """
    Derive an encryption key from the secret key.
    
    Returns:
        32-byte encryption key for Fernet
    """
    # Use PBKDF2 to derive a proper encryption key from SECRET_KEY
    salt = b"gohip_ai_key_salt_v1"  # Static salt (could be made configurable)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    return key


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key for secure storage.
    
    Args:
        api_key: The plain text API key to encrypt
        
    Returns:
        Encrypted API key string (base64 encoded)
    """
    key = _get_encryption_key()
    f = Fernet(key)
    encrypted = f.encrypt(api_key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted_key: str) -> Optional[str]:
    """
    Decrypt an encrypted API key.
    
    Args:
        encrypted_key: The encrypted API key string
        
    Returns:
        Decrypted API key or None if decryption fails
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not encrypted_key:
        logger.warning("[Security] No encrypted key provided for decryption")
        return None
    
    try:
        key = _get_encryption_key()
        f = Fernet(key)
        decrypted = f.decrypt(encrypted_key.encode())
        result = decrypted.decode()
        # Log success but mask the actual key
        logger.info(f"[Security] API key decrypted successfully (key starts with: {result[:8]}...)")
        return result
    except Exception as e:
        logger.error(f"[Security] Failed to decrypt API key: {type(e).__name__}: {e}")
        return None


def generate_random_key(length: int = 32) -> str:
    """
    Generate a cryptographically secure random key.
    
    Args:
        length: Length of the key in bytes
        
    Returns:
        Hex-encoded random key string
    """
    return secrets.token_hex(length)
