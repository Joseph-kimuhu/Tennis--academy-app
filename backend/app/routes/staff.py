from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserCreate, UserResponse, StaffCreate
from ..auth import get_password_hash, get_current_user, require_role

router = APIRouter(prefix="/api/staff", tags=["Staff Management"])

# Admin authorization code (should be stored securely in environment variables)
ADMIN_AUTH_CODE = "TENNIS2024ADMIN"  # Change this to a secure code

@router.post("/create-account", response_model=UserResponse)
def create_staff_account(
    staff_data: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Create a new staff account (admin only)"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == staff_data.email) | (User.username == staff_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # For admin role creation, require admin code
    if staff_data.role == UserRole.ADMIN and staff_data.admin_code != ADMIN_AUTH_CODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin authorization code"
        )
    
    # Create new staff user
    new_user = User(
        email=staff_data.email,
        username=staff_data.username,
        full_name=staff_data.full_name,
        hashed_password=get_password_hash(staff_data.password),
        role=staff_data.role,
        is_active=True,
        is_verified=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/register", response_model=UserResponse)
def staff_registration(
    staff_data: StaffCreate,
    db: Session = Depends(get_db)
):
    """Public staff registration - simplified coach registration with automatic admin access"""
    
    # Always create as coach with admin privileges
    staff_data.role = UserRole.COACH
    
    # For admin role creation (special cases only), require admin code
    if staff_data.role == UserRole.ADMIN and staff_data.admin_code != ADMIN_AUTH_CODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin authorization code"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == staff_data.email) | (User.username == staff_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new staff user (coach with admin privileges)
    new_user = User(
        email=staff_data.email,
        username=staff_data.username,
        full_name=staff_data.full_name,
        hashed_password=get_password_hash(staff_data.password),
        role=staff_data.role,
        is_active=True,
        is_verified=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/stats")
def get_staff_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH]))
):
    """Get staff statistics - Coaches have full admin access"""
    
    total_users = db.query(User).count()
    total_bookings = db.query(User).count()  # This would need to be updated with actual booking count
    active_tournaments = db.query(User).count()  # This would need to be updated with actual tournament count
    
    return {
        "total_users": total_users,
        "total_bookings": total_bookings,
        "active_tournaments": active_tournaments
    }

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH]))
):
    """Get all users - Coaches have full admin access"""
    
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/players", response_model=List[UserResponse])
def get_players(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH]))
):
    """Get all players - Coaches have full admin access"""
    
    players = db.query(User).filter(User.role == UserRole.PLAYER).offset(skip).limit(limit).all()
    return players

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH]))
):
    """Update user role - Coaches have full admin access"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if new_role not in [role.value for role in UserRole]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )
    
    user.role = UserRole(new_role)
    db.commit()
    
    return {"message": f"User role updated to {new_role}"}

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH]))
):
    """Update user active status - Coaches have full admin access"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = is_active
    db.commit()
    
    return {"message": f"User status updated to {'active' if is_active else 'inactive'}"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH]))
):
    """Delete user - Coaches have full admin access"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deletion of the current user
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH]))
):
    """Update user details - Coaches have full admin access"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update allowed fields
    if 'email' in user_data:
        user.email = user_data['email']
    if 'username' in user_data:
        user.username = user_data['username']
    if 'full_name' in user_data:
        user.full_name = user_data['full_name']
    if 'role' in user_data:
        if user_data['role'] not in [role.value for role in UserRole]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        user.role = UserRole(user_data['role'])
    
    db.commit()
    
    return {"message": "User updated successfully"}
