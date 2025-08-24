import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const Historique = () => {
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
        const response = await axios.get('https://pfe-express-js-2.onrender.com/api/appointments/patient', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Réponse du backend:', response.data);
        setAppointments(response.data.appointments || []);
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
        `https://pfe-express-js-2.onrender.com/api/appointments/cancel/${appointmentId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the local state to reflect the canceled status
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-200">
      <Navbar />
      <main className="pt-28 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-extrabold text-blue-700 mb-10 text-center animate-fade-in">
            Historique des Rendez-vous
          </h2>

          {isLoading && (
            <div className="flex justify-center items-center py-6">
              <svg
                className="animate-spin h-10 w-10 text-blue-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-80"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span className="ml-3 text-lg font-medium text-gray-700">Chargement en cours...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-50 border-l-4 border-red-600 text-red-800 p-5 rounded-lg mb-8 shadow-md animate-slide-in">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {!isLoading && !error && appointments.length === 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-600 text-blue-800 p-5 rounded-lg text-center shadow-md animate-slide-in">
              <p className="font-medium text-lg">Aucun rendez-vous trouvé dans votre historique.</p>
            </div>
          )}

          {!isLoading && !error && appointments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {appointments.map((appt) => (
                <div
                  key={appt._id}
                  className="bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="flex items-center mb-5">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shadow-sm">
                      <svg
                        className="w-7 h-7 text-blue-700"
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
                    <h3 className="ml-4 text-xl font-bold text-gray-900">
                      Dr. {appt.doctorId.nom} {appt.doctorId.prenom}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Spécialité :</span>{' '}
                      {appt.doctorId.specialite}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Email :</span>{' '}
                      {appt.doctorId.email}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Date :</span>{' '}
                      {appt.date}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Heure :</span>{' '}
                      {appt.time}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Jour :</span>{' '}
                      {appt.day}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Statut :</span>{' '}
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold tracking-wide ${
                          appt.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-900'
                            : appt.status === 'confirmed'
                            ? 'bg-green-100 text-green-900'
                            : 'bg-red-100 text-red-900'
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
                  {/* Cancel Button - Only visible for pending appointments */}
                  {appt.status === 'pending' && (
                    <div className="mt-5">
                      <button
                        onClick={() => cancelAppointment(appt._id)}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium tracking-wide hover:bg-red-700 transition-all duration-200 transform hover:scale-105"
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

export default Historique;