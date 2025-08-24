import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Badge, Table, Dropdown } from 'react-bootstrap';
import { FaSignOutAlt, FaEye, FaCheck } from 'react-icons/fa';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../components/Sidebar';

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [forums, setForums] = useState([]);
  const [notifications, setNotifications] = useState([]); // État pour les notifications
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [userTypeFilter, setUserTypeFilter] = useState('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('Tous');
  const [doctorValidationFilter, setDoctorValidationFilter] = useState('Tous');
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [currentPageAppointments, setCurrentPageAppointments] = useState(1);
  const [currentPageForums, setCurrentPageForums] = useState(1);
  const [currentPageNotifications, setCurrentPageNotifications] = useState(1); // Pagination pour notifications
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const usersResponse = await axios.get('https://pfe-express-js-2.onrender.com/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);

        const appointmentsResponse = await axios.get('https://pfe-express-js-2.onrender.com/api/appointments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : []);

        const forumsResponse = await axios.get('https://pfe-express-js-2.onrender.com/api/forum', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const forumsData = Array.isArray(forumsResponse.data) 
          ? forumsResponse.data 
          : Array.isArray(forumsResponse.data?.data) 
            ? forumsResponse.data.data 
            : [];
        setForums(forumsData);

        // Récupérer les notifications pour les admins
        const notificationsResponse = await axios.get('https://pfe-express-js-2.onrender.com/api/notifications/admin', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(Array.isArray(notificationsResponse.data) ? notificationsResponse.data : []);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
        setUsers([]);
        setAppointments([]);
        setForums([]);
        setNotifications([]);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Erreur récupération données.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [navigate]);

  const medecins = users.filter((user) => user.role === 'internaute');
  const patients = users.filter((user) => user.role === 'patient');
  const admins = users.filter((user) => user.role === 'admin');

  const stats = {
    totalUsers: users.length,
    newUsers: users.filter((user) => {
      const diffDays = (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length,
    activeUsers: users.filter((user) => user.validated).length,
    appointments: appointments.filter((appointment) => appointment.status === 'confirmed').length,
    unreadNotifications: notifications.filter((notification) => !notification.read).length, // Nombre de notifications non lues
  };

  const allUsers = users.map((user) => ({
    id: user._id,
    name: `${user.nom} ${user.prenom}`,
    email: user.email,
    type: user.role === 'internaute' ? 'Médecin' : user.role === 'patient' ? 'Patient' : 'Admin',
    date: user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A',
    status: user.validated ? 'Actif' : 'Inactif',
    validated: user.validated,
    specialite: user.specialite,
    ville: user.ville,
    localisation: user.localisation,
    licenceProfessionnelle: user.licenceProfessionnelle,
    profileImage: user.profileImage,
  }));

  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tous' || (statusFilter === 'Actifs' && user.status === 'Actif') || (statusFilter === 'Inactifs' && user.status === 'Inactif');
    const matchesType = userTypeFilter === 'Tous' || userTypeFilter === user.type;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredMedecins = medecins.filter((medecin) => {
    if (doctorValidationFilter === 'Tous') return true;
    if (doctorValidationFilter === 'Validés') return medecin.validated;
    if (doctorValidationFilter === 'Non Validés') return !medecin.validated;
    return true;
  });

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus = appointmentStatusFilter === 'Tous' || appointment.status === appointmentStatusFilter.toLowerCase();
    return matchesStatus;
  });

  const paginatedUsers = filteredUsers.slice((currentPageUsers - 1) * itemsPerPage, currentPageUsers * itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice((currentPageAppointments - 1) * itemsPerPage, currentPageAppointments * itemsPerPage);
  const paginatedForums = forums.slice((currentPageForums - 1) * itemsPerPage, currentPageForums * itemsPerPage);
  const paginatedNotifications = notifications.slice((currentPageNotifications - 1) * itemsPerPage, currentPageNotifications * itemsPerPage);

  const totalPagesUsers = Math.ceil(filteredUsers.length / itemsPerPage);
  const totalPagesAppointments = Math.ceil(filteredAppointments.length / itemsPerPage);
  const totalPagesForums = Math.ceil(forums.length / itemsPerPage);
  const totalPagesNotifications = Math.ceil(notifications.length / itemsPerPage);

  const handlePageChangeUsers = (newPage) => setCurrentPageUsers(newPage);
  const handlePageChangeAppointments = (newPage) => setCurrentPageAppointments(newPage);
  const handlePageChangeForums = (newPage) => setCurrentPageForums(newPage);
  const handlePageChangeNotifications = (newPage) => setCurrentPageNotifications(newPage);

  const calculateAppointmentsByStatusPerMonth = () => {
    const months = [];
    const monthLabels = [];
    const now = new Date();
    const endMonth = now.getMonth();
    const endYear = now.getFullYear();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(endYear, endMonth - i, 1);
      months.push({ month: date.getMonth(), year: date.getFullYear() });
      monthLabels.push(date.toLocaleString('fr-FR', { month: 'short' }));
    }

    const confirmedData = months.map(({ month, year }) => appointments.filter((appointment) => new Date(appointment.date).getMonth() === month && new Date(appointment.date).getFullYear() === year && appointment.status === 'confirmed').length);
    const pendingData = months.map(({ month, year }) => appointments.filter((appointment) => new Date(appointment.date).getMonth() === month && new Date(appointment.date).getFullYear() === year && appointment.status === 'pending').length);
    const cancelledData = months.map(({ month, year }) => appointments.filter((appointment) => new Date(appointment.date).getMonth() === month && new Date(appointment.date).getFullYear() === year && appointment.status === 'cancelled').length);

    return { labels: monthLabels, confirmedData, pendingData, cancelledData };
  };

  const { labels, confirmedData, pendingData, cancelledData } = calculateAppointmentsByStatusPerMonth();

  const barChartData = {
    labels,
    datasets: [
      { label: 'Confirmé', data: confirmedData, backgroundColor: 'rgba(40, 167, 69, 0.6)', borderColor: '#28a745', borderWidth: 1 },
      { label: 'En attente', data: pendingData, backgroundColor: 'rgba(255, 193, 7, 0.6)', borderColor: '#ffc107', borderWidth: 1 },
      { label: 'Annulé', data: cancelledData, backgroundColor: 'rgba(220, 53, 69, 0.6)', borderColor: '#dc3545', borderWidth: 1 },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'RDV par Statut par Mois', font: { size: 14 } } },
    scales: { x: { stacked: true, title: { display: true, text: 'Mois' } }, y: { stacked: true, title: { display: true, text: 'Nombre' }, beginAtZero: true } },
  };

  const pieChartData = {
    labels: ['Médecins', 'Patients', 'Admins'],
    datasets: [{ label: 'Répartition', data: [medecins.length, patients.length, admins.length], backgroundColor: ['rgba(13, 110, 253, 0.6)', 'rgba(40, 167, 69, 0.6)', 'rgba(255, 193, 7, 0.6)'], borderColor: ['#0d6efd', '#28a745', '#ffc107'], borderWidth: 1 }],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Répartition Utilisateurs', font: { size: 14 } } },
  };

  const exportToCSV = () => {
    const csvData = filteredUsers.map(user => ({ Utilisateur: user.name, Email: user.email, Type: user.type, Statut: user.status }));
    const csv = window.Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'utilisateurs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Export CSV réussi');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Liste des Utilisateurs', 14, 20);
    autoTable(doc, { head: [['Utilisateur', 'Email', 'Type', 'Statut']], body: filteredUsers.map(user => [user.name, user.email, user.type, user.status]), startY: 30, theme: 'striped', headStyles: { fillColor: [13, 110, 253] } });
    doc.save('utilisateurs.pdf');
    showNotification('Export PDF réussi');
  };

  const handleDeleteUser = async (userId) => {
    const result = await Swal.fire({ title: 'Êtes-vous sûr ?', text: 'Irreversible !', icon: 'warning', showCancelButton: true, confirmButtonText: 'Oui', cancelButtonText: 'Annuler' });
    if (result.isConfirmed) {
      await axios.delete(`https://pfe-express-js-2.onrender.com/api/auth/users/${userId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setUsers(users.filter((user) => user._id !== userId));
      showNotification('Utilisateur supprimé');
    }
  };

  const handleValidateDoctor = async (userId) => {
    try {
      const response = await axios.put(`https://pfe-express-js-2.onrender.com/api/auth/users/${userId}/validate`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setUsers(users.map((user) => user._id === userId ? { ...user, validated: true } : user));
      showNotification('Licence validée, email envoyé');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: err.response?.data?.message || 'Validation échouée', toast: true, position: 'top-end', timer: 3000, timerProgressBar: true });
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://pfe-express-js-2.onrender.com/api/notifications/admin/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map((notification) =>
        notification._id === notificationId ? { ...notification, read: true } : notification
      ));
      showNotification('Notification marquée comme lue');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Échec de la mise à jour de la notification.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    Swal.fire({ icon: 'success', title: 'Déconnexion', text: 'Succès', toast: true, position: 'top-end', timer: 3000, timerProgressBar: true });
    navigate('/login');
  };

  const isCloudinaryUrl = (url) => url && url.startsWith('https://res.cloudinary.com');

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (userId) => {
    setUsers(users.map((user) => user._id === userId ? { ...user, validated: !user.validated } : user));
    showNotification('Statut mis à jour');
  };

  const showNotification = (message) => {
    setNotificationMessage(message);
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedUser = {
      ...currentUser,
      nom: formData.get('name').split(' ')[0] || currentUser.nom,
      prenom: formData.get('name').split(' ')[1] || currentUser.prenom,
      email: formData.get('email'),
      role: formData.get('type') === 'Médecin' ? 'internaute' : formData.get('type').toLowerCase(),
      validated: formData.get('status') === 'Actif',
    };
    try {
      await axios.put(`https://pfe-express-js-2.onrender.com/api/auth/users/${updatedUser.id}`, updatedUser, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setUsers(users.map((user) => user._id === updatedUser.id ? { ...user, ...updatedUser } : user));
      setIsModalOpen(false);
      showNotification('Utilisateur mis à jour');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: err.response?.data?.message || 'Mise à jour échouée', toast: true, position: 'top-end', timer: 3000, timerProgressBar: true });
    }
  };

  const handleAddUser = () => navigate('/register');

  const handleDeleteForum = async (forumId) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action est irréversible et supprimera également toutes les réponses associées !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`https://pfe-express-js-2.onrender.com/api/forum/${forumId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setForums(forums.filter((forum) => forum._id !== forumId));
        showNotification('Forum et ses réponses supprimés');
      } catch (err) {
        console.error('Erreur lors de la suppression du forum:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.response?.data?.message || 'Échec de la suppression du forum.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          timerProgressBar: true,
        });
      }
    }
  };

  const handleViewForumResponses = (forumId) => navigate(`/forum-responses/${forumId}`);

  if (loading) return <div className="text-center mt-5">Chargement...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection={activeSection} setActiveSection={setActiveSection} medecins={medecins} patients={patients} admins={admins} appointments={appointments} forums={forums} notifications={notifications} handleLogout={handleLogout} />
      <div style={{ marginLeft: sidebarOpen ? '250px' : '80px', transition: 'all 0.3s ease-in-out', flex: 1 }}>
        <header className="bg-white shadow-sm">
          <div className="d-flex justify-content-between align-items-center px-4 py-3">
            <h1 className="h4 mb-0 text-dark">{activeSection === 'dashboard' && 'Tableau de bord' || activeSection === 'users' && 'Gestion Utilisateurs' || activeSection === 'medecins' && 'Gestion Médecins' || activeSection === 'patients' && 'Gestion Patients' || activeSection === 'admins' && 'Gestion Admins' || activeSection === 'appointments' && 'Gestion RDV' || activeSection === 'forums' && 'Gestion Forums' || activeSection === 'notifications' && 'Notifications'}</h1>
            <div className="d-flex align-items-center">
              <input type="text" placeholder="Rechercher..." className="form-control form-control-sm ps-5" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Button variant="link" className="p-2" onClick={() => setActiveSection('notifications')}>
                <i className="fas fa-bell text-muted"></i>
                <span className="badge rounded-pill bg-danger text-white">{stats.unreadNotifications}</span>
              </Button>
              <img src="/admin.png" alt="Admin" className="rounded-circle me-2" style={{ width: '40px', height: '40px', objectFit: 'cover' }} onError={(e) => (e.target.src = '/placeholder-profile-image.jpg')} />
              <span className="text-muted">Admin</span>
              <Dropdown><Dropdown.Toggle variant="link" className="p-2" style={{ color: '#6c757d' }}><i className="fas fa-chevron-down text-muted"></i></Dropdown.Toggle><Dropdown.Menu align="end"><Dropdown.Item onClick={handleLogout}><FaSignOutAlt className="me-2" />Déconnexion</Dropdown.Item></Dropdown.Menu></Dropdown>
            </div>
          </div>
          <div className="px-4 py-2 border-top text-muted" style={{ fontSize: '0.875rem' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>

        <main className="p-4">
          {activeSection === 'dashboard' && (
            <>
              <Row className="mb-4">
                <Col lg={3} md={6} className="mb-4"><Card className="shadow-sm"><Card.Body className="d-flex align-items-center"><div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary me-3"><i className="fas fa-users fs-4"></i></div><div><Card.Text className="text-muted mb-1">Total Utilisateurs</Card.Text><Card.Title className="h5 mb-0">{stats.totalUsers}</Card.Title></div></Card.Body></Card></Col>
                <Col lg={3} md={6} className="mb-4"><Card className="shadow-sm"><Card.Body className="d-flex align-items-center"><div className="p-3 rounded-circle bg-success bg-opacity-10 text-success me-3"><i className="fas fa-user-plus fs-4"></i></div><div><Card.Text className="text-muted mb-1">Nouveaux Utilisateurs</Card.Text><Card.Title className="h5 mb-0">{stats.newUsers}</Card.Title></div></Card.Body></Card></Col>
                <Col lg={3} md={6} className="mb-4"><Card className="shadow-sm"><Card.Body className="d-flex align-items-center"><div className="p-3 rounded-circle bg-purple bg-opacity-10 text-purple me-3"><i className="fas fa-user-check fs-4"></i></div><div><Card.Text className="text-muted mb-1">Utilisateurs Actifs</Card.Text><Card.Title className="h5 mb-0">{stats.activeUsers}</Card.Title></div></Card.Body></Card></Col>
                <Col lg={3} md={6} className="mb-4"><Card className="shadow-sm"><Card.Body className="d-flex align-items-center"><div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning me-3"><i className="fas fa-calendar-check fs-4"></i></div><div><Card.Text className="text-muted mb-1">Rendez-vous en cours</Card.Text><Card.Title className="h5 mb-0">{stats.appointments}</Card.Title></div></Card.Body></Card></Col>
              </Row>
              <Row className="mb-4">
                <Col lg={8} className="mb-4"><Card className="shadow-sm"><Card.Body><div style={{ height: '300px', width: '100%' }}><Bar data={barChartData} options={barChartOptions} /></div><div style={{ height: '300px', width: '100%', marginTop: '20px' }}><Pie data={pieChartData} options={pieChartOptions} /></div></Card.Body></Card></Col>
                <Col lg={4}><Card className="shadow-sm"><Card.Body><h5>Filtres</h5><div className="mb-4"><label>Statut</label><div className="d-flex gap-2">{['Tous', 'Actifs', 'Inactifs'].map((filter) => <Button key={filter} variant={statusFilter === filter ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setStatusFilter(filter)}>{filter}</Button>)}</div></div><div className="mb-4"><label>Type de compte</label><select className="form-select form-select-sm" value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)}><option value="Tous">Tous</option><option value="Patient">Patient</option><option value="Médecin">Médecin</option><option value="Admin">Admin</option></select></div><div><label>Exporter</label><div className="d-flex gap-2"><Button variant="outline-secondary" size="sm" onClick={exportToCSV}><i className="fas fa-file-csv me-2"></i>CSV</Button><Button variant="outline-secondary" size="sm" onClick={exportToPDF}><i className="fas fa-file-pdf me-2"></i>PDF</Button></div></div></Card.Body></Card></Col>
              </Row>
            </>
          )}

          {activeSection === 'users' && (
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>Liste des utilisateurs</h5>
                  <Button variant="primary" size="sm" onClick={handleAddUser}><i className="fas fa-plus me-2"></i>Ajouter</Button>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead><tr><th>Utilisateur</th><th>Email</th><th>Type</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>{paginatedUsers.map((user) => <tr key={user.id}><td><div className="d-flex align-items-center"><img src={user.profileImage ? (isCloudinaryUrl(user.profileImage) ? user.profileImage : `https://pfe-express-js-2.onrender.com${user.profileImage.replace(/^\/+/, '')}`) : '/placeholder-profile-image.jpg'} alt={user.name} className="rounded-circle me-2" style={{ width: '40px', height: '40px', objectFit: 'cover' }} onError={(e) => (e.target.src = '/placeholder-profile-image.jpg')} /><span>{user.name}</span></div></td><td>{user.email}</td><td>{user.type}</td><td><Badge bg={user.status === 'Actif' ? 'success' : 'danger'}>{user.status}</Badge></td><td><Button variant="link" className="text-primary p-1" onClick={() => handleEditUser(user)}><i className="fas fa-edit"></i></Button><Button variant="link" className={user.status === 'Actif' ? 'text-warning p-1' : 'text-success p-1'} onClick={() => handleToggleStatus(user.id)}><i className={user.status === 'Actif' ? 'fas fa-ban' : 'fas fa-check'}></i></Button><Button variant="link" className="text-danger p-1" onClick={() => handleDeleteUser(user.id)}><i className="fas fa-trash"></i></Button></td></tr>)}</tbody>
                  </Table>
                </div>
                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                  <span className="text-muted">Affichage {((currentPageUsers - 1) * itemsPerPage) + 1} à {Math.min(currentPageUsers * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length}</span>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePageChangeUsers(currentPageUsers - 1)} disabled={currentPageUsers === 1}>Précédent</Button>
                    <Button variant="primary" size="sm">{currentPageUsers}</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePageChangeUsers(currentPageUsers + 1)} disabled={currentPageUsers === totalPagesUsers}>Suivant</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {activeSection === 'medecins' && (
            <>
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <h5>Filtres</h5>
                  <div className="mb-4">
                    <label>Statut validation</label>
                    <div className="d-flex gap-2">{['Tous', 'Validés', 'Non Validés'].map((filter) => <Button key={filter} variant={doctorValidationFilter === filter ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setDoctorValidationFilter(filter)}>{filter}</Button>)}</div>
                  </div>
                </Card.Body>
              </Card>
              {filteredMedecins.length === 0 ? <p className="text-center text-muted mt-3">Aucun médecin</p> : <Row>{filteredMedecins.map((user) => <Col md={4} key={user._id} className="mb-4"><Card className="shadow-sm h-100"><Card.Body><Card.Title className="d-flex justify-content-between align-items-center"><span>{user.nom} {user.prenom}</span><Badge bg={user.validated ? 'success' : 'warning'}>{user.validated ? 'Validé' : 'Non Validé'}</Badge></Card.Title><Card.Text><strong>Email:</strong> {user.email}</Card.Text><Card.Text><strong>Spécialité:</strong> {user.specialite || 'N/A'}</Card.Text><Card.Text><strong>Ville:</strong> {user.ville || 'N/A'}</Card.Text><Card.Text><strong>Localisation:</strong> {user.localisation || 'N/A'}</Card.Text><Card.Text><strong>Licence:</strong> {user.licenceProfessionnelle ? (isCloudinaryUrl(user.licenceProfessionnelle) ? <span className="text-danger bg-danger-subtle px-3 py-1 rounded-pill text-sm">Non accessible</span> : <a href={`https://pfe-express-js-2.onrender.com${user.licenceProfessionnelle}`} target="_blank" rel="noopener noreferrer" className="text-white bg-primary px-3 py-1 rounded-pill text-sm">Voir</a>) : <span className="text-muted bg-light px-3 py-1 rounded-pill text-sm">Non fournie</span>}</Card.Text><div className="d-flex justify-content-between mt-3">{!user.validated && <Button variant="success" size="sm" onClick={() => handleValidateDoctor(user._id)}>Valider</Button>}<Button variant="danger" size="sm" onClick={() => handleDeleteUser(user._id)}>Supprimer</Button></div></Card.Body></Card></Col>)}</Row>}
            </>
          )}

          {activeSection === 'patients' && (
            <>
              {patients.length === 0 ? <p className="text-center text-muted mt-3">Aucun patient</p> : <Row>{patients.map((user) => <Col md={4} key={user._id} className="mb-4"><Card className="shadow-sm h-100"><Card.Body><Card.Title>{user.nom} {user.prenom}</Card.Title><Card.Text><strong>Email:</strong> {user.email}</Card.Text><div className="d-flex justify-content-end mt-3"><Button variant="danger" size="sm" onClick={() => handleDeleteUser(user._id)}>Supprimer</Button></div></Card.Body></Card></Col>)}</Row>}
            </>
          )}

          {activeSection === 'admins' && (
            <>
              {admins.length === 0 ? <p className="text-center text-muted mt-3">Aucun admin</p> : <Row>{admins.map((user) => <Col md={4} key={user._id} className="mb-4"><Card className="shadow-sm h-100"><Card.Body><Card.Title>{user.nom} {user.prenom}</Card.Title><Card.Text><strong>Email:</strong> {user.email}</Card.Text><div className="d-flex justify-content-end mt-3"><Button variant="danger" size="sm" onClick={() => handleDeleteUser(user._id)} disabled={admins.length === 1}>Supprimer</Button></div></Card.Body></Card></Col>)}</Row>}
            </>
          )}

          {activeSection === 'appointments' && (
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>Liste des rendez-vous</h5>
                </div>
                <div className="mb-4">
                  <label>Filtrer par statut</label>
                  <div className="d-flex gap-2">{['Tous', 'Pending', 'Confirmed', 'Cancelled'].map((filter) => <Button key={filter} variant={appointmentStatusFilter === filter ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setAppointmentStatusFilter(filter)}>{filter === 'Pending' ? 'En attente' : filter === 'Confirmed' ? 'Confirmé' : filter === 'Cancelled' ? 'Annulé' : 'Tous'}</Button>)}</div>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead><tr><th>Patient</th><th>Médecin</th><th>Date</th><th>Heure</th><th>Statut</th></tr></thead>
                    <tbody>{paginatedAppointments.map((appointment) => <tr key={appointment._id}><td>{appointment.patientId ? `${appointment.patientId.nom} ${appointment.patientId.prenom}` : 'Inconnu'}</td><td>{appointment.doctorId ? `${appointment.doctorId.nom} ${appointment.doctorId.prenom}` : 'Inconnu'}</td><td>{new Date(appointment.date).toLocaleDateString('fr-FR')}</td><td>{appointment.time}</td><td><Badge bg={appointment.status === 'confirmed' ? 'success' : appointment.status === 'pending' ? 'warning' : 'danger'}>{appointment.status === 'confirmed' ? 'Confirmé' : appointment.status === 'pending' ? 'En attente' : 'Annulé'}</Badge></td></tr>)}</tbody>
                  </Table>
                </div>
                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                  <span className="text-muted">Affichage {((currentPageAppointments - 1) * itemsPerPage) + 1} à {Math.min(currentPageAppointments * itemsPerPage, filteredAppointments.length)} sur {filteredAppointments.length}</span>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePageChangeAppointments(currentPageAppointments - 1)} disabled={currentPageAppointments === 1}>Précédent</Button>
                    <Button variant="primary" size="sm">{currentPageAppointments}</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePageChangeAppointments(currentPageAppointments + 1)} disabled={currentPageAppointments === totalPagesAppointments}>Suivant</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {activeSection === 'forums' && (
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>Liste des forums</h5>
                  <Button variant="primary" size="sm" onClick={() => navigate('/create-forum')}><i className="fas fa-plus me-2"></i>Créer</Button>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead><tr><th>Titre</th><th>Description</th><th>Créé par</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>{paginatedForums.map((forum) => <tr key={forum._id}><td>{forum.title || 'N/A'}</td><td>{forum.description || 'N/A'}</td><td>{forum.createdBy?.name || 'Inconnu'}</td><td>{new Date(forum.createdAt).toLocaleDateString('fr-FR')}</td><td><Button variant="link" className="text-info p-1 me-2" onClick={() => handleViewForumResponses(forum._id)}><FaEye /></Button><Button variant="link" className="text-danger p-1" onClick={() => handleDeleteForum(forum._id)}><i className="fas fa-trash"></i></Button></td></tr>)}</tbody>
                  </Table>
                </div>
                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                  <span className="text-muted">Affichage {((currentPageForums - 1) * itemsPerPage) + 1} à {Math.min(currentPageForums * itemsPerPage, forums.length)} sur {forums.length}</span>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePageChangeForums(currentPageForums - 1)} disabled={currentPageForums === 1}>Précédent</Button>
                    <Button variant="primary" size="sm">{currentPageForums}</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePageChangeForums(currentPageForums + 1)} disabled={currentPageForums === totalPagesForums}>Suivant</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>Notifications</h5>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead><tr><th>Message</th><th>Médecin</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>
                      {paginatedNotifications.length === 0 ? (
                        <tr><td colSpan="5" className="text-center text-muted">Aucune notification</td></tr>
                      ) : (
                        paginatedNotifications.map((notification) => (
                          <tr key={notification._id}>
                            <td>{notification.message}</td>
                            <td>{notification.doctorId ? `${notification.doctorId.nom} ${notification.doctorId.prenom}` : 'Inconnu'}</td>
                            <td>{new Date(notification.createdAt).toLocaleDateString('fr-FR')}</td>
                            <td><Badge bg={notification.read ? 'success' : 'warning'}>{notification.read ? 'Lue' : 'Non Lue'}</Badge></td>
                            <td>
                              {!notification.read && (
                                <Button
                                  variant="link"
                                  className="text-success p-1"
                                  onClick={() => handleMarkNotificationAsRead(notification._id)}
                                >
                                  <FaCheck />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                  <span className="text-muted">Affichage {((currentPageNotifications - 1) * itemsPerPage) + 1} à {Math.min(currentPageNotifications * itemsPerPage, notifications.length)} sur {notifications.length}</span>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePageChangeNotifications(currentPageNotifications - 1)} disabled={currentPageNotifications === 1}>Précédent</Button>
                    <Button variant="primary" size="sm">{currentPageNotifications}</Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handlePageChangeNotifications(currentPageNotifications + 1)} disabled={currentPageNotifications === totalPagesNotifications}>Suivant</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </main>
      </div>

      {isModalOpen && currentUser && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 50 }}>
          <Card className="w-100" style={{ maxWidth: '500px' }}>
            <Card.Header className="d-flex justify-content-between align-items-center"><h5>Modifier utilisateur</h5><Button variant="link" onClick={() => setIsModalOpen(false)}><i className="fas fa-times text-muted"></i></Button></Card.Header>
            <form onSubmit={handleSubmitEdit}>
              <Card.Body>
                <div className="text-center mb-4"><div className="position-relative d-inline-block"><img src={currentUser.profileImage ? (isCloudinaryUrl(currentUser.profileImage) ? currentUser.profileImage : `https://pfe-express-js-2.onrender.com${currentUser.profileImage.replace(/^\/+/, '')}`) : '/placeholder-profile-image.jpg'} alt={currentUser.name} className="rounded-circle" style={{ width: '96px', height: '96px', objectFit: 'cover' }} onError={(e) => (e.target.src = '/placeholder-profile-image.jpg')} /><Button variant="primary" size="sm" className="position-absolute bottom-0 end-0 rounded-circle p-2"><i className="fas fa-camera"></i></Button></div></div>
                <div className="mb-3"><label className="form-label">Nom complet</label><input type="text" name="name" className="form-control" defaultValue={currentUser.name} /></div>
                <div className="mb-3"><label className="form-label">Email</label><input type="email" name="email" className="form-control" defaultValue={currentUser.email} /></div>
                <div className="mb-3"><label className="form-label">Type</label><select name="type" className="form-select" defaultValue={currentUser.type}><option value="Patient">Patient</option><option value="Médecin">Médecin</option><option value="Admin">Admin</option></select></div>
                <div className="mb-3"><label className="form-label">Statut</label><div className="d-flex gap-3"><div className="form-check"><input type="radio" id="status-active" name="status" value="Actif" defaultChecked={currentUser.status === 'Actif'} className="form-check-input" /><label htmlFor="status-active" className="form-check-label">Actif</label></div><div className="form-check"><input type="radio" id="status-inactive" name="status" value="Inactif" defaultChecked={currentUser.status === 'Inactif'} className="form-check-input" /><label htmlFor="status-inactive" className="form-check-label">Inactif</label></div></div></div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-end gap-2"><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button><Button type="submit" variant="primary">Enregistrer</Button></Card.Footer>
            </form>
          </Card>
        </div>
      )}

      {showSuccessNotification && (
        <div className="position-fixed bottom-0 end-0 m-4 bg-success text-white px-4 py-3 rounded shadow" style={{ zIndex: 50 }}><i className="fas fa-check-circle me-2"></i>{notificationMessage}</div>
      )}
    </div>
  );
};

export default AdminDashboard;