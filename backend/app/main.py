from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routes import auth, users, courts, bookings, tournaments, matches, coaching, admin, clubs, coach_panel

# Create database tables (only when running, not on import)
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    # Database not available - this is OK for development
    pass

app = FastAPI(
    title="Lawn Tennis Application API",
    description="API for managing tennis courts, bookings, tournaments, and players",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
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
