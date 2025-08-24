import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Image } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from './Navbar';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(''); // New state for token
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [ville, setVille] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setToken(parsedUser.token); // Store the token separately

    // Fetch user data from the database
    const fetchUserProfile = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${parsedUser.token}`,
          },
        };
        const { data } = await axios.get('https://pfe-express-js-2.onrender.com/api/auth/profile', config);
        // Update state with the latest data from the database
        setUser(data);
        setNom(data.nom || '');
        setPrenom(data.prenom || '');
        setEmail(data.email || '');
        setSpecialite(data.specialite || '');
        setVille(data.ville || '');
        setLocalisation(data.localisation || '');
        setPreviewImage(data.profileImage || '/placeholder-profile-image.jpg');
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('user');
          navigate('/login');
          Swal.fire({
            icon: 'error',
            title: 'Session expirée',
            text: 'Veuillez vous reconnecter.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            timerProgressBar: true,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err.response?.data?.message || 'Une erreur s\'est produite lors de la récupération du profil.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            timerProgressBar: true,
          });
        }
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password && confirmPassword && password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Les mots de passe ne correspondent pas',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nom', nom || '');
      formData.append('prenom', prenom || '');
      formData.append('email', email || '');
      if (user.role === 'internaute') {
        formData.append('specialite', specialite || '');
        formData.append('ville', ville || '');
        formData.append('localisation', localisation || '');
      }
      formData.append('password', password || ''); // Always append password (empty or not)

      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      // Debug FormData
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`, // Use the separately stored token
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await axios.put(
        'https://pfe-express-js-2.onrender.com/api/auth/profile',
        formData,
        config
      );

      // Update localStorage with the latest data
      localStorage.setItem('user', JSON.stringify({
        ...user,
        token, // Preserve the token in localStorage
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        specialite: data.specialite,
        ville: data.ville,
        localisation: data.localisation,
        profileImage: data.profileImage,
      }));
      setUser({
        ...user,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        specialite: data.specialite,
        ville: data.ville,
        localisation: data.localisation,
        profileImage: data.profileImage,
      });
      setPreviewImage(data.profileImage || '/placeholder-profile-image.jpg');

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Profil mis à jour avec succès',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Une erreur s\'est produite';
      if (err.response?.status === 401) {
        localStorage.removeItem('user');
        navigate('/login');
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Container style={styles.container}>
        <h2 style={styles.title}>Modifier le profil</h2>

        <Form onSubmit={handleUpdate}>
          <Row>
            <Col md={4}>
              <Card style={styles.profileCard}>
                <Card.Body>
                  <Image
                    src={previewImage}
                    roundedCircle
                    style={styles.profileImage}
                  />
                  <Form.Group controlId="profileImage" className="mt-3">
                    <Form.Label style={styles.label}>Image de profil</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleImageChange}
                      style={styles.fileInput}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            <Col md={8}>
              <Card style={styles.detailsCard}>
                <Card.Body>
                  <Form.Group controlId="nom" className="mb-3">
                    <Form.Label style={styles.label}>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Entrez votre nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </Form.Group>

                  <Form.Group controlId="prenom" className="mb-3">
                    <Form.Label style={styles.label}>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Entrez votre prénom"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </Form.Group>

                  <Form.Group controlId="email" className="mb-3">
                    <Form.Label style={styles.label}>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Entrez votre email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </Form.Group>

                  {user?.role === 'internaute' && (
                    <>
                      <Form.Group controlId="specialite" className="mb-3">
                        <Form.Label style={styles.label}>Spécialité</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Entrez votre spécialité"
                          value={specialite}
                          onChange={(e) => setSpecialite(e.target.value)}
                          style={styles.input}
                        />
                      </Form.Group>

                      <Form.Group controlId="ville" className="mb-3">
                        <Form.Label style={styles.label}>Ville</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Entrez votre ville"
                          value={ville}
                          onChange={(e) => setVille(e.target.value)}
                          style={styles.input}
                        />
                      </Form.Group>

                      <Form.Group controlId="localisation" className="mb-3">
                        <Form.Label style={styles.label}>Localisation</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Entrez votre localisation"
                          value={localisation}
                          onChange={(e) => setLocalisation(e.target.value)}
                          style={styles.input}
                        />
                      </Form.Group>
                    </>
                  )}

                  <Form.Group controlId="password" className="mb-3">
                    <Form.Label style={styles.label}>Nouveau mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Laissez vide pour ne pas modifier"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={styles.input}
                    />
                  </Form.Group>

                  <Form.Group controlId="confirmPassword" className="mb-3">
                    <Form.Label style={styles.label}>Confirmer le mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Laissez vide pour ne pas modifier"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={styles.input}
                    />
                  </Form.Group>

                  <Button type="submit" variant="primary" style={styles.submitButton}>
                    Mettre à jour
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
};

// Styles (inchangés)
const styles = {
  container: {
    paddingTop: '80px',
    paddingBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#0a66c2',
    textAlign: 'center',
  },
  profileCard: {
    textAlign: 'center',
    padding: '1rem',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  profileImage: {
    width: '150px',
    height: '150px',
    marginBottom: '1rem',
    objectFit: 'cover',
  },
  fileInput: {
    marginTop: '1rem',
  },
  detailsCard: {
    padding: '1.5rem',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  label: {
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  input: {
    borderRadius: '5px',
    border: '1px solid #ddd',
    padding: '0.75rem',
  },
  submitButton: {
    width: '100%',
    marginTop: '1rem',
  },
};

export default ProfileScreen;