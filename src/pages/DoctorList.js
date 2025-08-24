import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('https://pfe-express-js-2.onrender.comapi/auth/search-doctors', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setDoctors(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des médecins:', err);
      }
    };
    fetchDoctors();
  }, []);

  const handleViewSchedule = (doctorId) => {
    navigate(`/doctor-schedule/${doctorId}`);
  };

  return (
    <div className="doctor-list">
      <h2>Liste des Médecins</h2>
      {doctors.map((doctor) => (
        <div key={doctor._id} className="doctor-card">
          <h3>{doctor.nom} {doctor.prenom}</h3>
          <p>Spécialité: {doctor.specialite}</p>
          <p>Ville: {doctor.ville}</p>
          <button onClick={() => handleViewSchedule(doctor._id)}>Voir les horaires</button>
        </div>
      ))}
    </div>
  );
};

export default DoctorList;