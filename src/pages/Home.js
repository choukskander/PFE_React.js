import React, { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';

const API_URL = process.env.REACT_APP_API_URL || 'https://pfe-express-js-2.onrender.com';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [nom, setNom] = useState('');
  const [specialites, setSpecialites] = useState([
    { value: '', label: 'Sélectionner une spécialité' },
  ]);

  // Refs for chart instances and DOM elements
  const appointmentsPerDayChartRef = useRef(null);
  const doctorsBySpecialtyChartRef = useRef(null);
  const appointmentsPerDayChartDomRef = useRef(null);
  const doctorsBySpecialtyChartDomRef = useRef(null);

  useEffect(() => {
    const fetchSpecialites = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/specialites`);
        setSpecialites(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des spécialités:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les spécialités. Veuillez réessayer plus tard.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      }
    };
    fetchSpecialites();
  }, []);

  useEffect(() => {
    // Fetch data for appointments per day
    const fetchAppointmentsPerDay = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/appointments/appointments-per-day`);
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

        if (appointmentsPerDayChartDomRef.current) {
          appointmentsPerDayChartRef.current = echarts.init(appointmentsPerDayChartDomRef.current);
          appointmentsPerDayChartRef.current.setOption({
            title: { text: 'Rendez-vous par jour' },
            tooltip: {},
            xAxis: { data: days },
            yAxis: {},
            series: [
              {
                type: 'bar',
                data: response.data, // e.g., [2, 2, 0, 4, 1, 0, 0]
                itemStyle: {
                  color: '#1890ff',
                },
              },
            ],
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous par jour:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les données des rendez-vous par jour.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      }
    };

    // Fetch data for doctors by specialty
    const fetchDoctorsBySpecialty = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/doctors-by-specialty`);
        if (doctorsBySpecialtyChartDomRef.current) {
          doctorsBySpecialtyChartRef.current = echarts.init(doctorsBySpecialtyChartDomRef.current);
          doctorsBySpecialtyChartRef.current.setOption({
            title: { text: 'Médecins par spécialité' },
            tooltip: {},
            series: [
              {
                type: 'pie',
                data: response.data, // e.g., [{ name: 'Orthopediste', value: 1 }, { name: 'dentiste', value: 2 }, { name: 'generaliste', value: 1 }]
                radius: '55%',
                label: {
                  show: true,
                  position: 'outside',
                },
              },
            ],
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des médecins par spécialité:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les données des médecins par spécialité.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      }
    };

    // Fetch data and initialize charts
    fetchAppointmentsPerDay();
    fetchDoctorsBySpecialty();

    // Handle window resize
    const handleResize = () => {
      if (appointmentsPerDayChartRef.current) appointmentsPerDayChartRef.current.resize();
      if (doctorsBySpecialtyChartRef.current) doctorsBySpecialtyChartRef.current.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      if (appointmentsPerDayChartRef.current) {
        appointmentsPerDayChartRef.current.dispose();
        appointmentsPerDayChartRef.current = null;
      }
      if (doctorsBySpecialtyChartRef.current) {
        doctorsBySpecialtyChartRef.current.dispose();
        doctorsBySpecialtyChartRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const validateQuery = () => {
    const cleanedQuery = searchQuery.trim();
    const cleanedNom = nom.trim();
    const nameRegex = /^[a-zA-Z\s-]{2,50}$/i;

    if (!nom && !specialite && !searchQuery) {
      return 'Veuillez spécifier au moins un critère (nom, spécialité ou ville).';
    }
    if (cleanedNom && !nameRegex.test(cleanedNom)) {
      return 'Le nom doit contenir 2-50 lettres, espaces ou tirets.';
    }
    if (cleanedQuery && !nameRegex.test(cleanedQuery)) {
      return 'La ville doit contenir 2-50 lettres, espaces ou tirets.';
    }
    return null;
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      Swal.fire({
        icon: 'warning',
        title: 'Connexion requise',
        text: 'Vous devez être connecté pour effectuer une recherche.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
        confirmButtonText: 'Se connecter',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
      return;
    }

    const error = validateQuery();
    if (error) {
      console.log('Home - Erreur de validation:', error, { nom, specialite, ville: searchQuery });
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error,
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    const cleanedQuery = searchQuery.trim();
    const cleanedNom = nom.trim();
    console.log('Home - Redirection avec:', { nom: cleanedNom, specialite, ville: cleanedQuery });

    const queryParams = new URLSearchParams();
    if (cleanedNom) queryParams.append('nom', cleanedNom);
    if (specialite) queryParams.append('specialite', specialite);
    if (cleanedQuery) queryParams.append('ville', cleanedQuery);
    navigate(`/search-doctors?${queryParams.toString()}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="pt-24">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://readdy.ai/api/search-image?query=A%20professional%20medical%20scene%20with%20a%20smiling%20doctor%20in%20white%20coat%20consulting%20with%20patients%20in%20a%20modern%20bright%20clinic%20with%20light%20blue%20accents%2C%20soft%20lighting%2C%20medical%20equipment%20visible%20in%20background%2C%20warm%20and%20welcoming%20atmosphere%2C%20high%20quality%20professional%20photography&width=1440&height=600&seq=hero1&orientation=landscape"
              alt="Médecin avec patients"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Votre santé, notre priorité
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Prenez rendez-vous avec les meilleurs médecins en Tunisie en quelques clics. 
                Service rapide, sécurisé et personnalisé.
              </p>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1">
                    <label htmlFor="nom" className="block text-sm font-semibold text-gray-800 mb-1">
                      Nom du médecin
                    </label>
                    <div className="relative">
                      <input
                        id="nom"
                        type="text"
                        placeholder="   Entrez le nom "
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="w-full p-3 pl-16 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      />
                      <i className="fas fa-user-md absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300"></i>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="specialite" className="block text-sm font-semibold text-gray-800 mb-1">
                      Spécialité
                    </label>
                    <div className="relative">
                      <select
                        id="specialite"
                        value={specialite}
                        onChange={(e) => setSpecialite(e.target.value)}
                        className="w-full p-3 pl-16 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-500"
                      >
                        {specialites.map((spec) => (
                          <option key={spec.value} value={spec.value}>
                            {spec.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="ville" className="block text-sm font-semibold text-gray-800 mb-1">
                      Ville
                    </label>
                    <div className="relative">
                      <input
                        id="ville"
                        type="text"
                        placeholder="   Entrez la ville"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 pl-16 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      />
                      <i className="fas fa-map-marker-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300"></i>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-4 md:mt-0 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <i className="fas fa-search mr-2"></i>
                    Rechercher
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Nos Services Principaux</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <i className="ri-stethoscope-line text-primary text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Espace Médecins</h3>
                <p className="text-gray-600">
                  Collaborez avec vos pairs, partagez des cas cliniques et accédez à des ressources médicales avancées.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <i className="ri-heart-pulse-line text-primary text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Espace Patients</h3>
                <p className="text-gray-600">
                  Accédez à vos diagnostics, consultez votre historique médical et trouvez un spécialiste près de chez vous.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <i className="ri-robot-line text-primary text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Diagnostic IA</h3>
                <p className="text-gray-600">
                  Profitez des dernières avancées en intelligence artificielle pour un pré-diagnostic rapide et fiable.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-blue-50 to-blue-100 py-10 rounded-lg shadow mx-4 mb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold mb-4">Graphiques Statistiques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div ref={appointmentsPerDayChartDomRef} id="consultationsChart" style={{ width: '100%', height: '400px' }}></div>
              <div ref={doctorsBySpecialtyChartDomRef} id="accuracyChart" style={{ width: '100%', height: '400px' }}></div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {/* Add the Chatbot component */}
      <Chatbot />
    </div>
  );
};

export default Home;