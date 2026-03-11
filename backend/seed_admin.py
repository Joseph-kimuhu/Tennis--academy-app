#!/usr/bin/env python3
"""
Manual seeding script for creating initial admin and coach accounts.
Run this only once for initial setup: python seed_admin.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, create_tables
from app.models import User, UserRole
from app.security import get_password_hash
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_initial_accounts():
    """Create initial admin and coach accounts manually"""
    logger.info("==> 🎾 Creating initial staff accounts...")
    
    db = SessionLocal()
    try:
        # Create tables if they don't exist
        create_tables()
        
        # Check if any admin exists
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if existing_admin:
            logger.warning(f"==> ⚠️  Admin account already exists: {existing_admin.email}")
            logger.info("==> 🛡️  Skipping seeding - use staff registration instead")
            return
        
        # Create admin account
        logger.info("==> ➕ Creating admin account...")
        admin = User(
            email="admin@tennis.com",
            username="admin",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        logger.info(f"==> ✅ Admin account created: admin@tennis.com (ID: {admin.id})")
        logger.info("==> 🔑 Login credentials: admin@tennis.com / admin123")
        logger.info("==> 🎯 You can now use this admin to create other staff accounts")
        
    except Exception as e:
        logger.error(f"==> ❌ Error creating accounts: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("==> 🚀 Running manual seed script...")
    logger.info("==> ⚠️  This should only be run once for initial setup!")
    
    response = input("==> 🤔 Are you sure you want to create initial admin account? (y/N): ")
    if response.lower() == 'y':
        create_initial_accounts()
        logger.info("==> ✅ Manual seeding completed!")
    else:
        logger.info("==> ❌ Seeding cancelled by user")
