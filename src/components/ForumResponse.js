import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Checkbox, Radio, Select, Button, message, Card, Typography } from "antd";
import Navbar from "../pages/Navbar";
import axios from "axios";

const { TextArea } = Input;
const { Title, Text } = Typography;

const ForumResponse = () => {
  const { id } = useParams();
  const [forum, setForum] = useState(null);
  const [responses, setResponses] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForumAndResponses = async () => {
      try {
        const token = localStorage.getItem("token");

        // Récupérer les détails du forum
        const forumResponse = await axios.get(`https://pfe-express-js-2.onrender.com/api/forum/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForum(forumResponse.data.data);

        // Récupérer les réponses associées au forum
        const responsesResponse = await axios.get(`https://pfe-express-js-2.onrender.com/api/forum/responses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResponses(responsesResponse.data.data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        message.error("Erreur lors du chargement du forum ou des réponses.");
      }
    };
    fetchForumAndResponses();
  }, [id]);

  const onFinish = async (values) => {
    const responsesToSubmit = Object.keys(values).map((key) => ({
      label: forum.fields.find((field) => field.label === key)?.label || key,
      value: values[key],
    }));

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://pfe-express-js-2.onrender.com/api/forum/responses",
        { forumId: id, responses: responsesToSubmit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Réponse soumise avec succès!");
      // Ajouter la nouvelle réponse à la liste sans recharger
      setResponses([...responses, response.data.data]);
      form.resetFields(); // Réinitialiser le formulaire après soumission
    } catch (error) {
      message.error("Erreur lors de la soumission de la réponse.");
    }
  };

  if (!forum) return <div style={{ textAlign: "center", padding: "50px" }}>Chargement...</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Navbar style={{ position: "sticky", top: 0, zIndex: 1000, backgroundColor: "#fff" }} />
      <div style={{ padding: "20px", paddingTop: "70px", maxWidth: "800px", margin: "0 auto" }}>
        {/* Détails du Forum */}
        <Card
          style={{
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
            marginBottom: "20px",
          }}
        >
          <Title level={3} style={{ color: "#1890ff", textAlign: "center" }}>
            {forum.title}
          </Title>
          <Text style={{ display: "block", textAlign: "center", color: "#666", marginBottom: "10px" }}>
            {forum.description}
          </Text>
          <Text style={{ display: "block", textAlign: "center", color: "#999" }}>
            <strong>Créé par :</strong> {forum.createdBy.name} ({forum.createdBy.specialty})
          </Text>
        </Card>

        {/* Formulaire de Réponse */}
        <Card
          title="Votre Réponse"
          style={{
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            backgroundColor: forum.backgroundColor || "#fff",
            marginBottom: "20px",
          }}
        >
          <Form form={form} onFinish={onFinish} layout="vertical">
            {forum.fields.map((field) => {
              let inputComponent;
              switch (field.type) {
                case "text":
                  inputComponent = <Input />;
                  break;
                case "TextArea":
                  inputComponent = <TextArea rows={4} />;
                  break;
                case "number":
                  inputComponent = <Input type="number" />;
                  break;
                case "date":
                  inputComponent = <Input type="date" />;
                  break;
                case "checkbox":
                  inputComponent = (
                    <Checkbox.Group>
                      {field.options && field.options.length > 0 ? (
                        field.options.map((option) => (
                          <Checkbox key={option} value={option}>
                            {option}
                          </Checkbox>
                        ))
                      ) : (
                        <Text type="warning">Aucune option définie</Text>
                      )}
                    </Checkbox.Group>
                  );
                  break;
                case "radio":
                  inputComponent = (
                    <Radio.Group>
                      {field.options && field.options.length > 0 ? (
                        field.options.map((option) => (
                          <Radio key={option} value={option}>
                            {option}
                          </Radio>
                        ))
                      ) : (
                        <Text type="warning">Aucune option définie</Text>
                      )}
                    </Radio.Group>
                  );
                  break;
                case "select":
                  inputComponent = (
                    <Select>
                      {field.options && field.options.length > 0 ? (
                        field.options.map((option) => (
                          <Select.Option key={option} value={option}>
                            {option}
                          </Select.Option>
                        ))
                      ) : (
                        <Select.Option disabled value="">
                          Aucune option disponible
                        </Select.Option>
                      )}
                    </Select>
                  );
                  break;
                case "email":
                  inputComponent = <Input type="email" />;
                  break;
                case "phone":
                  inputComponent = <Input type="tel" />;
                  break;
                default:
                  inputComponent = <Input />;
              }
              return (
                <Form.Item
                  key={field.label}
                  name={field.label}
                  label={
                    <span
                      style={{
                        fontSize: field.labelFontSize || "16px",
                        fontWeight: field.labelFontWeight || "bold",
                        color: field.labelColor || "#333",
                      }}
                    >
                      {field.label}
                    </span>
                  }
                  rules={[{ required: field.required, message: `Veuillez remplir ${field.label}` }]}
                >
                  {inputComponent}
                </Form.Item>
              );
            })}
            <Form.Item style={{ textAlign: "center" }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  backgroundColor: "#1890ff",
                  borderColor: "#1890ff",
                  marginRight: "10px",
                }}
              >
                Soumettre Réponse
              </Button>
              <Button
                onClick={() => navigate("/forums")}
                style={{
                  backgroundColor: "#f0f0f0",
                  borderColor: "#d9d9d9",
                  color: "#333",
                }}
              >
                Retour à la liste des forums
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Section des Réponses Existantes */}
        <Card
          title="Réponses Soumises"
          style={{
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
          }}
        >
          {responses.length === 0 ? (
            <Text style={{ display: "block", textAlign: "center", color: "#999" }}>
              Aucune réponse soumise pour le moment.
            </Text>
          ) : (
            responses.map((response, index) => (
              <div
                key={index}
                style={{
                  borderBottom: index < responses.length - 1 ? "1px solid #e8e8e8" : "none",
                  padding: "10px 0",
                }}
              >
                <Text style={{ display: "block", fontWeight: "bold", color: "#333" }}>
                  Réponse #{index + 1}
                </Text>
                {response.responses.map((item, idx) => (
                  <div key={idx} style={{ margin: "5px 0" }}>
                    <Text style={{ color: "#666" }}>
                      <strong>{item.label}:</strong> {Array.isArray(item.value) ? item.value.join(", ") : item.value}
                    </Text>
                  </div>
                ))}
                <Text style={{ display: "block", color: "#999", fontSize: "12px", marginTop: "5px" }}>
                  Soumis le : {new Date(response.createdAt).toLocaleDateString()}
                </Text>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForumResponse;