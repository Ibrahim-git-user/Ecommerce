import { useState } from 'react'
import Catalog from './Catalog'
import './App.css'

const ROLE_MAPPING = {
  staff: 0,
  customer: 1,
  seller: 2,
  superuser: 3,
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [userRole, setUserRole] = useState('customer')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !email || !password || !confirmPassword || !phoneNumber) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/auth/user/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          phone_number: phoneNumber,
          role: ROLE_MAPPING[userRole],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Signup failed')
      }

      setError('')
      // Signup successful, switch to login form and show prompt
      setSuccessMessage('Signup successful. Please log in to continue.')
      setIsSignup(false)
      setUsername('')
      setPhoneNumber('')
      setUserRole('customer')
      setPassword('')
      setConfirmPassword('')
      // Email remains for convenience on login form
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!username || !password) {
      setError('Username and password are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/auth/user/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setIsLoggedIn(true)
      setUsername('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setPhoneNumber('')
    setUserRole('customer')
    setError('')
  }

  if (isLoggedIn) {
    return (
      <div>
        <button
          onClick={handleLogout}
          className="logout-button"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '8px 16px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 1000,
          }}
        >
          Logout
        </button>
        <Catalog />
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isSignup ? 'Create Account' : 'Login'}</h2>

        {error && <div className="auth-error">{error}</div>}
        {successMessage && (
          <div className="auth-success">{successMessage}</div>
        )}

        <form onSubmit={isSignup ? handleSignup : handleLogin}>
          {isSignup && (
            <>
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number:</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="userRole">User Role:</label>
                <select
                  id="userRole"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  required
                >
                  <option value="customer">Customer</option>
                  <option value="seller">Seller</option>
                  <option value="staff">Staff</option>
                  <option value="superuser">Superuser</option>
                </select>
              </div>
            </>
          )}

          {!isSignup && (
            <div className="form-group">
              <label htmlFor="loginUsername">Username:</label>
              <input
                id="loginUsername"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? 'Processing...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isSignup
              ? 'Already have an account? '
              : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                setError('')
                setSuccessMessage('')
                setUsername('')
                setEmail('')
                setPassword('')
                setConfirmPassword('')
                setPhoneNumber('')
                setUserRole('customer')
              }}
              className="toggle-btn"
            >
              {isSignup ? 'Login here' : 'Sign up here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
