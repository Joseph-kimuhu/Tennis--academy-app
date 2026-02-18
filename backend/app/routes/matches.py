from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import Match, MatchStatus, Tournament, TournamentParticipant, User, UserRole
from ..schemas import MatchCreate, MatchUpdate, MatchResponse, MatchWithPlayers
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/matches", tags=["Matches"])


@router.get("/", response_model=List[MatchResponse])
def get_matches(
    skip: int = 0,
    limit: int = 20,
    tournament_id: int = None,
    status: MatchStatus = None,
    player_id: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(Match)
    
    if tournament_id:
        query = query.filter(Match.tournament_id == tournament_id)
    if status:
        query = query.filter(Match.status == status)
    if player_id:
        query = query.filter(
            (Match.player1_id == player_id) | (Match.player2_id == player_id)
        )
    
    matches = query.order_by(Match.scheduled_time.desc()).offset(skip).limit(limit).all()
    return matches


@router.get("/my-matches", response_model=List[MatchWithPlayers])
def get_my_matches(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    matches = db.query(Match).filter(
        (Match.player1_id == current_user.id) | (Match.player2_id == current_user.id)
    ).order_by(Match.scheduled_time.desc()).offset(skip).limit(limit).all()
    
    result = []
    for match in matches:
        player1 = db.query(User).filter(User.id == match.player1_id).first()
        player2 = db.query(User).filter(User.id == match.player2_id).first()
        winner = db.query(User).filter(User.id == match.winner_id).first() if match.winner_id else None
        
        result.append({
            **MatchResponse.model_validate(match).model_dump(),
            "player1": player1,
            "player2": player2,
            "winner": winner
        })
    
    return result


@router.get("/{match_id}", response_model=MatchWithPlayers)
def get_match(
    match_id: int,
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    player1 = db.query(User).filter(User.id == match.player1_id).first()
    player2 = db.query(User).filter(User.id == match.player2_id).first()
    winner = db.query(User).filter(User.id == match.winner_id).first() if match.winner_id else None
    
    return {
        **MatchResponse.model_validate(match).model_dump(),
        "player1": player1,
        "player2": player2,
        "winner": winner
    }


@router.post("/", response_model=MatchResponse)
def create_match(
    match_data: MatchCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH])),
    db: Session = Depends(get_db)
):
    # Verify players exist
    player1 = db.query(User).filter(User.id == match_data.player1_id).first()
    player2 = db.query(User).filter(User.id == match_data.player2_id).first()
    
    if not player1 or not player2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    new_match = Match(**match_data.model_dump())
    
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    
    return new_match


@router.put("/{match_id}", response_model=MatchResponse)
def update_match(
    match_id: int,
    match_data: MatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Handle winner selection
    if match_data.winner_id:
        winner = db.query(User).filter(User.id == match_data.winner_id).first()
        if not winner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Winner not found"
            )
        
        # Update player stats
        winner.matches_played += 1
        winner.wins += 1
        winner.ranking_points += match.winner_points_earned
        
        # Update loser stats
        loser_id = match.player1_id if match.player2_id == match.winner_id else match.player2_id
        loser = db.query(User).filter(User.id == loser_id).first()
        if loser:
            loser.matches_played += 1
            loser.losses += 1
        
        match.status = MatchStatus.COMPLETED
    
    for key, value in match_data.model_dump(exclude_unset=True).items():
        setattr(match, key, value)
    
    db.commit()
    db.refresh(match)
    return match


@router.post("/{match_id}/score")
def update_match_score(
    match_id: int,
    player1_score: str = Query(...),
    player2_score: str = Query(...),
    winner_id: int = Query(...),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH])),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Validate winner
    if winner_id not in [match.player1_id, match.player2_id]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Winner must be one of the players"
        )
    
    # Update match
    match.player1_score = player1_score
    match.player2_score = player2_score
    match.winner_id = winner_id
    match.status = MatchStatus.COMPLETED
    
    # Update winner stats
    winner = db.query(User).filter(User.id == winner_id).first()
    if winner:
        winner.matches_played += 1
        winner.wins += 1
        winner.ranking_points += match.winner_points_earned
    
    # Update loser stats
    loser_id = match.player1_id if match.player2_id == winner_id else match.player2_id
    loser = db.query(User).filter(User.id == loser_id).first()
    if loser:
        loser.matches_played += 1
        loser.losses += 1
    
    db.commit()
    
    return {"message": "Match score updated successfully"}
