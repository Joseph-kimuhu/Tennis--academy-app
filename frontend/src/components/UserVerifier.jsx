import React, { useState, useEffect } from 'react';
import api from '../services/api';

function UserVerifier() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('johnmakumi106@gmail.com');

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

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      alert(`User role updated to ${newRole}`);
      fetchUsers(); // Refresh list
    } catch (error) {
      alert(`Failed to update role: ${error.message}`);
    }
  };

  const johnMakumi = users.filter(user => 
    user.email === 'johnmakumi106@gmail.com' || 
    user.username === 'johnmakumi'
  );

  const admins = users.filter(user => user.role === 'admin');
  const coaches = users.filter(user => user.role === 'coach');

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>User Verification & Role Management</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Search for John Makumi</h3>
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '300px' }}
        />
        <button onClick={fetchUsers} style={{ padding: '8px 16px' }}>
          Refresh Users
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h4>John Makumi Search Results ({johnMakumi.length})</h4>
          {johnMakumi.map(user => (
            <div key={user.id} style={{ 
              padding: '10px', 
              margin: '5px 0', 
              backgroundColor: '#e8f5e8',
              border: '1px solid #4caf50',
              borderRadius: '5px'
            }}>
              <strong>✅ Found John Makumi!</strong><br/>
              ID: {user.id}<br/>
              Username: {user.username}<br/>
              Email: {user.email}<br/>
              Role: {user.role}<br/>
              <button 
                onClick={() => updateUserRole(user.id, 'admin')}
                style={{ marginTop: '10px', padding: '5px 10px' }}
              >
                Set as Admin
              </button>
            </div>
          ))}
          {johnMakumi.length === 0 && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#ffebee',
              border: '1px solid #f44336',
              borderRadius: '5px'
            }}>
              ❌ John Makumi not found with email: {searchEmail}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h4>Current Admins ({admins.length})</h4>
          {admins.map(admin => (
            <div key={admin.id} style={{ 
              padding: '10px', 
              margin: '5px 0', 
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '5px'
            }}>
              <strong>{admin.username}</strong><br/>
              Email: {admin.email}<br/>
              Role: {admin.role}<br/>
              ID: {admin.id}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <h4>Current Coaches ({coaches.length})</h4>
          {coaches.map(coach => (
            <div key={coach.id} style={{ 
              padding: '10px', 
              margin: '5px 0', 
              backgroundColor: '#fff3e0',
              border: '1px solid #ff9800',
              borderRadius: '5px'
            }}>
              <strong>{coach.username}</strong><br/>
              Email: {coach.email}<br/>
              Role: {coach.role}<br/>
              ID: {coach.id}<br/>
              <button 
                onClick={() => updateUserRole(coach.id, 'admin')}
                style={{ marginTop: '10px', padding: '5px 10px' }}
              >
                Convert to Admin
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>All Users ({users.length})</h3>
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {users.map(user => (
            <div key={user.id} style={{ 
              padding: '8px', 
              margin: '2px 0', 
              backgroundColor: user.role === 'admin' ? '#e8f5e8' : 
                           user.role === 'coach' ? '#fff3e0' : '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '3px',
              fontSize: '12px'
            }}>
              <strong>{user.username}</strong> ({user.role}) - {user.email}
              {user.email === 'johnmakumi106@gmail.com' && <span style={{ color: 'red', fontWeight: 'bold' }}> ← JOHN!</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserVerifier;
