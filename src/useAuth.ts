// useAuth.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('email');
    const expiry = localStorage.getItem('expiry');

    if (!email || Date.now() > Number(expiry)) {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);
};

export default useAuth;
