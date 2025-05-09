import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const allowedEmails = ['salah.othman.elhossiny@gmail.com'];

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: '#4b5563',
  },
  input: {
    width: '90%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '0.8rem',
    border: '1px solid #d1d5db',
    marginBottom: '1rem',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '0.8rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  },
};

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (allowedEmails.includes(email)) {
      const expiry = Date.now() + 8 * 60 * 60 * 1000;
      localStorage.setItem('email', email);
      localStorage.setItem('expiry', expiry.toString());
      navigate('/home');
    } else {
      alert('Email not allowed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2
        style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#1f2937',
        }}
        >
            Login
        </h2>
        <form onSubmit={handleLogin}>
          <label htmlFor="email" style={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;


