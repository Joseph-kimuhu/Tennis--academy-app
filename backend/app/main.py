import logging
import sys
import os
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
import uuid
from .database import engine, Base, SessionLocal, get_db
from .models import User, UserRole
from .routes import auth, users, bookings, tournaments, courts, clubs, staff, admin, coach_panel, coaching, matches
from .auth import get_password_hash

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

logger.info("==> Starting Tennis Academy Application...")
# Check for .python-version file and log it exactly like Render does
python_version_file = os.path.join(os.path.dirname(__file__), '..', '.python-version')
if os.path.exists(python_version_file):
    with open(python_version_file, 'r') as f:
        version = f.read().strip()
    logger.info(f"==> Using Python version {version} via {os.path.abspath(python_version_file)}")
logger.info(f"==> Docs on specifying a Python version: https://render.com/docs/python-version")
logger.info(f"==> Environment: {settings.ENVIRONMENT if hasattr(settings, 'ENVIRONMENT') else 'production'}")

# Create database tables (only when running, not on import)
# Base.metadata.create_all() is SAFE - it only creates missing tables, never deletes existing data
try:
    logger.info("==> Connecting to database...")
    Base.metadata.create_all(bind=engine)
    logger.info("==> ✅ Database tables ready - existing tables and data are protected")
    logger.info("==> 🛡️  Tables are only created if they don't exist - no data deletion")
except Exception as e:
    logger.warning(f"==> Database initialization skipped: {str(e)}")
    logger.warning("==> ⚠️  This may affect app functionality - check database connection")

logger.info("==> Initializing FastAPI application...")
app = FastAPI(
    title="Lawn Tennis Application API",
    description="API for managing tennis courts, bookings, tournaments, and players",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
logger.info("==> FastAPI application initialized")

# Configure CORS
logger.info("==> Configuring CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("==> CORS middleware configured")

# Mount static files for uploaded images
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
logger.info("==> Static files mounted for /uploads")

# Include routers
logger.info("==> Registering API routes...")
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courts.router)
app.include_router(bookings.router)
app.include_router(tournaments.router)
app.include_router(clubs.router)
app.include_router(staff.router)
app.include_router(admin.router)
app.include_router(coach_panel.router)
app.include_router(coaching.router)
app.include_router(matches.router)
logger.info("==> All routes registered successfully")


def seed_default_users():
    """Create default admin and coach users if they don't exist - NEVER deletes existing users"""
    db = SessionLocal()
    try:
        logger.info("==> 🔄 Checking default users...")
        
        # Check if coach already exists
        coach_email = "coach@tennis.com"
        existing_coach = db.query(User).filter(User.email == coach_email).first()
        
        if not existing_coach:
            logger.info("==> ➕ Creating new coach account...")
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
            logger.info(f"==> ✅ Coach account created: {coach_email} (ID: {coach.id})")
        else:
            logger.info(f"==> ✅ Coach account already exists: {coach_email} (ID: {existing_coach.id}, Role: {existing_coach.role})")
            # Ensure existing coach is still active and verified
            if not existing_coach.is_active or not existing_coach.is_verified:
                existing_coach.is_active = True
                existing_coach.is_verified = True
                db.commit()
                logger.info("==> 🔧 Updated existing coach account to be active and verified")

        # Check if admin already exists
        admin_email = "admin@tennis.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if not existing_admin:
            logger.info("==> ➕ Creating new admin account...")
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
            logger.info(f"==> ✅ Admin account created: {admin_email} (ID: {admin.id})")
        else:
            logger.info(f"==> ✅ Admin account already exists: {admin_email} (ID: {existing_admin.id}, Role: {existing_admin.role})")
            # Ensure existing admin is still active and verified
            if not existing_admin.is_active or not existing_admin.is_verified:
                existing_admin.is_active = True
                existing_admin.is_verified = True
                db.commit()
                logger.info("==> 🔧 Updated existing admin account to be active and verified")

        # Count total users to verify data integrity
        total_users = db.query(User).count()
        admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
        coach_count = db.query(User).filter(User.role == UserRole.COACH).count()
        
        logger.info("==> 🎾 Default users seeding completed!")
        logger.info(f"==> 📊 Database stats: {total_users} total users, {admin_count} admins, {coach_count} coaches")
        logger.info("==> 🏆 Coach: coach@tennis.com / coach123")
        logger.info("==> ⚙️ Admin: admin@tennis.com / admin123")
        logger.info("==> 🛡️  User data is protected and will persist across restarts")
        
    except Exception as e:
        logger.error(f"==> ❌ Error seeding users: {e}")
        db.rollback()
        # Don't re-raise the exception to prevent app startup failure
        logger.info("==> ⚠️  App will continue starting despite seeding error")
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    """Initialize application startup"""
    logger.info("==> 🎾 Starting Tennis Academy Application...")
    
    # Database tables already created at module level
    # Seeding disabled - admins and coaches will create their own accounts
    logger.info("==> 🛡️  Automatic seeding disabled - staff will create accounts manually")
    
    logger.info("==> Application startup complete")
    logger.info("==> Server is ready to accept connections")

@app.get("/")
def root():
    return {
        "message": "Welcome to Lawn Tennis Application API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/upload/court-image")
async def upload_court_image(file: UploadFile = File(...)):
    """Upload court image and return URL"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Validate file size (5MB limit)
        max_size = 5 * 1024 * 1024  # 5MB
        file_content = await file.read()
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )
        
        # Create uploads directory if it doesn't exist
        uploads_dir = "uploads/courts"
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(uploads_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Return the URL (adjust based on your hosting setup)
        image_url = f"/uploads/courts/{unique_filename}"
        
        return {"image_url": image_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image"
        )
