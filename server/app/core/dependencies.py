"""
GOHIP Platform - Authentication Dependencies
=============================================

Phase 26: FastAPI dependencies for authentication

Provides:
- OAuth2 password flow
- Current user dependency
- Admin-only dependency
"""

from typing import Optional
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole

# OAuth2 scheme with token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from the JWT token.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        User object if valid token
        
    Raises:
        HTTPException 401 if not authenticated
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if token is None:
        raise credentials_exception
    
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.
    
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if token is None:
        return None
    
    email = verify_token(token)
    if email is None:
        return None
    
    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        return None
    
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current user and verify they have admin role.
    
    Args:
        current_user: The authenticated user
        
    Returns:
        User object if admin
        
    Raises:
        HTTPException 403 if not admin
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def update_last_login(user: User, db: Session) -> None:
    """
    Update the user's last login timestamp.
    
    Args:
        user: User object to update
        db: Database session
    """
    user.last_login = datetime.utcnow()
    db.commit()
