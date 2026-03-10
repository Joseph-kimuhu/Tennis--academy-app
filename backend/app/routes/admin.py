from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, Court, Booking, Tournament, UserRole
from ..schemas import AdminDashboard
from ..auth import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard", response_model=AdminDashboard)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Get counts
    total_users = db.query(User).count()
    total_courts = db.query(Court).count()
    total_bookings = db.query(Booking).count()
    
    active_tournaments = db.query(Tournament).filter(
        Tournament.status == "ongoing"
    ).count()
    
    # Calculate revenue (from confirmed bookings)
    from ..models import BookingStatus
    total_revenue = db.query(Booking).filter(
        Booking.status == BookingStatus.CONFIRMED
    ).all()
    revenue = sum(booking.total_price for booking in total_revenue)
    
    # Get recent bookings
    recent_bookings = db.query(Booking).order_by(
        Booking.created_at.desc()
    ).limit(5).all()
    
    # Get recent registrations
    recent_registrations = db.query(User).order_by(
        User.created_at.desc()
    ).limit(5).all()
    
    from ..schemas import BookingResponse, UserResponse
    
    return {
        "total_users": total_users,
        "total_courts": total_courts,
        "total_bookings": total_bookings,
        "active_tournaments": active_tournaments,
        "total_revenue": revenue,
        "recent_bookings": [BookingResponse.model_validate(b) for b in recent_bookings],
        "recent_registrations": [UserResponse.model_validate(u) for u in recent_registrations]
    }


@router.get("/users", response_model=list)
def get_all_users(
    skip: int = 0,
    limit: int = 50,
    role: UserRole = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()


@router.post("/users/{user_id}/verify")
def verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_verified = True
    db.commit()
    
    return {"message": "User verified successfully"}


@router.post("/users/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    return {"message": "User activated successfully"}


@router.post("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )
    
    user.is_active = False
    db.commit()
    
    return {"message": "User deactivated successfully"}


@router.get("/stats/overview")
def get_stats_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Get stats for the last 7 days
    week_ago = datetime.now() - timedelta(days=7)
    
    new_users = db.query(User).filter(User.created_at >= week_ago).count()
    new_bookings = db.query(Booking).filter(Booking.created_at >= week_ago).count()
    
    # Get bookings by status
    from ..models import BookingStatus
    bookings_by_status = {}
    for status in BookingStatus:
        count = db.query(Booking).filter(Booking.status == status).count()
        bookings_by_status[status.value] = count
    
    # Get users by role
    users_by_role = {}
    for role in UserRole:
        count = db.query(User).filter(User.role == role).count()
        users_by_role[role.value] = count
    
    return {
        "new_users_this_week": new_users,
        "new_bookings_this_week": new_bookings,
        "bookings_by_status": bookings_by_status,
        "users_by_role": users_by_role
    }


@router.post("/users/{user_id}/promote-to-coach")
def promote_to_coach(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Promote a player to coach"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = UserRole.COACH
    db.commit()
    
    return {"message": f"User {user.username} promoted to coach"}


@router.post("/users/{user_id}/demote-to-player")
def demote_to_player(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Demote a coach to player"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = UserRole.PLAYER
    db.commit()
    
    return {"message": f"User {user.username} demoted to player"}
