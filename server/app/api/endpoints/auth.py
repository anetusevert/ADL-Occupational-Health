"""
GOHIP Platform - Authentication API Endpoints
==============================================

Phase 26: User authentication and management

Endpoints:
- POST /auth/login - Authenticate and get token
- GET /auth/me - Get current user info
- POST /auth/users - Create user (admin only)
- GET /auth/users - List users (admin only)
- DELETE /auth/users/{id} - Delete user (admin only)
- PUT /auth/users/{id} - Update user (admin only)
"""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from app.core.dependencies import (
    get_current_user,
    get_current_admin_user,
    update_last_login,
)
from app.models.user import User, UserRole

# Create router
router = APIRouter(prefix="/auth", tags=["Authentication"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenData(BaseModel):
    """Token payload data."""
    email: Optional[str] = None


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    role: UserRole = UserRole.user


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """User response schema (without password)."""
    id: int
    email: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class UsersListResponse(BaseModel):
    """Response for listing users."""
    total: int
    users: List[UserResponse]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password.
    
    Args:
        db: Database session
        email: User's email
        password: Plain text password
        
    Returns:
        User object if authentication successful, None otherwise
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def ensure_admin_exists(db: Session) -> None:
    """
    Ensure the default admin user exists in the database.
    Creates it if it doesn't exist.
    """
    from datetime import datetime
    try:
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                full_name="Admin User",
                role=UserRole.admin,
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
            )
            db.add(admin)
            db.commit()
            print(f"Created admin user: {settings.ADMIN_EMAIL}")
    except Exception as e:
        print(f"Error ensuring admin exists: {e}")
        db.rollback()
        raise


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/login",
    response_model=Token,
    summary="Login and get access token",
    description="Authenticate with email and password to receive a JWT access token."
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Token:
    """
    OAuth2 compatible login endpoint.
    
    Uses OAuth2PasswordRequestForm which expects form data with 'username' and 'password'.
    The 'username' field is used for the email.
    """
    # Ensure admin exists on first login attempt
    ensure_admin_exists(db)
    
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    # Update last login
    update_last_login(user, db)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post(
    "/login/json",
    response_model=Token,
    summary="Login with JSON body",
    description="Alternative login endpoint that accepts JSON body instead of form data."
)
async def login_json(
    request: LoginRequest,
    db: Session = Depends(get_db)
) -> Token:
    """
    JSON-based login endpoint for frontend convenience.
    """
    import traceback
    try:
        # Ensure admin exists
        ensure_admin_exists(db)
        
        user = authenticate_user(db, request.email, request.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated"
            )
        
        # Update last login
        update_last_login(user, db)
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role.value},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        traceback.print_exc()
        raise


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's information."
)
async def get_me(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get current user information.
    """
    return UserResponse.model_validate(current_user)


# =============================================================================
# ADMIN-ONLY ENDPOINTS
# =============================================================================

@router.get(
    "/users",
    response_model=UsersListResponse,
    summary="List all users (Admin only)",
    description="Get a list of all users. Requires admin access."
)
async def list_users(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> UsersListResponse:
    """
    List all users in the system.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return UsersListResponse(
        total=len(users),
        users=[UserResponse.model_validate(u) for u in users]
    )


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new user (Admin only)",
    description="Create a new user account. Requires admin access."
)
async def create_user(
    user_data: UserCreate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Create a new user account.
    """
    # Check if email already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=True,
        is_verified=True,  # Admin-created users are auto-verified
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse.model_validate(new_user)


@router.put(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Update user (Admin only)",
    description="Update a user's information. Requires admin access."
)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Update a user's information.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from demoting themselves
    if user.id == admin.id and user_data.role and user_data.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own admin role"
        )
    
    # Update fields
    if user_data.email is not None:
        # Check email uniqueness
        existing = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        user.email = user_data.email
    
    if user_data.password is not None:
        user.hashed_password = get_password_hash(user_data.password)
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    
    if user_data.role is not None:
        user.role = user_data.role
    
    if user_data.is_active is not None:
        # Prevent admin from deactivating themselves
        if user.id == admin.id and not user_data.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account"
            )
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user (Admin only)",
    description="Delete a user account. Requires admin access."
)
async def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> None:
    """
    Delete a user account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
