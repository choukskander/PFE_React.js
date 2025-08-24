import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');

  const fetchAppointments = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    console.log('Logged-in user:', user);

    if (!user || user.role !== 'internaute') {
      Swal.fire({
        icon: 'warning',
        title: 'Connexion requise',
        text: 'Vous devez être connecté en tant que médecin pour voir vos rendez-vous.',
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
        text: 'Votre session a expirée. Veuillez vous reconnecter.',
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
      const response = await axios.get('https://pfe-express-js-2.onrender.com/api/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Réponse du backend (détails):', response.data);
      setAppointments(response.data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des rendez-vous:', err);
      setError(err.response?.data?.message || 'Impossible de charger les rendez-vous.');
      if (err.response?.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Session expirée',
          text: 'Votre session a expirée. Veuillez vous reconnecter.',
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

  useEffect(() => {
    fetchAppointments();
  }, [navigate]);

  useEffect(() => {
    console.log('Appointments state (détails):', appointments);
  }, [appointments]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    const token = localStorage.getItem('token');

    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Session expirée',
        text: 'Votre session a expirée. Veuillez vous reconnecter.',
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
      const response = await axios.put(
        `https://pfe-express-js-2.onrender.com/api/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Mise à jour statut - Réponse API:', response.data);

      await fetchAppointments();

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Statut du rendez-vous mis à jour avec succès.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Impossible de mettre à jour le statut.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });

      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  const joinMeeting = async (appointment) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const doctorName = `${user.prenom} ${user.nom}`;
    const patientName = `${appointment.patientId.prenom} ${appointment.patientId.nom}`;
    const roomName = `Meeting-${appointment._id.slice(-8)}`;

    console.log('Generated roomName:', roomName);

    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `https://pfe-express-js-2.onrender.com/api/appointments/${appointment._id}/send-meeting-link`,
        { roomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Meeting link sent to patient successfully');
    } catch (error) {
      console.error('Error sending meeting link to patient:', error.response?.data?.message || error.message);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Échec de l’envoi du lien de réunion au patient.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    navigate('/meeting', {
      state: {
        userName: doctorName,
        patientName: patientName,
        roomName: roomName,
      },
    });
  };

  // Filtrer les rendez-vous par nom du patient et statut
  const filteredAppointments = appointments.filter((appt) =>
    `${appt.patientId.nom} ${appt.patientId.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'Tous' || appt.status.toLowerCase() === statusFilter.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Navbar />
      <main className="pt-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-4xl font-extrabold text-indigo-700 mb-4 sm:mb-0">
                Mes Rendez-vous
              </h2>
              <div className="relative ">
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  className="w-full sm:w-72 pl-10 pr-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-300 hover:border-indigo-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center">
              <label className="text-gray-700 font-medium mr-3">Filtrer par statut :</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              >
                <option value="Tous">Tous</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <svg
                className="animate-spin h-10 w-10 text-indigo-600"
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
              <span className="ml-3 text-lg text-gray-600 font-medium">Chargement des rendez-vous...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-6 rounded-lg shadow-md mb-8">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-base">{error}</p>
              </div>
            </div>
          )}

          {/* No Appointments State */}
          {!isLoading && !error && filteredAppointments.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-10 text-center max-w-lg mx-auto transition-all duration-300 hover:shadow-lg">
              <div className="flex justify-center mb-6">
                <svg
                  className="w-20 h-20 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                Aucun rendez-vous
              </h3>
              <p className="text-gray-500 text-lg">
                Vous n’avez aucun rendez-vous correspondant à vos critères. Vérifiez vos horaires ou attendez de nouvelles demandes.
              </p>
            </div>
          )}

          {/* Appointments List */}
          {!isLoading && !error && filteredAppointments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAppointments.map((appt) => (
                <div
                  key={appt._id}
                  className="bg-white rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center mb-5">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                      <svg
                        className="w-7 h-7 text-indigo-600"
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
                    <h3 className="ml-4 text-xl font-semibold text-gray-800">
                      {appt.patientId.nom} {appt.patientId.prenom}
                    </h3>
                  </div>
                  <div className="space-y-3 text-gray-600">
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l9-6 9 6v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      <span className="font-medium">Email:</span> {appt.patientId.email}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Date:</span> {appt.date}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Heure:</span> {appt.time}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m0 0V9a2 2 0 012-2h10a2 2 0 012 2v2" />
                      </svg>
                      <span className="font-medium">Jour:</span> {appt.day}
                    </p>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-600">Statut:</span>
                      <select
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                        className={`border rounded-lg px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                          appt.status.toLowerCase() === 'confirmed'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : appt.status.toLowerCase() === 'cancelled'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmé</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </div>
                    {(appt.status || '').trim().toLowerCase() === 'confirmed' ? (
                      <button
                        onClick={() => joinMeeting(appt)}
                        className="mt-5 w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-lg font-semibold shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-300"
                      >
                        Rejoindre la réunion
                      </button>
                    ) : (
                      <p className="mt-5 text-gray-500 italic">
                        Statut non confirmé (actuel: {appt.status})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorAppointments;