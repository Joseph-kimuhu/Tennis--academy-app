from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Club, Court, CourtType
from ..schemas import ClubCreate, ClubResponse
from typing import List

router = APIRouter(prefix="/api/clubs", tags=["clubs"])


@router.get("/", response_model=List[ClubResponse])
def get_clubs(db: Session = Depends(get_db)):
    clubs = db.query(Club).filter(Club.is_active == True).all()
    return clubs


@router.get("/{club_id}", response_model=ClubResponse)
def get_club(club_id: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club


@router.post("/", response_model=ClubResponse)
def create_club(club: ClubCreate, db: Session = Depends(get_db)):
    db_club = Club(**club.dict())
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    return db_club


@router.post("/seed")
def seed_clubs(db: Session = Depends(get_db)):
    # Check if clubs already exist
    existing = db.query(Club).first()
    if existing:
        return {"message": "Clubs already exist", "clubs": db.query(Club).all()}
    
    # Create EPIC TENNIS ACADEMY
    club = Club(
        name="EPIC TENNIS ACADEMY",
        description="Professional tennis training for beginners and advanced players",
        location="Nairobi, Kenya",
        email="johnmakumi106@gmail.com",
        phone="0724565388",
        price_range="1500 KES/hour",
        skill_level="beginners"
    )
    db.add(club)
    db.commit()
    db.refresh(club)
    
    # Create sample courts for the academy
    court1 = Court(
        name="Court 1 - Hard Court",
        court_type=CourtType.HARD,
        location="EPIC TENNIS ACADEMY",
        description="Professional hard court for training",
        price_per_hour=1500.0,
        club_id=club.id
    )
    court2 = Court(
        name="Court 2 - Clay Court",
        court_type=CourtType.CLAY,
        location="EPIC TENNIS ACADEMY",
        description="Clay court for advanced training",
        price_per_hour=2000.0,
        club_id=club.id
    )
    db.add(court1)
    db.add(court2)
    db.commit()
    
    return {
        "message": "EPIC TENNIS ACADEMY created successfully",
        "club": club,
        "courts": [court1, court2]
    }
