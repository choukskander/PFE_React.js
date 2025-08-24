import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import Lottie from 'lottie-react';
import animationData from './Animation - 1742560736699.json'; // Utilisez la même animation ou une autre

const API_URL = process.env.REACT_APP_API_URL || 'https://pfe-express-js-2.onrender.com';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      
      Swal.fire({
        icon: 'success',
        title: 'Email envoyé',
        text: 'Un email avec les instructions de réinitialisation a été envoyé à votre adresse.',
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
      marginBottom: '1rem',
      color: '#0a66c2',
      fontWeight: '700',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: '14px',
      color: '#666',
      textAlign: 'center',
      marginBottom: '2rem',
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
      transition: 'border-color 0.3s',
    },
    button: {
      background: isLoading ? '#ccc' : 'linear-gradient(45deg, #0a66c2, #094c99)',
      color: '#fff',
      padding: '0.9rem',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      marginTop: '1rem',
      transition: 'all 0.3s',
    },
    footer: {
      marginTop: '2rem',
      fontSize: '14px',
      color: '#666',
      textAlign: 'center',
    },
    link: {
      color: '#0a66c2',
      textDecoration: 'none',
      fontWeight: '600',
    },
    iconWrapper: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    icon: {
      fontSize: '48px',
      color: '#0a66c2',
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
            <div style={styles.iconWrapper}>
              <i className="fas fa-lock" style={styles.icon}></i>
            </div>
            <h1 style={styles.title}>Mot de passe oublié?</h1>
            <p style={styles.subtitle}>
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label style={styles.label}>Adresse Email</label>
                <input
                  type="email"
                  placeholder="Entrez votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                  onFocus={(e) => e.target.style.borderColor = '#0a66c2'}
                  onBlur={(e) => e.target.style.borderColor = '#dcdcdc'}
                />
              </div>
              <button 
                type="submit" 
                style={styles.button}
                disabled={isLoading}
                onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer les instructions'}
              </button>
            </form>
            <div style={styles.footer}>
              <Link to="/login" style={styles.link}>
                <i className="fas fa-arrow-left"></i> Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;