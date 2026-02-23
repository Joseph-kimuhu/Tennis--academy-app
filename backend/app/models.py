from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class UserRole(enum.Enum):
    PLAYER = "player"
    COACH = "coach"
    ADMIN = "admin"


class SkillLevel(enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CourtType(enum.Enum):
    HARD = "hard"
    CLAY = "clay"
    GRASS = "grass"
    SYNTHETIC = "synthetic"


class BookingStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class TournamentStatus(enum.Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TournamentFormat(enum.Enum):
    ROUND_ROBIN = "round_robin"
    KNOCKOUT = "knockout"
    LEAGUE = "league"


class MatchStatus(enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.PLAYER)
    skill_level = Column(Enum(SkillLevel), default=SkillLevel.BEGINNER)
    profile_picture = Column(String(500))
    phone = Column(String(20))
    bio = Column(Text)
    ranking_points = Column(Integer, default=0)
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Court(Base):
    __tablename__ = "courts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    court_type = Column(Enum(CourtType), default=CourtType.HARD)
    location = Column(String(255))
    description = Column(Text)
    price_per_hour = Column(Float, default=0.0)
    is_available = Column(Boolean, default=True)
    is_indoor = Column(Boolean, default=False)
    image_url = Column(String(500))
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    bookings = relationship("Booking", back_populates="court", lazy="dynamic")
    club = relationship("Club", back_populates="courts")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    player_id = Column(Integer, ForeignKey("users.id"))
    court_id = Column(Integer, ForeignKey("courts.id"))
    booking_date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    total_price = Column(Float, default=0.0)
    payment_status = Column(String(50), default="pending")
    payment_id = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="bookings_user")
    player = relationship("User", foreign_keys=[player_id], back_populates="bookings_player")
    court = relationship("Court", back_populates="bookings")


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    tournament_type = Column(Enum(TournamentFormat), default=TournamentFormat.KNOCKOUT)
    status = Column(Enum(TournamentStatus), default=TournamentStatus.UPCOMING)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    registration_deadline = Column(DateTime(timezone=True))
    max_participants = Column(Integer)
    entry_fee = Column(Float, default=0.0)
    prize_money = Column(Float, default=0.0)
    winner_points = Column(Integer, default=50)
    organizer_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    participants = relationship("TournamentParticipant", back_populates="tournament", lazy="dynamic")
    matches = relationship("Match", back_populates="tournament", lazy="dynamic")


class TournamentParticipant(Base):
    __tablename__ = "tournament_participants"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    seed_number = Column(Integer)
    is_eliminated = Column(Boolean, default=False)
    points_earned = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    matches_lost = Column(Integer, default=0)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tournament = relationship("Tournament", back_populates="participants")
    user = relationship("User", back_populates="tournament_participations")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    player1_id = Column(Integer, ForeignKey("users.id"))
    player2_id = Column(Integer, ForeignKey("users.id"))
    court_id = Column(Integer, ForeignKey("courts.id"))
    round_number = Column(Integer, default=1)
    match_number = Column(Integer)
    scheduled_time = Column(DateTime(timezone=True))
    status = Column(Enum(MatchStatus), default=MatchStatus.SCHEDULED)
    player1_score = Column(String(50), default="0")
    player2_score = Column(String(50), default="0")
    winner_id = Column(Integer, ForeignKey("users.id"))
    winner_points_earned = Column(Integer, default=10)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tournament = relationship("Tournament", back_populates="matches")
    player1 = relationship("User", foreign_keys=[player1_id], back_populates="matches_player1")
    player2 = relationship("User", foreign_keys=[player2_id], back_populates="matches_player2")
    winner = relationship("User", foreign_keys=[winner_id])
    court = relationship("Court")


# Add back User relationships after all classes are defined
User.bookings_user = relationship("Booking", back_populates="user", foreign_keys=[Booking.user_id], viewonly=True)
User.bookings_player = relationship("Booking", back_populates="player", foreign_keys=[Booking.player_id], viewonly=True)
User.tournament_participations = relationship("TournamentParticipant", back_populates="user", viewonly=True)
User.matches_player1 = relationship("Match", back_populates="player1", foreign_keys=[Match.player1_id], viewonly=True)
User.matches_player2 = relationship("Match", back_populates="player2", foreign_keys=[Match.player2_id], viewonly=True)


class CoachingSession(Base):
    __tablename__ = "coaching_sessions"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"))
    player_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    price = Column(Float, default=0.0)
    status = Column(String(50), default="scheduled")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    coach = relationship("User", foreign_keys=[coach_id], back_populates="coaching_sessions_coach")
    player = relationship("User", foreign_keys=[player_id], back_populates="coaching_sessions_player")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    coaching_session_id = Column(Integer, ForeignKey("coaching_sessions.id"))
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    payment_method = Column(String(50))
    payment_status = Column(String(50), default="pending")
    transaction_id = Column(String(255))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
    booking = relationship("Booking")


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(255))
    email = Column(String(255))
    phone = Column(String(20))
    price_range = Column(String(50))
    skill_level = Column(String(50))  # beginners, intermediate, advanced, all
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    courts = relationship("Court", back_populates="club")


# Add remaining User relationships
User.coaching_sessions_coach = relationship("CoachingSession", back_populates="coach", foreign_keys=[CoachingSession.coach_id], viewonly=True)
User.coaching_sessions_player = relationship("CoachingSession", back_populates="player", foreign_keys=[CoachingSession.player_id], viewonly=True)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="general")  # general, notification, game_reminder
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


class PlayerStatistics(Base):
    __tablename__ = "player_statistics"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("users.id"), unique=True)
    serves = Column(Integer, default=0)
    aces = Column(Integer, default=0)
    double_faults = Column(Integer, default=0)
    first_serve_percentage = Column(Float, default=0.0)
    second_serve_points_won = Column(Integer, default=0)
    break_points_saved = Column(Integer, default=0)
    break_points_faced = Column(Integer, default=0)
    total_games = Column(Integer, default=0)
    total_sets = Column(Integer, default=0)
    total_matches = Column(Integer, default=0)
    winning_streak = Column(Integer, default=0)
    losing_streak = Column(Integer, default=0)
    longest_win_streak = Column(Integer, default=0)
    longest_lose_streak = Column(Integer, default=0)
    coach_notes = Column(Text)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    player = relationship("User", back_populates="player_statistics")


# Add Message relationships to User
User.sent_messages = relationship("Message", back_populates="sender", foreign_keys=[Message.sender_id], viewonly=True)
User.received_messages = relationship("Message", back_populates="receiver", foreign_keys=[Message.receiver_id], viewonly=True)

# Add PlayerStatistics relationship to User
User.player_statistics = relationship("PlayerStatistics", back_populates="player", uselist=False)
