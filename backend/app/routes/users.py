from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserResponse, UserUpdate, UserPublic, PlayerStats
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
