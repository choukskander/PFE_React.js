import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://pfe-express-js-2.onrender.com';

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const [horaires, setHoraires] = useState({
    lundi: { ouverture: '09:00', fermeture: '19:00', ferme: false },
    mardi: { ouverture: '09:00', fermeture: '19:00', ferme: false },
    mercredi: { ouverture: '09:00', fermeture: '19:00', ferme: false },
    jeudi: { ouverture: '09:00', fermeture: '19:00', ferme: false },
    vendredi: { ouverture: '09:00', fermeture: '19:00', ferme: false },
    samedi: { ouverture: '09:00', fermeture: '13:00', ferme: false },
    dimanche: { ouverture: '', fermeture: '', ferme: true },
  });
  const [isLoading, setIsLoading] = useState(false);

  // Charger les horaires actuels du médecin
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId || userId === 'null') {
      Swal.fire({
        icon: 'warning',
        title: 'Connexion requise',
        text: 'Vous devez être connecté pour gérer vos horaires.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
      navigate('/login');
      return;
    }

    const fetchSchedule = async () => {
      try {
        console.log('Token:', localStorage.getItem('token'));
        const response = await axios.get(`${API_URL}/api/auth/schedule/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setHoraires(response.data.horaires);
      } catch (err) {
        console.error('Erreur lors de la récupération des horaires:', err);
        if (err.response?.status === 404) {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Médecin non trouvé. Veuillez vous reconnecter.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            timerProgressBar: true,
          });
          localStorage.clear(); // Clear invalid user data
          navigate('/login');
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de charger les horaires. Veuillez réessayer plus tard.',
            toast: true,
            position: 'top-end',
            timer: 3000,
            timerProgressBar: true,
          });
        }
      }
    };
    fetchSchedule();
  }, [navigate]);

  const handleInputChange = (day, field, value) => {
    setHoraires((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleFermeChange = (day, checked) => {
    setHoraires((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ferme: checked,
        ouverture: checked ? '' : prev[day].ouverture || '09:00',
        fermeture: checked ? '' : prev[day].fermeture || '17:00',
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.put(
        `${API_URL}/api/auth/schedule`,
        { horaires },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Horaires mis à jour avec succès.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour des horaires:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur s\'est produite lors de la mise à jour des horaires.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="pt-24">
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-blue-600 text-center mb-6">Gérer vos horaires</h2>
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {days.map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-28">
                    <label className="block text-sm font-semibold text-gray-800 capitalize">
                      {day}
                    </label>
                  </div>
                  <div className="flex-1 flex items-center gap-4">
                    <input
                      type="time"
                      value={horaires[day].ouverture}
                      onChange={(e) => handleInputChange(day, 'ouverture', e.target.value)}
                      disabled={horaires[day].ferme}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-600">à</span>
                    <input
                      type="time"
                      value={horaires[day].fermeture}
                      onChange={(e) => handleInputChange(day, 'fermeture', e.target.value)}
                      disabled={horaires[day].ferme}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={horaires[day].ferme}
                        onChange={(e) => handleFermeChange(day, e.target.checked)}
                        className="mr-2"
                      />
                      Fermé
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer les horaires'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorSchedule;