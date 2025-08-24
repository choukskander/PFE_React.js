import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from './Navbar';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, addMinutes, setHours, setMinutes, addDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API_URL = process.env.REACT_APP_API_URL || 'https://pfe-express-js-2.onrender.com';

// Configuration du localizer pour react-big-calendar avec date-fns
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'fr': fr },
});

const SearchDoctors = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ville, setVille] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [nom, setNom] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [specialites, setSpecialites] = useState([
    { value: '', label: 'Sélectionner une spécialité' },
  ]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [horaires, setHoraires] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [coordinates, setCoordinates] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Fix Leaflet marker icon issue
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
    });
  }, []);

  // Initialize or update the map when coordinates and modal state change
  useEffect(() => {
    if (isModalOpen && coordinates && !mapError && mapContainerRef.current) {
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView(coordinates, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(mapRef.current);
        L.marker(coordinates)
          .addTo(mapRef.current)
          .bindPopup(`Cabinet de Dr. ${selectedDoctor?.nom || ''}`)
          .openPopup();
      } else {
        mapRef.current.setView(coordinates, 13);
        mapRef.current.removeLayer(mapRef.current.getLayers().find(layer => layer instanceof L.Marker));
        L.marker(coordinates)
          .addTo(mapRef.current)
          .bindPopup(`Cabinet de Dr. ${selectedDoctor?.nom || ''}`)
          .openPopup();
      }
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    }
  }, [isModalOpen, coordinates, mapError, selectedDoctor]);

  // Cleanup map on component unmount or modal close
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.remove();
        mapContainerRef.current = null;
      }
    };
  }, []);

  // Charger les spécialités dynamiquement depuis le backend
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

  // Extraire nom, spécialité et ville depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const villeFromUrl = params.get('ville');
    const specialiteFromUrl = params.get('specialite');
    const nomFromUrl = params.get('nom');
    console.log('SearchDoctors - URL params:', { nomFromUrl, specialiteFromUrl, villeFromUrl });

    if (nomFromUrl) setNom(decodeURIComponent(nomFromUrl));
    if (specialiteFromUrl) setSpecialite(decodeURIComponent(specialiteFromUrl));
    if (villeFromUrl) setVille(decodeURIComponent(villeFromUrl));
  }, [location.search]);

  // Déclencher la recherche automatique si au moins un critère est présent
  useEffect(() => {
    if (nom || specialite || ville) {
      console.log('SearchDoctors - Déclenchement recherche automatique:', { nom, specialite, ville });
      handleSearch({ preventDefault: () => {} }, true);
    }
  }, [nom, specialite, ville]);

  const validateForm = (isAutoSearch = false) => {
    let errors = {};
    const cleanedVille = ville.trim();
    const cleanedSpecialite = specialite.trim();
    const cleanedNom = nom.trim();

    console.log('SearchDoctors - Validation:', { nom: cleanedNom, specialite: cleanedSpecialite, ville: cleanedVille });

    if (!cleanedNom && !cleanedSpecialite && !cleanedVille) {
      errors.general = 'Veuillez spécifier au moins un critère (nom, spécialité ou ville).';
    } else {
      const nameRegex = /^[a-zA-Z\s-]{2,50}$/i;
      if (cleanedNom && !isAutoSearch && !nameRegex.test(cleanedNom)) {
        errors.nom = 'Le nom doit contenir 2-50 lettres, espaces ou tirets.';
      }
      if (cleanedSpecialite && !isAutoSearch && !nameRegex.test(cleanedSpecialite)) {
        errors.specialite = 'La spécialité doit contenir 2-50 lettres, espaces ou tirets.';
      }
      if (cleanedVille && !isAutoSearch && !nameRegex.test(cleanedVille)) {
        errors.ville = 'La ville doit contenir 2-50 lettres, espaces ou tirets.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSearch = async (e, isAutoSearch = false) => {
    e.preventDefault();
    const cleanedVille = ville.trim();
    const cleanedSpecialite = specialite.trim();
    const cleanedNom = nom.trim();
    console.log('SearchDoctors - Recherche avec:', { nom: cleanedNom, specialite: cleanedSpecialite, ville: cleanedVille });

    if (!validateForm(isAutoSearch)) {
      console.log('SearchDoctors - Erreurs de validation:', formErrors);
      if (!isAutoSearch) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: formErrors.general || Object.values(formErrors)[0],
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      const params = {};
      if (cleanedNom) params.nom = cleanedNom;
      if (cleanedSpecialite) params.specialite = cleanedSpecialite;
      if (cleanedVille) params.ville = cleanedVille;

      const response = await axios.get(`${API_URL}/api/auth/search-doctors`, { params });
      console.log('SearchDoctors - Réponse du backend:', response.data);
      setDoctors(response.data.doctors || response.data);
      if ((response.data.doctors || response.data).length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Aucun résultat',
          text: `Aucun médecin trouvé pour les critères spécifiés.`,
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Une erreur s\'est produite lors de la recherche.';
      console.error('SearchDoctors - Erreur:', err);
      if (!isAutoSearch) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoordinates = async (address) => {
    setMapLoading(true);
    setMapError(null);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setCoordinates([parseFloat(lat), parseFloat(lon)]);
      } else {
        setMapError('Impossible de trouver l\'emplacement.');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des coordonnées:', error);
      setMapError('Erreur lors du chargement de la carte.');
    } finally {
      setMapLoading(false);
    }
  };

  const showDoctorDetails = async (doctor) => {
    setCoordinates(null);
    setMapLoading(true);
    setMapError(null);
    setSelectedDoctor(doctor);
    setIsModalOpen(true);

    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-container';
    mapContainer.style.height = '300px';
    mapContainer.style.width = '100%';
    mapContainer.style.borderRadius = '8px';
    mapContainer.style.overflow = 'hidden';
    mapContainer.style.marginTop = '16px';
    mapContainerRef.current = mapContainer;

    await fetchCoordinates(doctor.localisation);

    Swal.fire({
      title: `Dr. ${doctor.prenom} ${doctor.nom}`,
      html: `
        <div>
          <p><strong>Spécialité:</strong> ${doctor.specialite}</p>
          <p><strong>Ville:</strong> ${doctor.ville}</p>
          <p><strong>Localisation:</strong> ${doctor.localisation}</p>
          <div id="map-placeholder">
            ${mapLoading ? '<p>Chargement de la carte...</p>' : ''}
            ${mapError ? `<p style="color: red;">${mapError}</p>` : ''}
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fermer',
      didOpen: () => {
        const placeholder = document.getElementById('map-placeholder');
        placeholder.appendChild(mapContainerRef.current);
      },
      willClose: () => {
        setIsModalOpen(false);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        if (mapContainerRef.current) {
          mapContainerRef.current.remove();
          mapContainerRef.current = null;
        }
      },
    });
  };

  const handleBookAppointment = async (doctor) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    console.log('Token envoyé:', token);
    console.log('Utilisateur connecté:', user);

    if (!user || user.role !== 'patient') {
      Swal.fire({
        icon: 'warning',
        title: 'Connexion requise',
        text: 'Vous devez être connecté en tant que patient pour prendre un rendez-vous.',
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

    try {
      const response = await axios.get(`${API_URL}/api/auth/schedule-for-patient/${doctor._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHoraires(response.data.horaires);
      setSelectedDoctor(doctor);
      setIsAppointmentModalOpen(true);
      const slots = generateAvailableSlots(response.data.horaires);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Erreur lors de la récupération des horaires:', err);
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
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les horaires du médecin.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      }
    }
  };

  const generateAvailableSlots = (horaires) => {
    const slots = [];
    const now = new Date();
    const endDate = addDays(now, 30);

    for (let date = new Date(now); date <= endDate; date = addDays(date, 1)) {
      const dayName = date.toLocaleString('fr-FR', { weekday: 'long' }).toLowerCase();
      const horairesDay = horaires?.[dayName];

      if (!horairesDay || horairesDay.ferme) continue;

      const [openHour, openMinute] = horairesDay.ouverture.split(':').map(Number);
      const [closeHour, closeMinute] = horairesDay.fermeture.split(':').map(Number);

      let currentTime = setHours(setMinutes(new Date(date), openMinute), openHour);
      const closeTime = setHours(setMinutes(new Date(date), closeMinute), closeHour);

      if (date.toDateString() === now.toDateString()) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const startTimeMinutes = openHour * 60 + openMinute;
        if (currentTimeMinutes > startTimeMinutes) {
          const adjustedMinutes = Math.ceil(currentTimeMinutes / 30) * 30;
          const adjustedHour = Math.floor(adjustedMinutes / 60);
          const adjustedMinute = adjustedMinutes % 60;
          currentTime = setHours(setMinutes(new Date(date), adjustedMinute), adjustedHour);
        }
      }

      while (currentTime < closeTime) {
        if (date.toDateString() === now.toDateString()) {
          if (isBefore(now, currentTime) || (currentTime.toDateString() === now.toDateString() && currentTime.getHours() === now.getHours() && currentTime.getMinutes() >= now.getMinutes())) {
            slots.push({
              title: `Disponible à ${format(currentTime, 'HH:mm')}`,
              start: new Date(currentTime),
              end: addMinutes(new Date(currentTime), 30),
            });
          }
        } else {
          slots.push({
            title: `Disponible à ${format(currentTime, 'HH:mm')}`,
            start: new Date(currentTime),
            end: addMinutes(new Date(currentTime), 30),
          });
        }
        currentTime = addMinutes(currentTime, 30);
      }
    }
    console.log('Créneaux disponibles générés:', slots);
    return slots;
  };

  const confirmAppointment = async (slot) => {
    const now = new Date();
    if (isBefore(slot.start, now)) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Vous ne pouvez pas prendre un rendez-vous dans le passé.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    try {
      const date = format(slot.start, 'yyyy-MM-dd');
      const time = format(slot.start, 'HH:mm');
      const day = slot.start.toLocaleString('fr-FR', { weekday: 'long' }).toLowerCase();

      await axios.post(
        `${API_URL}/api/appointments/book`,
        { doctorId: selectedDoctor._id, date, time, day },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Rendez-vous pris avec succès.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
      setSelectedDoctor(null);
      setHoraires(null);
      setAvailableSlots([]);
      setIsAppointmentModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la prise de rendez-vous:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Une erreur s\'est produite lors de la prise de rendez-vous.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
    }
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
            <h2 className="text-3xl font-bold text-blue-600 text-center mb-6">Rechercher des Médecins</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
              <form onSubmit={(e) => handleSearch(e, false)} className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="nom" className="block text-sm font-semibold text-gray-800 mb-1">
                    Nom du médecin
                  </label>
                  <div className="relative">
                    <input
                      id="nom"
                      type="text"
                      placeholder="   Entrez le nom ou prénom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      aria-describedby={formErrors.nom ? 'nom-error' : undefined}
                    />
                    <i className="fas fa-user-md absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300"></i>
                  </div>
                  {formErrors.nom && (
                    <p id="nom-error" className="text-red-500 text-sm mt-1">{formErrors.nom}</p>
                  )}
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
                      className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-500"
                      aria-describedby={formErrors.specialite ? 'specialite-error' : undefined}
                    >
                      {specialites.map((spec) => (
                        <option key={spec.value} value={spec.value}>
                          {spec.label}
                        </option>
                      ))}
                    </select>
                    <i className="fas fa-stethoscope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300"></i>
                  </div>
                  {formErrors.specialite && (
                    <p id="specialite-error" className="text-red-500 text-sm mt-1">{formErrors.specialite}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="ville" className="block text-sm font-semibold text-gray-800 mb-1">
                    Ville
                  </label>
                  <div className="relative">
                    <input
                      id="ville"
                      type="text"
                      placeholder="   Entrez la ville (ex. Tunis)"
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                      aria-describedby={formErrors.ville ? 'ville-error' : undefined}
                    />
                    <i className="fas fa-map-marker-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300"></i>
                  </div>
                  {formErrors.ville && (
                    <p id="ville-error" className="text-red-500 text-sm mt-1">{formErrors.ville}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="mt-4 md:mt-0 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  <i className="fas fa-search mr-2"></i>
                  {isLoading ? 'Recherche...' : 'Rechercher'}
                </button>
              </form>
            </div>
            <div className="max-w-5xl mx-auto mt-8">
              {doctors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {doctors.map((doctor) => (
                    <div key={doctor._id} className="bg-white p-6 rounded-lg shadow-lg">
                      <img
                        src={doctor.profileImage || '/placeholder-profile-image.jpg'}
                        alt={`${doctor.prenom} ${doctor.nom}`}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                        loading="lazy"
                      />
                      <h3 className="text-xl font-semibold text-gray-800 text-center">
                        Dr. {doctor.prenom} {doctor.nom}
                      </h3>
                      <p className="text-gray-600 text-center">{doctor.specialite}</p>
                      <p className="text-gray-600 text-center">Ville: {doctor.ville}</p>
                      <p className="text-gray-600 text-center">Cabinet: {doctor.localisation}</p>
                      <button
                        onClick={() => showDoctorDetails(doctor)}
                        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Voir les détails
                      </button>
                      <button
                        onClick={() => handleBookAppointment(doctor)}
                        className="mt-2 w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                      >
                        Prendre un rendez-vous
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {selectedDoctor && isAppointmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full">
            <h3 className="text-xl font-semibold mb-4">
              Prendre un rendez-vous avec Dr. {selectedDoctor.prenom} {selectedDoctor.nom}
            </h3>
            <div className="mb-4">
              {availableSlots.length === 0 ? (
                <p className="text-center text-gray-500">
                  Aucun créneau disponible pour cette période.
                </p>
              ) : (
                <Calendar
                  localizer={localizer}
                  events={availableSlots}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 500 }}
                  onSelectEvent={(slot) => confirmAppointment(slot)}
                  messages={{
                    next: "Suivant",
                    previous: "Précédent",
                    today: "Aujourd'hui",
                    month: "Mois",
                    week: "Semaine",
                    day: "Jour",
                    agenda: "Agenda",
                  }}
                  defaultView="week"
                  views={['week', 'day']}
                  step={30}
                  timeslots={2}
                  min={new Date(0, 0, 0, 8, 0)}
                  max={new Date(0, 0, 0, 20, 0)}
                />
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  setHoraires(null);
                  setAvailableSlots([]);
                  setIsAppointmentModalOpen(false);
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchDoctors;