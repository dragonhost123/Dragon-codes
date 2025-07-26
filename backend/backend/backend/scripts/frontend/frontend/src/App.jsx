import React, { useState, useEffect } from 'react';
import axios from 'axios';

const nebulaStyle = {
  background: 'radial-gradient(circle at center, #0f2027, #203a43, #2c5364)',
  height: '100vh',
  color: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  flexDirection: 'column',
  textAlign: 'center',
  padding: 20,
};

const inputStyle = {
  padding: '10px',
  margin: '8px 0',
  borderRadius: '5px',
  border: 'none',
  width: '250px',
};

const buttonStyle = {
  padding: '10px 20px',
  marginTop: '15px',
  borderRadius: '5px',
  border: 'none',
  backgroundColor: '#4a90e2',
  color: '#fff',
  cursor: 'pointer',
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newNode, setNewNode] = useState({ name: '', location: '', fqdn: '' });
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:3001/api/me', { headers: { Authorization: 'Bearer ' + token } })
        .then(res => setUser(res.data))
        .catch(() => { setToken(''); localStorage.removeItem('token'); });

      loadNodes();
      loadLocations();
    }
  }, [token]);

  const loadNodes = () => {
    axios.get('http://localhost:3001/api/nodes', { headers: { Authorization: 'Bearer ' + token } })
      .then(res => setNodes(res.data));
  };

  const loadLocations = () => {
    axios.get('http://localhost:3001/api/locations', { headers: { Authorization: 'Bearer ' + token } })
      .then(res => setLocations(res.data));
  };

  const login = () => {
    axios.post('http://localhost:3001/api/login', { username, password })
      .then(res => {
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
      })
      .catch(() => alert('Login failed'));
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setUser(null);
  };

  const addNode = () => {
    if (!newNode.name || !newNode.location || !newNode.fqdn) return alert('Fill all node fields');
    axios.post('http://localhost:3001/api/nodes', newNode, { headers: { Authorization: 'Bearer ' + token } })
      .then(() => {
        setNewNode({ name: '', location: '', fqdn: '' });
        loadNodes();
      })
      .catch(() => alert('Add node failed'));
  };

  const addLocation = () => {
    if (!newLocation) return alert('Enter location name');
    axios.post('http://localhost:3001/api/locations', { name: newLocation }, { headers: { Authorization: 'Bearer ' + token } })
      .then(() => {
        setNewLocation('');
        loadLocations();
      })
      .catch(() => alert('Add location failed'));
  };

  if (!token) {
    return (
      <div style={nebulaStyle}>
        <h1>Dragon Panel Login</h1>
        <input
          style={inputStyle}
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button style={buttonStyle} onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ ...nebulaStyle, alignItems: 'flex-start', padding: 30 }}>
      <div style={{ width: '100%', maxWidth: 800, margin: 'auto' }}>
        <button onClick={logout} style={{ float: 'right', marginBottom: 10 }}>Logout</button>
        <h2>Welcome, {user?.firstname} {user?.lastname} ({user?.username})</h2>
        {user?.is_admin ? (
          <>
            <h3>Create Location</h3>
            <input
              style={inputStyle}
              placeholder="Location name"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
            />
            <button style={buttonStyle} onClick={addLocation}>Add Location</button>

            <h3>Create Node</h3>
            <input
              style={inputStyle}
              placeholder="Node name"
              value={newNode.name}
              onChange={e => setNewNode({ ...newNode, name: e.target.value })}
            />
            <input
              style={inputStyle}
              placeholder="Node location"
              value={newNode.location}
              onChange={e => setNewNode({ ...newNode, location: e.target.value })}
            />
            <input
              style={inputStyle}
              placeholder="Node FQDN"
              value={newNode.fqdn}
              onChange={e => setNewNode({ ...newNode, fqdn: e.target.value })}
            />
            <button style={buttonStyle} onClick={addNode}>Add Node</button>
          </>
        ) : (
          <p>You are not an admin.</p>
        )}

        <h3>Nodes List</h3>
        <ul>
          {nodes.map(node => (
            <li key={node.id}>
              <b>{node.name}</b> - Location: {node.location} - FQDN: {node.fqdn}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
