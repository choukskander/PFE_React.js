import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Custom.css';

const localizer = momentLocalizer(moment);

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [profile, setProfile] = useState({});
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [horaires, setHoraires] = useState({});

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!token || !storedUser) {
      Swal.fire({
        icon: 'warning',
        title: 'Connexion requise',
        text: 'Veuillez vous connecter.',
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
      navigate('/login');
      return;
    }
    if (storedUser.role !== 'internaute') {
      navigate('/profile');
    }
    setUser(storedUser);
    fetchAppointments(token);
    fetchHoraires(token, storedUser._id);
    fetchProfile(token);
  }, [navigate]);

  const fetchAppointments = async (token) => {
    try {
      const response = await axios.get('https://pfe-express-js-2.onrender.com/api/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(response.data || []);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Impossible de charger les rendez-vous.',
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
    }
  };

  const fetchHoraires = async (token, doctorId) => {
    try {
      const response = await axios.get(`https://pfe-express-js-2.onrender.com/api/auth/schedule/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHoraires(response.data.horaires || {});
      const generatedSlots = generateSlotsFromHoraires(response.data.horaires);
      setSlots(generatedSlots);
    } catch (err) {
      console.log('Aucun horaire disponible pour le moment:', err);
      setHoraires({});
      setSlots([]);
    }
  };

  const generateSlotsFromHoraires = (horaires) => {
    const slots = [];
    const today = moment().startOf('day');
    const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const maxSlotsPerDay = 10; // Limiter à 10 créneaux par jour

    for (let i = 0; i < 7; i++) {
      const currentDay = moment(today).add(i, 'days');
      const dayName = daysOfWeek[currentDay.day() === 0 ? 6 : currentDay.day() - 1];
      const horaire = horaires[dayName];
      let slotCount = 0;

      if (horaire && !horaire.ferme) {
        const startTime = moment(horaire.ouverture, 'HH:mm');
        const endTime = moment(horaire.fermeture, 'HH:mm');
        let currentTime = startTime.clone();

        while (currentTime.isBefore(endTime) && slotCount < maxSlotsPerDay) {
          const slotStart = moment(currentDay)
            .set({ hour: currentTime.hour(), minute: currentTime.minute() })
            .toDate();
          const slotEnd = moment(slotStart).add(30, 'minutes').toDate();

          const isSlotTaken = appointments.some((appt) => {
            const apptStart = moment(`${appt.date}T${appt.time}`);
            return apptStart.isSame(slotStart, 'minute');
          });

          if (!isSlotTaken) {
            slots.push({
              title: 'Disponible',
              start: slotStart,
              end: slotEnd,
            });
            slotCount++;
          }
          currentTime.add(30, 'minutes');
        }
      }
    }
    return slots;
  };

  const fetchProfile = async (token) => {
    try {
      setIsProfileLoading(true);
      const response = await axios.get('https://pfe-express-js-2.onrender.com/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Profil après fetch:', response.data);
      setProfile(response.data || {});
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Impossible de charger le profil.',
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleAddSlot = async (slotInfo) => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const selectedDay = moment(slotInfo.start).format('dddd').toLowerCase();
    const horaire = horaires[selectedDay];

    if (!horaire || horaire.ferme) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Le médecin n'est pas disponible le ${selectedDay}.`,
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
      return;
    }

    const startTime = moment(slotInfo.start);
    const endTime = moment(slotInfo.end);
    const horaireStart = moment(horaire.ouverture, 'HH:mm');
    const horaireEnd = moment(horaire.fermeture, 'HH:mm');

    const startHour = startTime.hour() + startTime.minute() / 60;
    const endHour = endTime.hour() + endTime.minute() / 60;
    const horaireStartHour = horaireStart.hour() + horaireStart.minute() / 60;
    const horaireEndHour = horaireEnd.hour() + horaireEnd.minute() / 60;

    if (startHour < horaireStartHour || endHour > horaireEndHour) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Le créneau sélectionné est en dehors des horaires du médecin (${horaire.ouverture} - ${horaire.fermeture}).`,
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
      return;
    }

    const isOverlapping = slots.some((slot) => {
      const existingStart = moment(slot.start);
      const existingEnd = moment(slot.end);
      return startTime.isBefore(existingEnd) && endTime.isAfter(existingStart);
    }) || appointments.some((appt) => {
      const apptStart = moment(`${appt.date}T${appt.time}`);
      const apptEnd = moment(apptStart).add(30, 'minutes');
      return startTime.isBefore(apptEnd) && endTime.isAfter(apptStart);
    });

    if (isOverlapping) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Ce créneau chevauche un autre créneau ou rendez-vous.',
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
      return;
    }

    const newSlot = {
      title: 'Disponible',
      start: startTime.toDate(),
      end: endTime.toDate(),
    };
    setSlots([...slots, newSlot]);
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Créneau ajouté !',
      toast: true,
      position: 'top-end',
      timer: 3000,
    });
  };

  const handleJoinMeeting = (appointment) => {
    const doctorName = `${user.prenom} ${user.nom}`;
    const patientName = `${appointment.patientId.prenom} ${appointment.patientId.nom}`;
    const roomName = `Meeting-${appointment._id.slice(-8)}`;
    navigate('/meeting', {
      state: { userName: doctorName, patientName, roomName },
    });

    const token = localStorage.getItem('token');
    axios.post(
      `https://pfe-express-js-2.onrender.com/api/appointments/${appointment._id}/send-meeting-link`,
      { roomName },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Lien de réunion envoyé au patient.',
          toast: true,
          position: 'top-end',
          timer: 3000,
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Échec de l’envoi du lien de réunion.',
          toast: true,
          position: 'top-end',
          timer: 3000,
        });
      });
  };

  const handleCancelAppointment = async (appointmentId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.put(
        `https://pfe-express-js-2.onrender.com/api/appointments/${appointmentId}/status`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments(token);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Rendez-vous annulé.',
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Impossible d’annuler le rendez-vous.',
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
    }
  };

  const handleChatbot = () => {
    navigate('/diagnostic-ia');
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Container style={styles.container}>
        <h2 style={styles.title}>Espace Médecin</h2>

        <Row>
          {/* Profile Overview */}
          <Col md={4}>
            <Card style={styles.card}>
              <Card.Body>
                <h4 style={styles.cardTitle}>Profil</h4>
                {isProfileLoading ? (
                  <p>Chargement...</p>
                ) : (
                  <>
                    <p><strong>Nom:</strong> {profile.nom || 'N/A'} {profile.prenom || ''}</p>
                    <p><strong>Spécialité:</strong> {profile.specialite || 'Non spécifiée'}</p>
                    <p><strong>Vérifié:</strong> {profile.validated === true ? 'Validé' : profile.validated === false ? 'Non Validé' : 'Statut inconnu'}</p>
                    <Button variant="primary" href="/ProfileScreen" style={styles.button}>
                      Modifier Profil
                    </Button>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Calendar */}
          <Col md={8}>
            <Card style={styles.card}>
              <Card.Body>
                <h4 style={styles.cardTitle}>Agenda</h4>
                <Calendar
                  localizer={localizer}
                  events={slots.concat(
                    appointments.map((appt) => ({
                      title: `RDV: ${appt.patientId.nom}`, // Simplifier le titre
                      start: new Date(appt.date + 'T' + appt.time),
                      end: new Date(new Date(appt.date + 'T' + appt.time).getTime() + 30 * 60 * 1000),
                    }))
                  )}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 500 }}
                  onSelectSlot={handleAddSlot}
                  selectable
                  views={['month', 'week', 'day']}
                  defaultView="week" // Vue par défaut plus claire
                  eventPropGetter={(event) => {
                    let backgroundColor = event.title.startsWith('RDV') ? '#28a745' : '#007bff';
                    return { style: { backgroundColor, padding: '2px' } };
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Appointments */}
        <Row className="mt-4">
          <Col>
            <Card style={styles.card}>
              <Card.Body>
                <h4 style={styles.cardTitle}>Rendez-vous</h4>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt._id}>
                        <td>{`${appt.patientId.nom} ${appt.patientId.prenom}`}</td>
                        <td>{new Date(appt.date).toLocaleDateString('fr-FR')}</td>
                        <td>{appt.time}</td>
                        <td>{appt.status}</td>
                        <td>
                          {appt.status === 'confirmed' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleJoinMeeting(appt)}
                            >
                              Lancer Consultation
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => handleCancelAppointment(appt._id)}
                          >
                            Annuler
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Chatbot Button */}
        <Button style={styles.chatbotButton} onClick={handleChatbot}>
          Diagnostic IA
        </Button>
      </Container>
    </div>
  );
};

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
  card: {
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#0a66c2',
    marginBottom: '1rem',
  },
  button: {
    width: '100%',
  },
  chatbotButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    fontSize: '1.5rem',
  },
};

export default DoctorDashboard;