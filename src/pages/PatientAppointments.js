import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const PatientAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      // Vérifier si l'utilisateur est connecté et est un patient
      if (!user || user.role !== 'patient') {
        Swal.fire({
          icon: 'warning',
          title: 'Connexion requise',
          text: 'Vous devez être connecté en tant que patient pour voir vos rendez-vous.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
        navigate('/login');
        return;
      }

      if (!token) {
        Swal.fire({
          icon: 'warning',
          title: 'Session expirée',
          text: 'Votre session a expiré. Veuillez vous reconnecter.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
        localStorage.clear();
        navigate('/login');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get('https://pfe-express-js-2.onrender.comapi/appointments/patient', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Réponse du backend:', response.data);

        // Trier les rendez-vous par date décroissante et limiter à 3
        const sortedAppointments = (response.data.appointments || [])
          .sort((a, b) => {
            // Assumer que appt.date est au format "YYYY-MM-DD" ou un format compatible
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // Tri décroissant (plus récent en premier)
          })
          .slice(0, 3); // Limiter aux 3 premiers

        setAppointments(sortedAppointments);
      } catch (err) {
        console.error('Erreur lors de la récupération des rendez-vous:', err);
        setError(err.response?.data?.message || 'Impossible de charger les rendez-vous.');
        if (err.response?.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'Session expirée',
            text: 'Votre session a expiré. Veuillez vous reconnecter.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            timerProgressBar: true,
          });
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [navigate]);

  const cancelAppointment = async (appointmentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Session expirée',
        text: 'Votre session a expiré. Veuillez vous reconnecter.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
      localStorage.clear();
      navigate('/login');
      return;
    }

    try {
      await axios.put(
        `https://pfe-express-js-2.onrender.comapi/appointments/cancel/${appointmentId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Mettre à jour l'état local pour refléter l'annulation
      setAppointments(
        appointments.map((appt) =>
          appt._id === appointmentId ? { ...appt, status: 'cancelled' } : appt
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Rendez-vous annulé',
        text: 'Votre rendez-vous a été annulé avec succès.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error('Erreur lors de l’annulation du rendez-vous:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Impossible d’annuler le rendez-vous.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });

      if (err.response?.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Session expirée',
          text: 'Votre session a expiré. Veuillez vous reconnecter.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-blue-600 mb-8 text-center">
          Mes Derniers Rendez-vous
          </h2>

          {isLoading && (
            <div className="flex justify-center items-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span className="ml-2 text-gray-600">Chargement...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && appointments.length === 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg text-center">
              <p>Aucun rendez-vous récent trouvé.</p>
            </div>
          )}

          {!isLoading && !error && appointments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((appt) => (
                <div
                  key={appt._id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="ml-4 text-lg font-semibold text-gray-800">
                      Dr. {appt.doctorId.nom} {appt.doctorId.prenom}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Spécialité:</span>{' '}
                      {appt.doctorId.specialite}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Email:</span>{' '}
                      {appt.doctorId.email}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span> {appt.date}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Heure:</span> {appt.time}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Jour:</span> {appt.day}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Statut:</span>{' '}
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                          appt.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : appt.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {appt.status === 'pending'
                          ? 'En attente'
                          : appt.status === 'confirmed'
                          ? 'Confirmé'
                          : 'Annulé'}
                      </span>
                    </p>
                  </div>
                  {/* Bouton Annuler - Visible uniquement pour les rendez-vous en attente */}
                  {appt.status === 'pending' && (
                    <div className="mt-4">
                      <button
                        onClick={() => cancelAppointment(appt._id)}
                        className="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
                      >
                        Annuler le rendez-vous
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientAppointments;