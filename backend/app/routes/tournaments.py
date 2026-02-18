from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import Tournament, TournamentParticipant, TournamentStatus, TournamentFormat, Match, MatchStatus, User, UserRole
from ..schemas import (
    TournamentCreate, TournamentUpdate, TournamentResponse, 
    TournamentWithParticipants, TournamentParticipantCreate,
    TournamentParticipantResponse, TournamentParticipantWithUser
)
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/tournaments", tags=["Tournaments"])


@router.get("/", response_model=List[TournamentResponse])
def get_tournaments(
    skip: int = 0,
    limit: int = 20,
    status: TournamentStatus = None,
    tournament_type: TournamentFormat = None,
    db: Session = Depends(get_db)
):
    query = db.query(Tournament)
    
    if status:
        query = query.filter(Tournament.status == status)
    if tournament_type:
        query = query.filter(Tournament.tournament_type == tournament_type)
    
    tournaments = query.order_by(Tournament.start_date.desc()).offset(skip).limit(limit).all()
    
    # Add participant count to each tournament
    result = []
    for t in tournaments:
        participant_count = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == t.id
        ).count()
        t_dict = TournamentResponse.model_validate(t).model_dump()
        t_dict['participant_count'] = participant_count
        result.append(TournamentResponse(**t_dict))
    
    return result


@router.get("/active", response_model=List[TournamentResponse])
def get_active_tournaments(
    db: Session = Depends(get_db)
):
    tournaments = db.query(Tournament).filter(
        Tournament.status == TournamentStatus.ONGOING
    ).order_by(Tournament.start_date.desc()).all()
    
    result = []
    for t in tournaments:
        participant_count = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == t.id
        ).count()
        t_dict = TournamentResponse.model_validate(t).model_dump()
        t_dict['participant_count'] = participant_count
        result.append(TournamentResponse(**t_dict))
    
    return result


@router.get("/{tournament_id}", response_model=TournamentWithParticipants)
def get_tournament(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    participants = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id
    ).all()
    
    participant_responses = []
    for p in participants:
        user = db.query(User).filter(User.id == p.user_id).first()
        if user:
            p_dict = TournamentParticipantResponse.model_validate(p).model_dump()
            p_dict['user'] = user
            participant_responses.append(TournamentParticipantWithUser(**p_dict))
    
    return {
        **TournamentResponse.model_validate(tournament).model_dump(),
        "participants": participant_responses,
        "participant_count": len(participants)
    }


@router.post("/", response_model=TournamentResponse)
def create_tournament(
    tournament_data: TournamentCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    new_tournament = Tournament(
        **tournament_data.model_dump(),
        organizer_id=current_user.id,
        status=TournamentStatus.UPCOMING
    )
    
    db.add(new_tournament)
    db.commit()
    db.refresh(new_tournament)
    
    return new_tournament


@router.put("/{tournament_id}", response_model=TournamentResponse)
def update_tournament(
    tournament_id: int,
    tournament_data: TournamentUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    for key, value in tournament_data.model_dump(exclude_unset=True).items():
        setattr(tournament, key, value)
    
    db.commit()
    db.refresh(tournament)
    return tournament


@router.delete("/{tournament_id}")
def delete_tournament(
    tournament_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    db.delete(tournament)
    db.commit()
    return {"message": "Tournament deleted successfully"}


# Tournament Participants
@router.post("/{tournament_id}/join", response_model=TournamentParticipantResponse)
def join_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    if tournament.status != TournamentStatus.UPCOMING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is closed for this tournament"
        )
    
    if tournament.registration_deadline and tournament.registration_deadline < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration deadline has passed"
        )
    
    # Check if already registered
    existing = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this tournament"
        )
    
    # Check max participants
    if tournament.max_participants:
        current_count = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id
        ).count()
        
        if current_count >= tournament.max_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tournament is full"
            )
    
    participant = TournamentParticipant(
        tournament_id=tournament_id,
        user_id=current_user.id
    )
    
    db.add(participant)
    db.commit()
    db.refresh(participant)
    
    return participant


@router.post("/{tournament_id}/leave")
def leave_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    participant = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not registered for this tournament"
        )
    
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if tournament.status == TournamentStatus.ONGOING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot leave an ongoing tournament"
        )
    
    db.delete(participant)
    db.commit()
    
    return {"message": "Successfully left the tournament"}


@router.get("/{tournament_id}/participants", response_model=List[TournamentParticipantWithUser])
def get_tournament_participants(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    participants = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id
    ).all()
    
    result = []
    for p in participants:
        user = db.query(User).filter(User.id == p.user_id).first()
        if user:
            from ..schemas import UserPublic
            result.append({
                **TournamentParticipantResponse.model_validate(p).model_dump(),
                "user": UserPublic.model_validate(user).model_dump()
            })
    
    return result


@router.post("/{tournament_id}/start")
def start_tournament(
    tournament_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    if tournament.status != TournamentStatus.UPCOMING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tournament cannot be started"
        )
    
    # Get all participants
    participants = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id
    ).all()
    
    if len(participants) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Need at least 2 participants to start"
        )
    
    # Generate matches based on tournament type
    if tournament.tournament_type == TournamentFormat.KNOCKOUT:
        # Shuffle participants and create knockout matches
        import random
        random.shuffle(participants)
        
        round_num = 1
        for i in range(0, len(participants), 2):
            if i + 1 < len(participants):
                match = Match(
                    tournament_id=tournament_id,
                    player1_id=participants[i].user_id,
                    player2_id=participants[i + 1].user_id,
                    round_number=round_num,
                    match_number=i // 2 + 1,
                    status=MatchStatus.SCHEDULED
                )
                db.add(match)
    
    tournament.status = TournamentStatus.ONGOING
    db.commit()
    
    return {"message": "Tournament started successfully"}
