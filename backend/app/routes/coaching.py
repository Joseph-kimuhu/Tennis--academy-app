from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import CoachingSession, User, UserRole
from ..schemas import CoachingSessionCreate, CoachingSessionUpdate, CoachingSessionResponse, CoachingSessionWithCoach
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/coaching", tags=["Coaching Sessions"])


@router.get("/", response_model=List[CoachingSessionWithCoach])
def get_coaching_sessions(
    skip: int = 0,
    limit: int = 20,
    coach_id: int = None,
    player_id: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(CoachingSession)
    
    if coach_id:
        query = query.filter(CoachingSession.coach_id == coach_id)
    if player_id:
        query = query.filter(CoachingSession.player_id == player_id)
    
    sessions = query.order_by(CoachingSession.scheduled_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for session in sessions:
        coach = db.query(User).filter(User.id == session.coach_id).first()
        result.append({
            **CoachingSessionResponse.model_validate(session).model_dump(),
            "coach": coach
        })
    
    return result


@router.get("/my-sessions", response_model=List[CoachingSessionWithCoach])
def get_my_coaching_sessions(
    skip: int = 0,
    limit: int = 20,
    as_coach: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if as_coach:
        sessions = db.query(CoachingSession).filter(
            CoachingSession.coach_id == current_user.id
        ).order_by(CoachingSession.scheduled_date.desc()).offset(skip).limit(limit).all()
    else:
        sessions = db.query(CoachingSession).filter(
            CoachingSession.player_id == current_user.id
        ).order_by(CoachingSession.scheduled_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for session in sessions:
        coach = db.query(User).filter(User.id == session.coach_id).first()
        result.append({
            **CoachingSessionResponse.model_validate(session).model_dump(),
            "coach": coach
        })
    
    return result


@router.get("/{session_id}", response_model=CoachingSessionWithCoach)
def get_coaching_session(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.query(CoachingSession).filter(CoachingSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coaching session not found"
        )
    
    coach = db.query(User).filter(User.id == session.coach_id).first()
    
    return {
        **CoachingSessionResponse.model_validate(session).model_dump(),
        "coach": coach
    }


@router.post("/", response_model=CoachingSessionResponse)
def create_coaching_session(
    session_data: CoachingSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify coach exists
    coach = db.query(User).filter(
        User.id == session_data.player_id,
        User.role == UserRole.COACH
    ).first()
    
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    new_session = CoachingSession(
        coach_id=session_data.player_id,
        player_id=current_user.id,
        title=session_data.title,
        description=session_data.description,
        scheduled_date=session_data.scheduled_date,
        start_time=session_data.start_time,
        end_time=session_data.end_time,
        notes=session_data.notes,
        price=coach.ranking_points  # Using ranking_points as placeholder for price
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session


@router.put("/{session_id}", response_model=CoachingSessionResponse)
def update_coaching_session(
    session_id: int,
    session_data: CoachingSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(CoachingSession).filter(CoachingSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coaching session not found"
        )
    
    # Check ownership
    if current_user.role != UserRole.ADMIN and session.player_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this session"
        )
    
    for key, value in session_data.model_dump(exclude_unset=True).items():
        setattr(session, key, value)
    
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}")
def delete_coaching_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(CoachingSession).filter(CoachingSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coaching session not found"
        )
    
    # Check ownership
    if current_user.role != UserRole.ADMIN and session.player_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this session"
        )
    
    db.delete(session)
    db.commit()
    
    return {"message": "Coaching session deleted successfully"}
