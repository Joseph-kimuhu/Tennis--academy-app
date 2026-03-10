# 🎾 John Tennis Academy

A comprehensive tennis academy management system built with React and FastAPI, featuring court bookings, tournaments, coaching sessions, and player rankings.

## Features

- **Court Booking System** - Reserve tennis courts with real-time availability
- **Tournament Management** - Create and manage tennis tournaments with brackets
- **Coaching Sessions** - Schedule and track coaching appointments
- **Player Leaderboard** - Ranking system based on performance and points
- **Match Tracking** - Record and view match results
- **Admin Dashboard** - Comprehensive management tools for academy staff
- **Coach Panel** - Dedicated interface for coaches to manage courts, sessions, and tournaments

## Tech Stack

**Frontend:**
- React 18
- React Router v6
- Tailwind CSS
- Axios

**Backend:**
- FastAPI
- SQLAlchemy ORM
- PostgreSQL
- Python 3.8+

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- PostgreSQL

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd lawn-tennis-app
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure Database**
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://user:password@localhost/tennis_academy
SECRET_KEY=your-secret-key-here
```

4. **Run Database Migrations**
```bash
# Initialize the database
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

5. **Frontend Setup**
```bash
cd ../frontend
npm install
```

### Running the Application

1. **Start Backend Server**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

2. **Start Frontend Development Server**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Default Credentials

**Player Account:**
- Email: joe@example.com
- Password: password123

**Coach Account:**
- Email: coach@example.com
- Password: password123

## Project Structure

```
lawn-tennis-app/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   ├── models.py        # Database models
│   │   ├── database.py      # Database configuration
│   │   └── main.py          # FastAPI application
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.jsx          # Main application
│   ├── public/
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### Courts
- `GET /courts` - List all courts
- `POST /courts` - Create new court (Coach/Admin)
- `PUT /courts/{id}` - Update court (Coach/Admin)
- `DELETE /courts/{id}` - Delete court (Coach/Admin)

### Bookings
- `GET /bookings` - List user bookings
- `POST /bookings` - Create booking
- `DELETE /bookings/{id}` - Cancel booking

### Tournaments
- `GET /tournaments` - List tournaments
- `POST /tournaments` - Create tournament (Coach/Admin)
- `GET /tournaments/{id}` - Get tournament details

### Coaching
- `GET /coaching/sessions` - List coaching sessions
- `POST /coaching/sessions` - Book coaching session

### Leaderboard
- `GET /users/leaderboard` - Get player rankings

## Design Theme

The application features a professional Wimbledon-inspired design with:
- Primary Color: Tennis Green (#006B3F)
- Clean, modern UI with Tailwind CSS
- Responsive design for all devices
- Glass-morphism effects and smooth animations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@johntennisacademy.com or open an issue in the repository.

## Deployment

### Deploying to Render

1. **Push your code to GitHub**

2. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Use the following settings:
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
     - **Environment**: Python 3.11.9

3. **Create a PostgreSQL Database on Render**
   - Note the Internal Database URL

4. **Set Environment Variables**
   - `DATABASE_URL`: Your Render PostgreSQL connection string
   - `SECRET_KEY`: Generate a secure random key
   - `FRONTEND_URL`: Your frontend deployment URL

5. **Deploy**
   - Render will automatically deploy your application
   - Database tables will be created on first run

Alternatively, use the included `render.yaml` for automatic configuration.
