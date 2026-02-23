from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import User, UserRole, Message, PlayerStatistics, CoachingSession
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
