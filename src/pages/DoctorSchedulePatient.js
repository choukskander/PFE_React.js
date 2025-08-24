import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const DoctorSchedulePatient = () => {
  const { doctorId } = useParams();
  const [horaires, setHoraires] = useState(null);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await axios.get(`https://pfe-express-js-2.onrender.comapi/auth/schedule/${doctorId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setHoraires(response.data.horaires);
        setDoctor(response.data.doctor);
      } catch (err) {
        console.error('Erreur lors de la récupération des horaires:', err);
      }
    };
    fetchSchedule();
  }, [doctorId]);

  const handleBookAppointment = async (day, time) => {
    try {
      const selectedDate = prompt('Entrez la date (format: YYYY-MM-DD) :'); // À remplacer par un sélecteur de date
      if (!selectedDate) return;

      const response = await axios.post(
        'https://pfe-express-js-2.onrender.comapi/appointments/book',
        { doctorId, date: selectedDate, time, day },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert(response.data.message);
    } catch (err) {
      console.error('Erreur lors de la prise de rendez-vous:', err.response?.data?.message || err.message);
      alert('Erreur lors de la prise de rendez-vous: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!horaires || !doctor) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Horaires de {doctor.nom} {doctor.prenom} ({doctor.specialite})</h2>
      {Object.entries(horaires).map(([day, { ouverture, fermeture, ferme }]) => (
        <div key={day}>
          <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
          {ferme ? (
            <p>Fermé</p>
          ) : (
            <p>
              {ouverture} - {fermeture}
              <button onClick={() => handleBookAppointment(day, ouverture)}>
                Prendre un rendez-vous
              </button>
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DoctorSchedulePatient;