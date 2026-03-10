from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..models import User, UserRole, Message, PlayerStatistics, CoachingSession, TrainingSession, TrainingAttendance, Announcement, ProgressReport
from ..schemas import (
    MessageCreate, MessageResponse, MessageWithUser,
    PlayerStatisticsCreate, PlayerStatisticsUpdate, PlayerStatisticsResponse,
    PlayerStatisticsWithPlayer, CoachDashboard, UserPublic
)
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/coach-panel", tags=["Coach Panel"])


# ==================== Coach Dashboard ====================

@router.get("/dashboard", response_model=CoachDashboard)
def get_coach_dashboard(
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    # Get all players
    total_players = db.query(User).filter(User.role == UserRole.PLAYER).count()
    
    # Get pending messages sent to coach
    pending_messages = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    # Get upcoming coaching sessions
    upcoming_sessions = db.query(CoachingSession).filter(
        CoachingSession.coach_id == current_user.id,
        CoachingSession.scheduled_date >= datetime.now()
    ).count()
    
    return {
        "total_players": total_players,
        "pending_messages": pending_messages,
        "upcoming_sessions": upcoming_sessions,
        "recent_performance": {}
    }


# ==================== Player Management ====================

@router.get("/players", response_model=List[UserPublic])
def get_all_players(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN]))
):
    players = db.query(User).filter(
        User.role == UserRole.PLAYER
    ).offset(skip).limit(limit).all()
    return [UserPublic.model_validate(p) for p in players]


@router.get("/players/{player_id}", response_model=UserPublic)
def get_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN]))
):
    player = db.query(User).filter(
        User.id == player_id,
        User.role == UserRole.PLAYER
    ).first()
    
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    return UserPublic.model_validate(player)


# ==================== Player Statistics ====================

@router.get("/players/{player_id}/statistics", response_model=PlayerStatisticsWithPlayer)
def get_player_statistics(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN]))
):
    stats = db.query(PlayerStatistics).filter(
        PlayerStatistics.player_id == player_id
    ).first()
    
    player = db.query(User).filter(User.id == player_id).first()
    
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    result = PlayerStatisticsWithPlayer(
        id=stats.id if stats else 0,
        player_id=player_id,
        serves=stats.serves if stats else 0,
        aces=stats.aces if stats else 0,
        double_faults=stats.double_faults if stats else 0,
        first_serve_percentage=stats.first_serve_percentage if stats else 0.0,
        second_serve_points_won=stats.second_serve_points_won if stats else 0,
        break_points_saved=stats.break_points_saved if stats else 0,
        break_points_faced=stats.break_points_faced if stats else 0,
        total_games=stats.total_games if stats else 0,
        total_sets=stats.total_sets if stats else 0,
        total_matches=stats.total_matches if stats else 0,
        winning_streak=stats.winning_streak if stats else 0,
        losing_streak=stats.losing_streak if stats else 0,
        longest_win_streak=stats.longest_win_streak if stats else 0,
        longest_lose_streak=stats.longest_lose_streak if stats else 0,
        coach_notes=stats.coach_notes if stats else None,
        last_updated=stats.last_updated if stats else None,
        created_at=stats.created_at if stats else datetime.now(),
        player=UserPublic.model_validate(player) if player else None
    )
    
    return result


@router.post("/players/{player_id}/statistics", response_model=PlayerStatisticsResponse)
def create_player_statistics(
    player_id: int,
    stats_data: PlayerStatisticsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN]))
):
    # Check if player exists
    player = db.query(User).filter(
        User.id == player_id,
        User.role == UserRole.PLAYER
    ).first()
    
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    # Check if stats already exist
    existing_stats = db.query(PlayerStatistics).filter(
        PlayerStatistics.player_id == player_id
    ).first()
    
    if existing_stats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Statistics already exist for this player. Use PUT to update."
        )
    
    new_stats = PlayerStatistics(
        player_id=player_id,
        serves=stats_data.serves,
        aces=stats_data.aces,
        double_faults=stats_data.double_faults,
        first_serve_percentage=stats_data.first_serve_percentage,
        second_serve_points_won=stats_data.second_serve_points_won,
        break_points_saved=stats_data.break_points_saved,
        break_points_faced=stats_data.break_points_faced,
        total_games=stats_data.total_games,
        total_sets=stats_data.total_sets,
        total_matches=stats_data.total_matches,
        winning_streak=stats_data.winning_streak,
        losing_streak=stats_data.losing_streak,
        longest_win_streak=stats_data.longest_win_streak,
        longest_lose_streak=stats_data.longest_lose_streak,
        coach_notes=stats_data.coach_notes
    )
    
    db.add(new_stats)
    db.commit()
    db.refresh(new_stats)
    
    return new_stats


@router.put("/players/{player_id}/statistics", response_model=PlayerStatisticsResponse)
def update_player_statistics(
    player_id: int,
    stats_data: PlayerStatisticsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN]))
):
    stats = db.query(PlayerStatistics).filter(
        PlayerStatistics.player_id == player_id
    ).first()
    
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statistics not found for this player"
        )
    
    for key, value in stats_data.model_dump(exclude_unset=True).items():
        setattr(stats, key, value)
    
    db.commit()
    db.refresh(stats)
    
    return stats


# ==================== Messaging ====================

@router.post("/messages", response_model=MessageResponse)
def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if receiver exists
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        subject=message_data.subject,
        content=message_data.content,
        message_type=message_data.message_type
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message


@router.get("/messages", response_model=List[MessageWithUser])
def get_messages(
    skip: int = 0,
    limit: int = 50,
    folder: str = "inbox",  # inbox or sent
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if folder == "sent":
        messages = db.query(Message).filter(
            Message.sender_id == current_user.id
        ).order_by(Message.created_at.desc()).offset(skip).limit(limit).all()
    else:
        messages = db.query(Message).filter(
            Message.receiver_id == current_user.id
        ).order_by(Message.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        receiver = db.query(User).filter(User.id == msg.receiver_id).first()
        
        msg_dict = MessageResponse.model_validate(msg).model_dump()
        msg_dict["sender"] = UserPublic.model_validate(sender).model_dump() if sender else None
        msg_dict["receiver"] = UserPublic.model_validate(receiver).model_dump() if receiver else None
        result.append(msg_dict)
    
    return result


@router.get("/messages/{message_id}", response_model=MessageWithUser)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user is sender or receiver
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this message"
        )
    
    sender = db.query(User).filter(User.id == message.sender_id).first()
    receiver = db.query(User).filter(User.id == message.receiver_id).first()
    
    msg_dict = MessageResponse.model_validate(message).model_dump()
    msg_dict["sender"] = UserPublic.model_validate(sender).model_dump() if sender else None
    msg_dict["receiver"] = UserPublic.model_validate(receiver).model_dump() if receiver else None
    
    return msg_dict


@router.put("/messages/{message_id}/read")
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this message"
        )
    
    message.is_read = True
    db.commit()
    
    return {"message": "Message marked as read"}


@router.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this message"
        )
    
    db.delete(message)
    db.commit()
    
    return {"message": "Message deleted successfully"}


@router.get("/messages/unread/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    return {"unread_count": count}


# ==================== Training Sessions ====================

class TrainingSessionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    court_id: Optional[int] = None
    scheduled_date: datetime
    duration_minutes: int = 60
    max_participants: int = 4
    session_type: str = "general"


class TrainingSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    court_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    max_participants: Optional[int] = None
    session_type: Optional[str] = None
    status: Optional[str] = None


class TrainingSessionResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    coach_id: int
    court_id: Optional[int]
    scheduled_date: datetime
    duration_minutes: int
    max_participants: int
    session_type: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/training-sessions", response_model=List[TrainingSessionResponse])
def get_training_sessions(
    skip: int = 0,
    limit: int = 50,
    upcoming: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN]))
):
    query = db.query(TrainingSession)
    
    if upcoming:
        query = query.filter(TrainingSession.scheduled_date >= datetime.now())
    
    sessions = query.order_by(TrainingSession.scheduled_date.asc()).offset(skip).limit(limit).all()
    return sessions


@router.post("/training-sessions", response_model=TrainingSessionResponse)
def create_training_session(
    session_data: TrainingSessionCreate,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    new_session = TrainingSession(
        title=session_data.title,
        description=session_data.description,
        coach_id=current_user.id,
        court_id=session_data.court_id,
        scheduled_date=session_data.scheduled_date,
        duration_minutes=session_data.duration_minutes,
        max_participants=session_data.max_participants,
        session_type=session_data.session_type
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session


@router.put("/training-sessions/{session_id}", response_model=TrainingSessionResponse)
def update_training_session(
    session_id: int,
    session_data: TrainingSessionUpdate,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    if session_data.title is not None:
        session.title = session_data.title
    if session_data.description is not None:
        session.description = session_data.description
    if session_data.court_id is not None:
        session.court_id = session_data.court_id
    if session_data.scheduled_date is not None:
        session.scheduled_date = session_data.scheduled_date
    if session_data.duration_minutes is not None:
        session.duration_minutes = session_data.duration_minutes
    if session_data.max_participants is not None:
        session.max_participants = session_data.max_participants
    if session_data.session_type is not None:
        session.session_type = session_data.session_type
    if session_data.status is not None:
        session.status = session_data.status
    
    db.commit()
    db.refresh(session)
    
    return session


@router.delete("/training-sessions/{session_id}")
def delete_training_session(
    session_id: int,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    db.delete(session)
    db.commit()
    
    return {"message": "Training session deleted successfully"}


# ==================== Announcements ====================

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "normal"
    expires_at: Optional[datetime] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    priority: str
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(
    skip: int = 0,
    limit: int = 20,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Announcement)
    
    if active_only:
        query = query.filter(Announcement.is_active == True)
    
    announcements = query.order_by(Announcement.created_at.desc()).offset(skip).limit(limit).all()
    return announcements


@router.post("/announcements", response_model=AnnouncementResponse)
def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    new_announcement = Announcement(
        title=announcement_data.title,
        content=announcement_data.content,
        author_id=current_user.id,
        priority=announcement_data.priority,
        expires_at=announcement_data.expires_at
    )
    
    db.add(new_announcement)
    db.flush()  # Get the announcement ID before committing
    
    # Get all players
    players = db.query(User).filter(User.role == UserRole.PLAYER).all()
    
    # Create a message for each player
    for player in players:
        message = Message(
            sender_id=current_user.id,
            receiver_id=player.id,
            subject=f"📢 {announcement_data.title}",
            content=announcement_data.content,
            message_type="notification"
        )
        db.add(message)
    
    db.commit()
    db.refresh(new_announcement)
    
    return new_announcement


@router.put("/announcements/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementUpdate,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    if announcement_data.title is not None:
        announcement.title = announcement_data.title
    if announcement_data.content is not None:
        announcement.content = announcement_data.content
    if announcement_data.priority is not None:
        announcement.priority = announcement_data.priority
    if announcement_data.is_active is not None:
        announcement.is_active = announcement_data.is_active
    if announcement_data.expires_at is not None:
        announcement.expires_at = announcement_data.expires_at
    
    db.commit()
    db.refresh(announcement)
    
    return announcement


@router.delete("/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    db.delete(announcement)
    db.commit()
    
    return {"message": "Announcement deleted successfully"}


# ==================== Progress Reports ====================

class ProgressReportCreate(BaseModel):
    player_id: int
    title: str
    content: str
    rating: Optional[int] = None
    goals: Optional[str] = None
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None


class ProgressReportResponse(BaseModel):
    id: int
    player_id: int
    coach_id: int
    title: str
    content: str
    rating: Optional[int]
    goals: Optional[str]
    strengths: Optional[str]
    areas_for_improvement: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/players/{player_id}/progress-reports", response_model=List[ProgressReportResponse])
def get_player_progress_reports(
    player_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN]))
):
    reports = db.query(ProgressReport).filter(
        ProgressReport.player_id == player_id
    ).order_by(ProgressReport.created_at.desc()).offset(skip).limit(limit).all()
    
    return reports


@router.post("/progress-reports", response_model=ProgressReportResponse)
def create_progress_report(
    report_data: ProgressReportCreate,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    # Verify player exists
    player = db.query(User).filter(
        User.id == report_data.player_id,
        User.role == UserRole.PLAYER
    ).first()
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    new_report = ProgressReport(
        player_id=report_data.player_id,
        coach_id=current_user.id,
        title=report_data.title,
        content=report_data.content,
        rating=report_data.rating,
        goals=report_data.goals,
        strengths=report_data.strengths,
        areas_for_improvement=report_data.areas_for_improvement
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return new_report


@router.delete("/progress-reports/{report_id}")
def delete_progress_report(
    report_id: int,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    report = db.query(ProgressReport).filter(ProgressReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Progress report not found")
    
    db.delete(report)
    db.commit()
    
    return {"message": "Progress report deleted successfully"}
