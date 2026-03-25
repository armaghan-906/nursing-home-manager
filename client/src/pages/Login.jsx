import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiShield, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />
      
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <FiShield size={28} />
          </div>
          <h1>Oakwood Care</h1>
          <p>Resident Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <FiMail className="login-input-icon" />
            <input
              id="login-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="login-input-group">
            <FiLock className="login-input-icon" />
            <input
              id="login-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <FiArrowRight />}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo: admin@oakwood.care / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
