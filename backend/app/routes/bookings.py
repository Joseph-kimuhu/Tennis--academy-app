from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Booking, BookingStatus, Court, User, UserRole
from ..schemas import BookingCreate, BookingUpdate, BookingResponse, BookingWithCourt
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.get("/", response_model=List[BookingWithCourt])
def get_bookings(
    skip: int = 0,
    limit: int = 20,
    user_id: int = None,
    status: BookingStatus = None,
    start_date: datetime = None,
    end_date: datetime = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    
    # Regular users can only see their own bookings
    if current_user.role == UserRole.PLAYER:
        query = query.filter(Booking.user_id == current_user.id)
    elif user_id:
        query = query.filter(Booking.user_id == user_id)
    
    if status:
        query = query.filter(Booking.status == status)
    if start_date:
        query = query.filter(Booking.start_time >= start_date)
    if end_date:
        query = query.filter(Booking.end_time <= end_date)
    
    bookings = query.order_by(Booking.start_time.desc()).offset(skip).limit(limit).all()
    return bookings


@router.get("/my-bookings", response_model=List[BookingWithCourt])
def get_my_bookings(
    skip: int = 0,
    limit: int = 20,
    upcoming: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booking).filter(Booking.user_id == current_user.id)
    
    if upcoming:
        query = query.filter(
            Booking.start_time >= datetime.now(),
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
        )
    
    bookings = query.order_by(Booking.start_time.desc()).offset(skip).limit(limit).all()
    return bookings


@router.get("/{booking_id}", response_model=BookingWithCourt)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check ownership for non-admin users
    if current_user.role == UserRole.PLAYER and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this booking"
        )
    
    return booking


@router.post("/", response_model=BookingResponse)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if court exists
    court = db.query(Court).filter(Court.id == booking_data.court_id).first()
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found"
        )
    
    if not court.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Court is not available"
        )
    
    # Check for double booking
    existing_booking = db.query(Booking).filter(
        Booking.court_id == booking_data.court_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
        Booking.start_time < booking_data.end_time,
        Booking.end_time > booking_data.start_time
    ).first()
    
    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is already booked"
        )
    
    # Calculate total price
    duration = (booking_data.end_time - booking_data.start_time).total_seconds() / 3600
    total_price = duration * court.price_per_hour
    
    new_booking = Booking(
        user_id=current_user.id,
        player_id=current_user.id,
        court_id=booking_data.court_id,
        booking_date=booking_data.booking_date,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        total_price=total_price,
        notes=booking_data.notes,
        status=BookingStatus.PENDING
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return new_booking


@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    booking_data: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check ownership or admin
    if current_user.role != UserRole.ADMIN and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this booking"
        )
    
    for key, value in booking_data.model_dump(exclude_unset=True).items():
        setattr(booking, key, value)
    
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.COACH])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    booking.status = BookingStatus.CONFIRMED
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check ownership or admin
    if current_user.role != UserRole.ADMIN and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking"
        )
    
    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return booking


@router.delete("/{booking_id}")
def delete_booking(
    booking_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    db.delete(booking)
    db.commit()
    return {"message": "Booking deleted successfully"}
