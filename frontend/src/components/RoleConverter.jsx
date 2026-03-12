import React, { useState, useEffect } from 'react';
import api from '../services/api';

function RoleConverter() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const allUsers = await api.getAllUsers({ limit: 100 });
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const convertCoachesToAdmins = async () => {
    setLoading(true);
    setResults([]);
    
    const coaches = users.filter(user => user.role === 'coach');
    console.log('Found coaches:', coaches);
    
    for (const coach of coaches) {
      try {
        await api.updateUserRole(coach.id, 'admin');
        setResults(prev => [...prev, { user: coach.username, status: 'success', message: 'Converted to admin' }]);
        console.log(`✅ Successfully converted ${coach.username} to admin`);
      } catch (error) {
        setResults(prev => [...prev, { user: coach.username, status: 'error', message: error.message }]);
        console.error(`❌ Failed to convert ${coach.username}:`, error);
      }
    }
    
    setLoading(false);
    // Refresh users list
    await fetchUsers();
  };

  const coaches = users.filter(user => user.role === 'coach');
  const admins = users.filter(user => user.role === 'admin');

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Role Converter Tool</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Users</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <strong>Coaches ({coaches.length}):</strong>
            <ul>
              {coaches.map(coach => (
                <li key={coach.id}>{coach.username} ({coach.email})</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Admins ({admins.length}):</strong>
            <ul>
              {admins.map(admin => (
                <li key={admin.id}>{admin.username} ({admin.email})</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <button 
        onClick={convertCoachesToAdmins}
        disabled={loading || coaches.length === 0}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Converting...' : `Convert ${coaches.length} Coaches to Admins`}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Conversion Results:</h3>
          {results.map((result, index) => (
            <div 
              key={index}
              style={{
                padding: '5px 10px',
                margin: '5px 0',
                backgroundColor: result.status === 'success' ? '#d4edda' : '#f8d7da',
                borderRadius: '3px'
              }}
            >
              <strong>{result.user}:</strong> {result.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoleConverter;
