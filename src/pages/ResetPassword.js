import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Lottie from 'lottie-react';
import animationData from './Animation - 1742560736699.json'; // Assurez-vous d'importer la même animation que pour Login
import Navbar from './Navbar'; // Importez votre Navbar

const API_URL = process.env.REACT_APP_API_URL || 'https://pfe-express-js-2.onrender.com';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extraire le token des paramètres de requête
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Token de réinitialisation manquant.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Les mots de passe ne correspondent pas.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        newPassword,
      });

      Swal.fire({
        icon: 'success',
        title: 'Mot de passe réinitialisé',
        text: 'Votre mot de passe a été mis à jour avec succès.',
      }).then(() => {
        navigate('/login');
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response?.data?.message || "Une erreur s'est produite",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    pageContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      paddingTop: '80px',
    },
    contentContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '40px',
      width: '80%',
      maxWidth: '1200px',
    },
    animation: {
      width: '300px',
      height: '500px',
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
      fontSize: '28px',
      marginBottom: '2rem',
      color: '#0a66c2',
      fontWeight: '700',
      textAlign: 'center',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    label: {
      fontWeight: '600',
      color: '#1a1a1a',
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
      marginTop: '1rem',
    },
  };

  return (
    <div>
      <Navbar />
      <div style={styles.pageContainer}>
        <div style={styles.contentContainer}>
          <div>
            <Lottie animationData={animationData} style={styles.animation} />
          </div>
          <div style={styles.card}>
            <h1 style={styles.title}>Réinitialiser le mot de passe</h1>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label style={styles.label}>Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="Entrez votre nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                  required
                  minLength="6"
                />
              </div>
              <div>
                <label style={styles.label}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <button type="submit" style={styles.button} disabled={isLoading}>
                {isLoading ? 'En cours...' : 'Réinitialiser'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;