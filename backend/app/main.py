import logging
import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routes import auth, users, courts, bookings, tournaments, matches, coaching, admin, clubs, coach_panel

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
try:
    logger.info("==> Connecting to database...")
    Base.metadata.create_all(bind=engine)
    logger.info("==> Database tables created successfully")
except Exception as e:
    logger.warning(f"==> Database initialization skipped: {str(e)}")

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
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("==> CORS middleware configured")

# Include routers
logger.info("==> Registering API routes...")
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courts.router)
app.include_router(bookings.router)
app.include_router(tournaments.router)
app.include_router(matches.router)
app.include_router(coaching.router)
app.include_router(admin.router)
app.include_router(clubs.router)
app.include_router(coach_panel.router)
logger.info("==> All routes registered successfully")


@app.on_event("startup")
async def startup_event():
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
