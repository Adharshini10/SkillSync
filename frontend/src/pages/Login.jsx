import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successNotice, setSuccessNotice] = useState(
    location.state?.registeredEmail ? 'Account registered successfully! Please log in.' : ''
  );
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email or user ID.';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter your password.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Password reset link has been simulated. Check with your SkillSync campus administrator or re-register your account!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessNotice('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      login(data.token, {
        id: data.id,
        name: data.name,
        email: data.email,
      });

      navigate('/dashboard');
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setServerError('Invalid email or password.');
        } else if (err.response.data && err.response.data.message) {
          setServerError(err.response.data.message);
        } else {
          setServerError('Login failed. Please check your credentials.');
        }
      } else {
        setServerError('Unable to connect to the backend server. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back!"
      subtitle="Sign in to continue your journey."
      mode="login"
      footer={
        <p className="auth-switch-text">
          Don't have an account?{' '}
          <Link to="/register" className="auth-switch-link" id="auth-signup-link">
            Sign up
          </Link>
        </p>
      }
    >
      {successNotice && <div className="auth-alert auth-alert-success">{successNotice}</div>}
      {serverError && <div className="auth-alert auth-alert-danger">{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate className="auth-form-elements">
        {/* Email or User ID Input */}
        <div className="auth-input-group">
          <div className={`auth-input-wrapper ${errors.email ? 'has-error' : ''}`}>
            <span className="auth-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            </span>
            <input
              id="email"
              type="text"
              name="email"
              placeholder="Email or User ID"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="username"
              className="auth-input-field"
            />
          </div>
          {errors.email && <span className="auth-error-msg">{errors.email}</span>}
        </div>

        {/* Password Input with show/hide toggle */}
        <div className="auth-input-group">
          <div className={`auth-input-wrapper ${errors.password ? 'has-error' : ''}`}>
            <span className="auth-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
              className="auth-input-field"
            />
            <button
              type="button"
              className="auth-eye-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          {errors.password && <span className="auth-error-msg">{errors.password}</span>}
        </div>

        {/* Remember me & Forgot Password */}
        <div className="auth-options-row">
          <label className="auth-remember-label">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="auth-checkbox"
            />
            <span>Remember me</span>
          </label>
          <a
            href="#forgot"
            onClick={handleForgotPassword}
            className="auth-forgot-link"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-auth-primary"
          disabled={loading}
          id="btn-login-submit"
        >
          {loading ? (
            <span className="auth-btn-content">
              <span className="auth-spinner"></span>
              <span>Signing in...</span>
            </span>
          ) : (
            <span className="auth-btn-content">
              <span>Login</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
