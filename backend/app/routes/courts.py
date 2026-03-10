from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Court, CourtType, Booking, BookingStatus, User, UserRole
from ..schemas import CourtCreate, CourtUpdate, CourtResponse, CourtAvailability
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/courts", tags=["Courts"])


@router.get("/", response_model=List[CourtResponse])
def get_courts(
    skip: int = 0,
    limit: int = 50,
    court_type: CourtType = None,
    is_indoor: bool = None,
    available_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Court)
    
    if court_type:
        query = query.filter(Court.court_type == court_type)
    if is_indoor is not None:
        query = query.filter(Court.is_indoor == is_indoor)
    if available_only:
        query = query.filter(Court.is_available == True)
    
    courts = query.offset(skip).limit(limit).all()
    return courts


@router.get("/{court_id}", response_model=CourtResponse)
def get_court(court_id: int, db: Session = Depends(get_db)):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found"
        )
    return court


@router.get("/{court_id}/availability", response_model=CourtAvailability)
def get_court_availability(
    court_id: int,
    date: datetime = Query(default=None),
    db: Session = Depends(get_db)
):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found"
        )
    
    if date is None:
        date = datetime.now()
    
    # Get start and end of day
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get bookings for the day
    bookings = db.query(Booking).filter(
        Booking.court_id == court_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
        Booking.start_time >= start_of_day,
        Booking.end_time <= end_of_day
    ).all()
    
    # Generate time slots (assuming 1-hour slots from 6 AM to 10 PM)
    booked_slots = set()
    for booking in bookings:
        hour = booking.start_time.hour
        booked_slots.add(f"{hour:02d}:00")
    
    all_slots = [f"{h:02d}:00" for h in range(6, 22)]
    available_slots = [slot for slot in all_slots if slot not in booked_slots]
    
    return {
        "date": date,
        "available_slots": available_slots
    }


@router.post("/", response_model=CourtResponse)
def create_court(
    court_data: CourtCreate,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    new_court = Court(**court_data.model_dump())
    db.add(new_court)
    db.commit()
    db.refresh(new_court)
    return new_court


@router.put("/{court_id}", response_model=CourtResponse)
def update_court(
    court_id: int,
    court_data: CourtUpdate,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found"
        )
    
    for key, value in court_data.model_dump(exclude_unset=True).items():
        setattr(court, key, value)
    
    db.commit()
    db.refresh(court)
    return court


@router.delete("/{court_id}")
def delete_court(
    court_id: int,
    current_user: User = Depends(require_role([UserRole.COACH, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found"
        )
    
    db.delete(court)
    db.commit()
    return {"message": "Court deleted successfully"}
