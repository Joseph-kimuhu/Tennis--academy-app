from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import os
import uuid
from pathlib import Path
from ..database import get_db
from ..models import User, UserRole, Message, Announcement
from ..schemas import UserResponse, UserUpdate, UserPublic, PlayerStats, MessageWithUser, MessageResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[UserPublic])
def get_users(
    skip: int = 0,
    limit: int = 20,
    role: UserRole = None,
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/players", response_model=List[UserPublic])
def get_players(
    skip: int = 0,
    limit: int = 20,
    skill_level: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role == UserRole.PLAYER)
    if skill_level:
        query = query.filter(User.skill_level == skill_level)
    players = query.offset(skip).limit(limit).all()
    return players


@router.get("/coaches", response_model=List[UserPublic])
def get_coaches(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    coaches = db.query(User).filter(User.role == UserRole.COACH).offset(skip).limit(limit).all()
    return coaches


@router.get("/leaderboard", response_model=List[UserPublic])
def get_leaderboard(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    players = db.query(User).filter(
        User.role == UserRole.PLAYER,
        User.is_active == True
    ).order_by(User.ranking_points.desc()).limit(limit).all()
    return players


# ==================== Announcements for Players ====================

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    priority: str
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(
    skip: int = 0,
    limit: int = 20,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get announcements for the current player"""
    query = db.query(Announcement)
    
    if active_only:
        query = query.filter(Announcement.is_active == True)
        # Also filter out expired announcements
        query = query.filter(
            (Announcement.expires_at == None) | 
            (Announcement.expires_at > datetime.now())
        )
    
    announcements = query.order_by(Announcement.created_at.desc()).offset(skip).limit(limit).all()
    
    return announcements


@router.get("/announcements/unread-count")
def get_unread_announcements_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread announcements (announcements created in the last 7 days)"""
    from datetime import timedelta
    
    # Consider announcements from the last 7 days as "new"
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    count = db.query(Announcement).filter(
        Announcement.is_active == True,
        Announcement.created_at >= seven_days_ago
    ).count()
    
    return {"unread_count": count}


@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    if user_data.phone is not None:
        current_user.phone = user_data.phone
    if user_data.bio is not None:
        current_user.bio = user_data.bio
    if user_data.skill_level is not None:
        current_user.skill_level = user_data.skill_level
    if user_data.profile_picture is not None:
        current_user.profile_picture = user_data.profile_picture
    
    db.commit()
    db.refresh(current_user)
    return current_user


# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("backend/uploads/profile_pictures")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@router.post("/me/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a profile picture for the current user"""
    
    # Validate file type
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PNG, JPG, JPEG, GIF, and WEBP are allowed."
        )
    
    # Generate unique filename
    file_ext = file.filename.rsplit(".", 1)[1].lower()
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Delete old profile picture if exists
    if current_user.profile_picture:
        old_filename = current_user.profile_picture.split("/")[-1]
        old_path = UPLOAD_DIR / old_filename
        if old_path.exists():
            try:
                old_path.unlink()
            except:
                pass
    
    # Update user's profile picture URL
    # For development, we'll serve files statically
    profile_picture_url = f"/api/users/profile-pictures/{unique_filename}"
    current_user.profile_picture = profile_picture_url
    db.commit()
    db.refresh(current_user)
    
    return {"profile_picture": profile_picture_url, "filename": unique_filename}


@router.delete("/me/profile-picture")
def remove_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove the current user's profile picture"""
    
    # Delete old profile picture if exists
    if current_user.profile_picture:
        filename = current_user.profile_picture.split("/")[-1]
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            try:
                file_path.unlink()
            except:
                pass
        
        current_user.profile_picture = None
        db.commit()
        db.refresh(current_user)
    
    return {"message": "Profile picture removed successfully"}


@router.get("/profile-pictures/{filename}")
async def get_profile_picture(filename: str):
    """Serve profile pictures"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Determine content type
    content_types = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    ext = filename.rsplit(".", 1)[1].lower()
    content_type = content_types.get(ext, "application/octet-stream")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path, media_type=content_type)


@router.get("/me/stats", response_model=PlayerStats)
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models import Match
    from sqlalchemy import or_
    
    # Get recent matches
    recent_matches = db.query(Match).filter(
        or_(Match.player1_id == current_user.id, Match.player2_id == current_user.id)
    ).order_by(Match.created_at.desc()).limit(10).all()
    
    # Calculate recent performance
    recent_performance = []
    for match in recent_matches:
        if match.winner_id == current_user.id:
            recent_performance.append("W")
        elif match.status.value == "completed":
            recent_performance.append("L")
    
    win_rate = 0.0
    if current_user.matches_played > 0:
        win_rate = (current_user.wins / current_user.matches_played) * 100
    
    return {
        "user": current_user,
        "total_matches": current_user.matches_played,
        "wins": current_user.wins,
        "losses": current_user.losses,
        "win_rate": win_rate,
        "ranking_points": current_user.ranking_points,
        "recent_performance": recent_performance
    }


@router.get("/{user_id}/stats", response_model=PlayerStats)
def get_user_stats(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    from ..models import Match
    from sqlalchemy import or_
    
    recent_matches = db.query(Match).filter(
        or_(Match.player1_id == user.id, Match.player2_id == user.id)
    ).order_by(Match.created_at.desc()).limit(10).all()
    
    recent_performance = []
    for match in recent_matches:
        if match.winner_id == user.id:
            recent_performance.append("W")
        elif match.status.value == "completed":
            recent_performance.append("L")
    
    win_rate = 0.0
    if user.matches_played > 0:
        win_rate = (user.wins / user.matches_played) * 100
    
    return {
        "user": user,
        "total_matches": user.matches_played,
        "wins": user.wins,
        "losses": user.losses,
        "win_rate": win_rate,
        "ranking_points": user.ranking_points,
        "recent_performance": recent_performance
    }


# ==================== Notifications ====================

@router.get("/notifications", response_model=List[MessageWithUser])
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for the current user"""
    query = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.message_type == "notification"
    )
    
    if unread_only:
        query = query.filter(Message.is_read == False)
    
    messages = query.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        msg_dict = MessageResponse.model_validate(msg).model_dump()
        msg_dict["sender"] = UserPublic.model_validate(sender).model_dump() if sender else None
        msg_dict["receiver"] = UserPublic.model_validate(current_user).model_dump()
        result.append(msg_dict)
    
    return result


@router.get("/notifications/unread-count")
def get_unread_notifications_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.message_type == "notification",
        Message.is_read == False
    ).count()
    
    return {"unread_count": count}


@router.put("/notifications/{message_id}/read")
def mark_notification_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.receiver_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    message.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}
