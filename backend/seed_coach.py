#!/usr/bin/env python3
"""Seed script to create a default coach account"""

from app.database import SessionLocal, engine, Base
from app.models import User, UserRole
from app.auth import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if coach already exists
coach_email = "coach@tennis.com"
existing_coach = db.query(User).filter(User.email == coach_email).first()

if existing_coach:
    print(f"Coach with email {coach_email} already exists!")
    print(f"Username: {existing_coach.username}")
    print(f"Role: {existing_coach.role}")
else:
    # Create default coach
    coach = User(
        email=coach_email,
        username="Coach",
        full_name="Tennis Coach",
        hashed_password=get_password_hash("coach123"),
        role=UserRole.COACH,
        is_active=True,
        is_verified=True
    )
    db.add(coach)
    db.commit()
    db.refresh(coach)
    print(f"Coach account created successfully!")
    print(f"Email: {coach_email}")
    print(f"Password: coach123")
    print(f"Username: Coach")

# Also create an admin account
admin_email = "admin@tennis.com"
existing_admin = db.query(User).filter(User.email == admin_email).first()

if existing_admin:
    print(f"\nAdmin with email {admin_email} already exists!")
else:
    admin = User(
        email=admin_email,
        username="Admin",
        full_name="System Administrator",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"\nAdmin account created successfully!")
    print(f"Email: {admin_email}")
    print(f"Password: admin123")
    print(f"Username: Admin")

db.close()
print("\n=== LOGIN DETAILS ===")
print("COACH LOGIN:")
print("  Email: coach@tennis.com")
print("  Password: coach123")
print("\nADMIN LOGIN:")
print("  Email: admin@tennis.com")
print("  Password: admin123")
