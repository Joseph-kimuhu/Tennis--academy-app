#!/usr/bin/env python3
"""Render seed script to create default admin and coach accounts"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.append('/opt/render/project/backend')

from app.models import User, UserRole, Base
from app.auth import get_password_hash
from app.database import DATABASE_URL

def seed_users():
    """Create default admin and coach users"""
    
    # Create database connection
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if coach already exists
        coach_email = "johnmakumi106@gmail.com"
        existing_coach = db.query(User).filter(User.email == coach_email).first()
        
        if existing_coach:
            print(f"✅ Coach with email {coach_email} already exists!")
            print(f"   Username: {existing_coach.username}")
            print(f"   Role: {existing_coach.role}")
        else:
            # Create default coach
            coach = User(
                email=coach_email,
                username="JohnMakumi",
                full_name="John Makumi",
                hashed_password=get_password_hash("john1234"),
                role=UserRole.COACH,
                is_active=True,
                is_verified=True
            )
            db.add(coach)
            db.commit()
            db.refresh(coach)
            print(f"✅ Coach account created successfully!")
            print(f"   Email: {coach_email}")
            print(f"   Password: john1234")
            print(f"   Username: JohnMakumi")

        # Also create an admin account
        admin_email = "admin@tennis.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if existing_admin:
            print(f"✅ Admin with email {admin_email} already exists!")
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
            print(f"✅ Admin account created successfully!")
            print(f"   Email: {admin_email}")
            print(f"   Password: admin123")
            print(f"   Username: Admin")

        print("\n🎾 === LOGIN DETAILS === 🎾")
        print("🏆 COACH LOGIN:")
        print("   Email: johnmakumi106@gmail.com")
        print("   Password: john1234")
        print("\n⚙️ ADMIN LOGIN:")
        print("   Email: admin@tennis.com")
        print("   Password: admin123")
        print("\n✨ Seeding completed successfully! ✨")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Starting user seeding for EPIC TENNIS ACADEMY...")
    seed_users()
