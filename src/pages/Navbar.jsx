import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user || user.role !== 'internaute') {
      if (!token) {
        localStorage.clear();
        navigate('/login');
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          },
        });
        Toast.fire({
          icon: 'warning',
          title: 'Session expirée',
          text: 'Votre session a expiré. Veuillez vous reconnecter.',
        });
      }
      return;
    }
    try {
      const response = await axios.get('https://pfe-express-js-2.onrender.com/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          },
        });
        Toast.fire({
          icon: 'warning',
          title: 'Session expirée',
          text: 'Votre session a expirée. Veuillez vous reconnecter.',
        });
      }
    }
  };

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `https://pfe-express-js-2.onrender.com/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(
        notifications.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });
      Toast.fire({
        icon: 'success',
        title: 'Notification marquée comme lue',
      });
    } catch (err) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });
      Toast.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de marquer la notification comme lue.',
      });
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (updatedUser && updatedUser.role === 'internaute') {
        fetchNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    if (user && user.role === 'internaute') {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsUserDropdownOpen(false);
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
    Toast.fire({
      icon: 'success',
      title: 'Déconnexion réussie !',
    });
    navigate('/login');
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsDoctorDropdownOpen(false);
    setIsPatientDropdownOpen(false);
    setIsNotificationsOpen(false);
  };

  const toggleDoctorDropdown = () => {
    setIsDoctorDropdownOpen(!isDoctorDropdownOpen);
    setIsUserDropdownOpen(false);
    setIsPatientDropdownOpen(false);
    setIsNotificationsOpen(false);
  };

  const togglePatientDropdown = () => {
    setIsPatientDropdownOpen(!isPatientDropdownOpen);
    setIsUserDropdownOpen(false);
    setIsDoctorDropdownOpen(false);
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsUserDropdownOpen(false);
    setIsDoctorDropdownOpen(false);
    setIsPatientDropdownOpen(false);
    if (notifications.length === 0) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });
      Toast.fire({
        icon: 'info',
        title: 'Aucune notification',
        text: 'Vous n’avez aucune notification pour le moment.',
      });
    }
  };

  const handleLinkClick = () => {
    setIsUserDropdownOpen(false);
    setIsDoctorDropdownOpen(false);
    setIsPatientDropdownOpen(false);
    setIsNotificationsOpen(false);
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  return (
    <>
      <style>
        {`
          .dropdown {
            position: relative;
          }

          .dropdown-content {
            display: none;
            position: absolute;
            background-color: white;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            border-radius: 0.375rem;
            min-width: 160px;
            z-index: 10;
          }

          .dropdown-content.open {
            display: block;
          }

          .bell {
            width: 20px;
            height: 20px;
            fill: currentColor;
          }
        `}
      </style>

      <header className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/SmallSquareLogoJpg.jpg" alt="Logo" className="h-16 w-auto" />
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className="no-underline hover:no-underline focus:no-underline text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                onClick={handleLinkClick}
              >
                Accueil
              </Link>

              <div className="dropdown relative">
                <button
                  onClick={toggleDoctorDropdown}
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  Espace Médecin <i className="ri-arrow-down-s-line ml-1"></i>
                </button>
                <div className={`dropdown-content rounded-md mt-2 ${isDoctorDropdownOpen ? 'open' : ''}`}>
                  {user && user.role === 'internaute' && (
                  <Link
                    to="/doctor"
                    onClick={handleLinkClick}
                    className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Espace Médecin
                  </Link>
                  )}
                  {user && user.role === 'internaute' && (
                    <Link
                      to="/my-appointments/doctor"
                      onClick={handleLinkClick}
                      className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mes Rendez-vous
                    </Link>
                  )}
                  {user && user.role === 'internaute' && (
                    <Link
                      to="/doctor-schedule"
                      onClick={handleLinkClick}
                      className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Gérer mes horaires
                    </Link>
                  )}
                  {user && user.role === 'internaute' && (
                    <Link
                      to="/create-forum"
                      onClick={handleLinkClick}
                      className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Creation du Forum
                    </Link>
                  )}
                   {user && user.role === 'internaute' && (
                    <Link
                      to="/forums"
                      onClick={handleLinkClick}
                      className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Gestion du Forum
                    </Link>
                  )}
                </div>
              </div>

              <div className="dropdown relative">
                <button
                  onClick={togglePatientDropdown}
                  className="no-underline text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  Espace Patient <i className="ri-arrow-down-s-line ml-1"></i>
                </button>
                <div className={`dropdown-content rounded-md mt-2 ${isPatientDropdownOpen ? 'open' : ''}`}>
                  <Link
                    to="/diagnostic-ia"
                    onClick={handleLinkClick}
                    className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Diagnostic IA
                  </Link>
                 
                  {user && user.role === 'patient' && (
                    <Link
                      to="/historique/patient"
                      onClick={handleLinkClick}
                      className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Historique
                    </Link>
                  )}
                  {user && user.role === 'patient' && (
                    <Link
                      to="/my-appointments/patient"
                      onClick={handleLinkClick}
                      className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mes Rendez-vous
                    </Link>
                  )}
                  {user && user.role === 'patient' && (
                    <Link
                      to="/search-doctors"
                      onClick={handleLinkClick}
                      className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Rechercher des Médecins
                    </Link>
                  )}
                  {user && user.role === 'patient' && (
                    <Link
                      to="/forums"
                      onClick={handleLinkClick}
                      className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Forums Médicaux
                    </Link>
                  )}
                </div>
              </div>
            </nav>

            <div className="flex items-center">
              {user && user.role === 'internaute' && (
                <div className="relative mb-1">
                  <button
                    onClick={toggleNotifications}
                    className="flex items-center text-gray-700 hover:text-primary px-3 py-1 rounded-md text-sm font-medium"
                  >
                    <svg className="bell w-5 h-5 mr-1" viewBox="0 0 448 512">
                      <path d="M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 120.6 64 192v71.7c0 62.6-25.3 122.3-70.6 166.6L0 448l448 0 6.6-17.7c-45.3-44.3-70.6-104-70.6-166.6V192c0-71.4-55-126-128-140.8V32c0-17.7-14.3-32-32-32zM224 512c35.3 0 64-28.7 64-64H160c0 35.3 28.7 64 64 64z" />
                    </svg>
                    Notifications
                    {unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                        {unreadCount}
                      </span>
                    ) : (
                      <span className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full px-2 py-1 text-xs">
                        0
                      </span>
                    )}
                    <i className={`ri-arrow-${isNotificationsOpen ? 'up' : 'down'}-s-line ml-1`}></i>
                  </button>
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Notifications
                      </h3>
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-3 mb-2 rounded-lg ${
                              notif.read ? 'bg-gray-100' : 'bg-blue-50'
                            } border-l-4 ${
                              notif.read ? 'border-gray-300' : 'border-blue-500'
                            } flex justify-between items-center`}
                          >
                            <div>
                              <p className="text-sm text-gray-800">{notif.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(notif.createdAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                            {!notif.read && (
                              <button
                                onClick={() => {
                                  markAsRead(notif._id);
                                  handleLinkClick();
                                }}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Aucune notification pour le moment.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center">
                {user ? (
                  <div className="flex flex-col items-end">
                    <div className="dropdown relative">
                      <button
                        onClick={toggleUserDropdown}
                        className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center"
                      >
                        {user.prenom} {user.nom} <i className="ri-arrow-down-s-line ml-1"></i>
                      </button>
                      <div className={`dropdown-content rounded-md mt-2 ${isUserDropdownOpen ? 'open' : ''}`}>
                        <Link
                          to="/ProfileScreen"
                          onClick={handleLinkClick}
                          className="no-underline block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Profil
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            handleLinkClick();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="nav flex-row align-items-center list-unstyled ms-xl-auto">
                    <li className="nav-item ms-2 d-none d-sm-block">
                      <Link
                        to="/login"
                        className="btn btn-sm btn-success-soft mb-0"
                      >
                        <i className="fa-solid fa-right-to-bracket me-2" />
                        Sign in
                      </Link>
                    </li>
                    <li className="nav-item ms-2 d-none d-sm-block">
                      <Link
                        to="/register"
                        className="btn btn-sm btn-primary-soft mb-0"
                      >
                        <i className="fa-solid fa-user-plus me-2" />
                        Sign Up
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;