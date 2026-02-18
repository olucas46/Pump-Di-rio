
import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import UserDashboard from './components/UserDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('pump_currentUser');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleLogin = (username: string) => {
    setUser(username);
    localStorage.setItem('pump_currentUser', username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pump_currentUser');
    // Also clear selection preference so next user starts fresh
    localStorage.removeItem('lastSelectedPlanId'); 
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <UserDashboard currentUser={user} onLogout={handleLogout} />
  );
};

export default App;
