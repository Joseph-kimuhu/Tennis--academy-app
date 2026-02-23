from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from .models import UserRole, SkillLevel, CourtType, BookingStatus, TournamentStatus, TournamentFormat, MatchStatus


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.PLAYER
    skill_level: SkillLevel = SkillLevel.BEGINNER


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    skill_level: Optional[SkillLevel] = None
    profile_picture: Optional[str] = None


class UserResponse(UserBase):
    id: int
    profile_picture: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    ranking_points: int
    matches_played: int
    wins: int
    losses: int
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    role: UserRole
    skill_level: SkillLevel
    profile_picture: Optional[str] = None
    ranking_points: int
    matches_played: int
    wins: int
    losses: int

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Court Schemas
class CourtBase(BaseModel):
    name: str
    court_type: CourtType = CourtType.HARD
    location: Optional[str] = None
    description: Optional[str] = None
    price_per_hour: float = 0.0
    is_indoor: bool = False
    image_url: Optional[str] = None


class CourtCreate(CourtBase):
    pass


class CourtUpdate(BaseModel):
    name: Optional[str] = None
    court_type: Optional[CourtType] = None
    location: Optional[str] = None
    description: Optional[str] = None
    price_per_hour: Optional[float] = None
    is_available: Optional[bool] = None
    is_indoor: Optional[bool] = None
    image_url: Optional[str] = None


class CourtResponse(CourtBase):
    id: int
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CourtAvailability(BaseModel):
    date: datetime
    available_slots: List[str]


# Booking Schemas
class BookingBase(BaseModel):
    court_id: int
    booking_date: datetime
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    booking_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[BookingStatus] = None
    notes: Optional[str] = None


class BookingResponse(BookingBase):
    id: int
    user_id: int
    player_id: Optional[int] = None
    status: BookingStatus
    total_price: float
    payment_status: str
    payment_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BookingWithCourt(BookingResponse):
    court: CourtResponse

    class Config:
        from_attributes = True


# Tournament Schemas
class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    tournament_type: TournamentFormat = TournamentFormat.KNOCKOUT
    start_date: datetime
    end_date: datetime
    registration_deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    entry_fee: float = 0.0
    prize_money: float = 0.0
    winner_points: int = 50


class TournamentCreate(TournamentBase):
    pass


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tournament_type: Optional[TournamentFormat] = None
    status: Optional[TournamentStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    entry_fee: Optional[float] = None
    prize_money: Optional[float] = None
    winner_points: Optional[int] = None


class TournamentResponse(TournamentBase):
    id: int
    status: TournamentStatus
    organizer_id: Optional[int] = None
    created_at: datetime
    participant_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Tournament Participant Schemas (moved before TournamentWithParticipants)
class TournamentParticipantBase(BaseModel):
    tournament_id: int
    seed_number: Optional[int] = None


class TournamentParticipantCreate(TournamentParticipantBase):
    pass


class TournamentParticipantResponse(BaseModel):
    id: int
    user_id: int
    seed_number: Optional[int] = None
    is_eliminated: bool
    points_earned: int
    matches_won: int
    matches_lost: int

    class Config:
        from_attributes = True


class TournamentParticipantWithUser(TournamentParticipantResponse):
    user: Optional['UserPublic'] = None

    class Config:
        from_attributes = True


class TournamentWithParticipants(TournamentResponse):
    participants: List[TournamentParticipantResponse] = []

    class Config:
        from_attributes = True


# Match Schemas
class MatchBase(BaseModel):
    tournament_id: Optional[int] = None
    player1_id: int
    player2_id: int
    court_id: Optional[int] = None
    round_number: int = 1
    match_number: Optional[int] = None
    scheduled_time: Optional[datetime] = None


class MatchCreate(MatchBase):
    pass


class MatchUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    status: Optional[MatchStatus] = None
    player1_score: Optional[str] = None
    player2_score: Optional[str] = None
    winner_id: Optional[int] = None
    notes: Optional[str] = None


class MatchResponse(MatchBase):
    id: int
    status: MatchStatus
    player1_score: str
    player2_score: str
    winner_id: Optional[int] = None
    winner_points_earned: int
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MatchWithPlayers(MatchResponse):
    player1: UserPublic
    player2: UserPublic
    winner: Optional[UserPublic] = None
    court: Optional[CourtResponse] = None

    class Config:
        from_attributes = True


# Coaching Session Schemas
class CoachingSessionBase(BaseModel):
    player_id: int
    title: str
    description: Optional[str] = None
    scheduled_date: datetime
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None


class CoachingSessionCreate(CoachingSessionBase):
    pass


class CoachingSessionUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class CoachingSessionResponse(CoachingSessionBase):
    id: int
    coach_id: int
    price: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CoachingSessionWithCoach(CoachingSessionResponse):
    coach: UserPublic

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentBase(BaseModel):
    amount: float
    currency: str = "USD"
    payment_method: Optional[str] = None
    description: Optional[str] = None


class PaymentCreate(PaymentBase):
    booking_id: Optional[int] = None
    tournament_id: Optional[int] = None
    coaching_session_id: Optional[int] = None


class PaymentResponse(PaymentBase):
    id: int
    user_id: int
    booking_id: Optional[int] = None
    tournament_id: Optional[int] = None
    coaching_session_id: Optional[int] = None
    payment_status: str
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Ranking Schemas
class LeaderboardEntry(BaseModel):
    rank: int
    user: UserPublic
    ranking_points: int
    matches_played: int
    wins: int
    losses: int
    win_rate: float


# Stats Schemas
class PlayerStats(BaseModel):
    user: UserPublic
    total_matches: int
    wins: int
    losses: int
    win_rate: float
    ranking_points: int
    recent_performance: List[str] = []


# Dashboard Schemas
class AdminDashboard(BaseModel):
    total_users: int
    total_courts: int
    total_bookings: int
    active_tournaments: int
    total_revenue: float
    recent_bookings: List[BookingResponse] = []
    recent_registrations: List[UserResponse] = []


class PlayerDashboard(BaseModel):
    upcoming_bookings: List[BookingWithCourt] = []
    recent_matches: List[MatchWithPlayers] = []
    ranking_position: int
    stats: PlayerStats


# Club Schemas
class ClubBase(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    price_range: Optional[str] = None
    skill_level: Optional[str] = None
    image_url: Optional[str] = None


class ClubCreate(ClubBase):
    pass


class ClubResponse(ClubBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Message Schemas
class MessageBase(BaseModel):
    receiver_id: int
    subject: str
    content: str
    message_type: str = "general"


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: int
    sender_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MessageWithUser(MessageResponse):
    sender: Optional['UserPublic'] = None
    receiver: Optional['UserPublic'] = None

    class Config:
        from_attributes = True


# Player Statistics Schemas
class PlayerStatisticsBase(BaseModel):
    serves: int = 0
    aces: int = 0
    double_faults: int = 0
    first_serve_percentage: float = 0.0
    second_serve_points_won: int = 0
    break_points_saved: int = 0
    break_points_faced: int = 0
    total_games: int = 0
    total_sets: int = 0
    total_matches: int = 0
    winning_streak: int = 0
    losing_streak: int = 0
    longest_win_streak: int = 0
    longest_lose_streak: int = 0
    coach_notes: Optional[str] = None


class PlayerStatisticsCreate(PlayerStatisticsBase):
    player_id: int


class PlayerStatisticsUpdate(BaseModel):
    serves: Optional[int] = None
    aces: Optional[int] = None
    double_faults: Optional[int] = None
    first_serve_percentage: Optional[float] = None
    second_serve_points_won: Optional[int] = None
    break_points_saved: Optional[int] = None
    break_points_faced: Optional[int] = None
    total_games: Optional[int] = None
    total_sets: Optional[int] = None
    total_matches: Optional[int] = None
    winning_streak: Optional[int] = None
    losing_streak: Optional[int] = None
    longest_win_streak: Optional[int] = None
    longest_lose_streak: Optional[int] = None
    coach_notes: Optional[str] = None


class PlayerStatisticsResponse(PlayerStatisticsBase):
    id: int
    player_id: int
    last_updated: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PlayerStatisticsWithPlayer(PlayerStatisticsResponse):
    player: Optional['UserPublic'] = None

    class Config:
        from_attributes = True


# Coach Panel Schemas
class CoachDashboard(BaseModel):
    total_players: int
    pending_messages: int
    upcoming_sessions: int
    recent_performance: dict = {}
