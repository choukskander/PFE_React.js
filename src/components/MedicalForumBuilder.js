import React, { useState, useEffect } from "react";
import { Row, Col, Input, Form, Button, ColorPicker } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import classes from "./Forms.module.css";
import DraggableInput from "./DraggableInput/DraggableInput";
import DroppedInput from "./DroppedInput/DroppedInput";
import AddItemForm from "./AddItemForm/AddItemForm";
import axios from "axios";
import Navbar from "../pages/Navbar";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const { TextArea } = Input;

const MedicalForumBuilder = () => {
  const [form] = Form.useForm();
  const [droppedItems, setDroppedItems] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInputDetails, setSelectedInputDetails] = useState({});
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Sidebar states
  const [activeSection, setActiveSection] = useState("create-forum");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [forums, setForums] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Fetch users data
        const usersResponse = await axios.get("https://pfe-express-js-2.onrender.com/api/auth/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersResponse.data);

        // Fetch appointments data
        const appointmentsResponse = await axios.get("https://pfe-express-js-2.onrender.com/api/appointments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(appointmentsResponse.data);

        // Fetch forums data
        const forumsResponse = await axios.get("https://pfe-express-js-2.onrender.com/api/forum", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForums(forumsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const medecins = users.filter((user) => user.role === "internaute");
  const patients = users.filter((user) => user.role === "patient");
  const admins = users.filter((user) => user.role === "admin");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const onDragStart = (e, id, label, type, options) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, label, type, options }));
  };

  const onDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    setDroppedItems([
      ...droppedItems,
      {
        ...data,
        id: Date.now().toString(),
        required: false,
        labelColor: "#000000",
        labelFontSize: 14,
        labelFontWeight: 400,
        options: ["select", "checkbox", "radio"].includes(data.type)
          ? ["Option 1", "Option 2"] // Default options
          : undefined,
      },
    ]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const showDrawer = (id, label, type, options, required, labelColor, labelFontSize, labelFontWeight) => {
    setSelectedInputDetails({
      id,
      label,
      type,
      options: options || [], // Ensure options is always an array
      required,
      labelColor,
      labelFontSize,
      labelFontWeight,
    });
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const updateItem = (updatedItem) => {
    setDroppedItems(
      droppedItems.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )
    );
    closeDrawer();
  };

  const deleteItem = (id) => {
    setDroppedItems(droppedItems.filter((item) => item.id !== id));
  };

  const onFinish = async (values) => {
    if (!user) {
      alert("Utilisateur non connecté. Veuillez vous reconnecter.");
      navigate("/login");
      return;
    }

    const forumData = {
      title: values.title,
      description: values.description,
      backgroundColor: values.backgroundColor?.toHexString
        ? values.backgroundColor.toHexString()
        : "#ffffff",
      createdBy: {
        id: user._id,
        name: `${user.nom} ${user.prenom}`,
        specialty: values.specialty || "Non spécifié",
      },
      fields: droppedItems.map((item) => ({
        label: item.label,
        type: item.type,
        options: ["select", "checkbox", "radio"].includes(item.type)
          ? item.options || []
          : undefined,
        required: item.required,
        labelColor: item.labelColor?.toHexString
          ? item.labelColor.toHexString()
          : "#000000",
        labelFontSize: item.labelFontSize,
        labelFontWeight: item.labelFontWeight,
      })),
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("https://pfe-express-js-2.onrender.com/api/forum", forumData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Forum created:', response.data); // Debug log
      alert("Forum créé avec succès !");
      navigate(user.role === "admin" ? "/admin-dashboard" : "/forums");
    } catch (error) {
      console.error("Erreur:", error.response?.data || error.message);
      alert("Erreur lors de la création du forum: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Sidebar pour les admins */}
      {user?.role === "admin" && (
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          medecins={medecins}
          patients={patients}
          admins={admins}
          appointments={appointments}
          forums={forums}
          handleLogout={handleLogout}
        />
      )}

      <div
        style={{
          marginLeft: user?.role === "admin" ? (sidebarOpen ? "250px" : "80px") : "0",
          transition: "all 0.3s ease-in-out",
          flex: 1,
        }}
      >
        {/* Navbar pour les médecins */}
        {user?.role === "internaute" && <Navbar />}

        <main className="p-4">
          <div className="container vstack gap-4 mb-5 mt-10">
            <div className="row mb-5 card rounded-3 border p-4 pb-2">
              <div className="col-12 mb-5 mt-3">
                <h1 className="fs-4 mb-0">
                  <PlusOutlined className="mx-3" />
                  Créer un Forum Médical
                </h1>
              </div>

              <Row gutter={[16, 16]} style={{ width: "900vw", margin: "0 auto" }}>
                {/* Éléments de formulaire */}
                <Col lg={6} className={classes.availableFields}>
                  <h5>Éléments de formulaire</h5>
                  <Row gutter={[8, 8]} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%" }}>
                    {["text", "number", "date", "checkbox", "radio", "select", "password", "email", "phone", "upload"].map((type, index) => (
                      <DraggableInput
                        key={index + 1}
                        id={(index + 1).toString()}
                        label={type.charAt(0).toUpperCase() + type.slice(1)}
                        type={type}
                        prefix={<PlusOutlined />}
                      />
                    ))}
                  </Row>
                </Col>

                {/* Zone de création du formulaire */}
                <Col lg={18} className={classes.formSection}>
                  <div className={classes.infoHeader}>ⓘ Informations du Formulaire Médical</div>
                  <Form form={form} onFinish={onFinish} layout="vertical">
                    <div className={classes.formCard}>
                      <Form.Item
                        name="title"
                        label="Titre :"
                        rules={[{ required: true, message: "Veuillez entrer le titre" }]}
                      >
                        <Input placeholder="Entrez le titre" />
                      </Form.Item>

                      <Form.Item
                        name="description"
                        label="Description :"
                        rules={[{ required: true, message: "Veuillez entrer la description" }]}
                      >
                        <TextArea placeholder="Entrez la description" rows={4} />
                      </Form.Item>

                      <Form.Item
                        name="specialty"
                        label="Spécialité :"
                        rules={[{ required: true, message: "Veuillez entrer votre spécialité" }]}
                      >
                        <Input placeholder="Entrez votre spécialité" />
                      </Form.Item>

                      <Form.Item name="backgroundColor" label="Couleur Arrière-plan :">
                        <ColorPicker defaultValue="#ffffff" />
                      </Form.Item>

                      <div
                        className={classes.dropArea}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                      >
                        <p>+ Glissez les éléments ici</p>
                        {droppedItems.map((item) => (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                            <DroppedInput {...item} />
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => showDrawer(
                                item.id,
                                item.label,
                                item.type,
                                item.options,
                                item.required,
                                item.labelColor,
                                item.labelFontSize,
                                item.labelFontWeight
                              )}
                              style={{ marginLeft: "10px" }}
                            />
                            <Button
                              icon={<DeleteOutlined />}
                              onClick={() => deleteItem(item.id)}
                              style={{ marginLeft: "10px" }}
                              danger
                            />
                          </div>
                        ))}
                      </div>

                      <Form.Item>
                        <Button type="primary" htmlType="submit">
                          Enregistrer
                        </Button>
                      </Form.Item>
                    </div>
                  </Form>
                </Col>
              </Row>
            </div>
          </div>
        </main>

        {/* Drawer d'édition */}
        <AddItemForm
          visible={drawerVisible}
          onClose={closeDrawer}
          onAddItem={updateItem}
          selectedInputDetails={selectedInputDetails}
        />
      </div>
    </div>
  );
};

export default MedicalForumBuilder;