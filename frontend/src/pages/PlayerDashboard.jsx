import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Home() {
  const { isAuthenticated } = useAuth();
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [courts, setCourts] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tournamentsData, courtsData, clubsData] = await Promise.all([
        api.getActiveTournaments(),
        api.getCourts({ limit: 6 }),
        api.getClubs(),
      ]);

      setActiveTournaments(tournamentsData || []);
      setCourts(courtsData || []);
      setClubs(clubsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setLoading(false);
  };

  const features = [
    {
      icon: "🏟️",
      title: "Book Courts",
      description:
        "Find and book available tennis courts near you. Choose from clay, grass, or hard courts.",
    },
    {
      icon: "🏆",
      title: "Tournaments",
      description:
        "Compete in tournaments, climb the leaderboard, and prove you're the best.",
    },
    {
      icon: "📊",
      title: "Track Progress",
      description:
        "Monitor your wins, losses, and ranking points. Improve your game over time.",
    },
    {
      icon: "🎓",
      title: "Coaching",
      description:
        "Book sessions with professional coaches to improve your skills.",
    },
    {
      icon: "👥",
      title: "Community",
      description:
        "Connect with other tennis enthusiasts and find playing partners.",
    },
    {
      icon: "🎯",
      title: "Rankings",
      description:
        "Compete for the top spot in our global player rankings.",
    },
  ];

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <div className="relative overflow-hidden">

        <div className="absolute inset-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://i.pinimg.com/736x/b1/bc/2d/b1bc2d2ecf3a945b9c325131f42336ac.jpg)",
            }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-32 text-center">

          <div className="text-6xl mb-6">🎾</div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            {clubs.length > 0 ? clubs[0].name : "Play Tennis Like a Pro"}
          </h1>

          <p className="text-xl text-white mb-10 max-w-2xl mx-auto">
            Book courts, join tournaments, track your progress, and compete with
            players worldwide
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">

            <Link
              to="/courts"
              className="bg-white text-green-800 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition"
            >
              Book a Court →
            </Link>

            <Link
              to="/tournaments"
              className="bg-green-700 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition"
            >
              Join Tournament
            </Link>

          </div>
        </div>
      </div>

      {/* FEATURES */}

      <div className="py-24 bg-gray-50">

        <div className="max-w-7xl mx-auto px-4">

          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to Play
            </h2>
            <p className="text-xl text-gray-600">
              From booking courts to tracking your progress
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>

                <h3 className="text-xl font-bold mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* COURTS */}

      {courts.length > 0 && (
        <div className="py-24 bg-white">

          <div className="max-w-7xl mx-auto px-4">

            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-bold">Available Courts</h2>

              <Link
                to="/courts"
                className="border px-6 py-2 rounded-lg"
              >
                View All
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

              {courts.map((court) => (
                <div key={court.id} className="bg-white rounded-xl shadow">

                  <div className="h-40 flex items-center justify-center text-5xl bg-green-700 text-white">
                    🎾
                  </div>

                  <div className="p-6">

                    <h3 className="text-xl font-bold mb-2">
                      {court.name}
                    </h3>

                    <p className="text-gray-600 mb-4">
                      {court.location}
                    </p>

                    <div className="flex justify-between items-center">

                      <span className="font-bold text-green-700">
                        {court.price_per_hour} KES / hour
                      </span>

                      <Link
                        to="/courts"
                        className="bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Book
                      </Link>

                    </div>
                  </div>

                </div>
              ))}

            </div>
          </div>
        </div>
      )}

      {/* CTA */}

      {!isAuthenticated && (
        <div className="py-24 text-center bg-white">

          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Tennis Journey?
          </h2>

          <p className="text-gray-600 mb-10">
            Join our community and improve your game
          </p>

          <div className="flex justify-center gap-4">

            <Link
              to="/register"
              className="bg-green-700 text-white px-10 py-4 rounded-xl"
            >
              Create Free Account 🎾
            </Link>

            <Link
              to="/courts"
              className="border px-10 py-4 rounded-xl"
            >
              Explore Courts
            </Link>

          </div>
        </div>
      )}

      {/* FOOTER */}

      <footer className="bg-white py-10 text-center border-t">

        <p>
          © {new Date().getFullYear()}{" "}
          {clubs.length > 0 ? clubs[0].name : "Tennis Court"}
        </p>

      </footer>

    </div>
  );
}

export default Home;

