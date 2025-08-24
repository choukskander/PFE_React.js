import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://pfe-express-js-2.onrender.com';

const TwoFactorAuth = ({ email, tempToken }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/auth/2fa/verify`, { tempToken, code });
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data._id);

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });
      Toast.fire({
        icon: 'success',
        title: 'Vérification 2FA réussie !',
      });

      const user = response.data;
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'internaute') {
        navigate('/my-appointments/doctor');
      } else if (user.role === 'patient') {
        navigate('/my-appointments/patient');
      } else {
        navigate('/');
      }
    } catch (err) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });
      Toast.fire({
        icon: 'error',
        title: err.response?.data?.message || 'Erreur lors de la vérification du code 2FA.',
      });
      setError(err.response?.data?.message || 'Erreur lors de la vérification.');
    }
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    },
    card: {
      backgroundColor: '#fff',
      padding: '2.5rem',
      borderRadius: '15px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
      maxWidth: '400px',
      width: '100%',
    },
    title: {
      fontSize: '24px',
      marginBottom: '1.5rem',
      color: '#0a66c2',
      fontWeight: '600',
      textAlign: 'center',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    input: {
      width: '100%',
      padding: '0.9rem',
      borderRadius: '8px',
      border: '1px solid #dcdcdc',
      fontSize: '16px',
    },
    button: {
      background: 'linear-gradient(45deg, #0a66c2, #094c99)',
      color: '#fff',
      padding: '0.9rem',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    error: {
      color: '#dc3545',
      fontSize: '14px',
      marginTop: '0.5rem',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          <FontAwesomeIcon icon={faLock} className="me-2" />
          Vérification à deux facteurs
        </h2>
        <p className="text-center mb-4">
          Un code de vérification a été envoyé à {email}. Entrez-le ci-dessous.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Entrez le code 2FA"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={styles.input}
            required
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button}>Vérifier</button>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuth;