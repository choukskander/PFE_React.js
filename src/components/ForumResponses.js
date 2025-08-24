import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { List, Card, Button, Spin, Typography, Alert } from "antd";
import axios from "axios";

const { Title, Text } = Typography;

const ForumResponses = () => {
  const { forumId } = useParams();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!['internaute', 'admin'].includes(user.role)) {
      setError("Accès refusé. Seuls les médecins et administrateurs peuvent voir les réponses.");
      navigate(user.role === 'admin' ? '/admin-dashboard' : '/forums');
      return;
    }

    const fetchResponses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`https://pfe-express-js-2.onrender.comapi/forum/responses/${forumId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResponses(response.data.data || []);
        setError(null);
      } catch (err) {
        setError("Erreur lors du chargement des réponses.");
        console.error("Erreur lors du chargement des réponses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, [forumId, navigate, user.role]);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spin size="large" tip="Chargement des réponses..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: "20px" }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2} style={{ marginBottom: "24px", color: "#1890ff" }}>
        Réponses au Forum
      </Title>
      <Button
        type="primary"
        style={{ marginBottom: "24px", backgroundColor: "#1890ff", borderColor: "#1890ff" }}
        onClick={() => navigate(user.role === 'admin' ? '/admin-dashboard' : '/forums')}
      >
        Retour à la liste des forums
      </Button>
      <Card
        title={<Text strong style={{ fontSize: "18px", color: "#333" }}>Liste des Réponses</Text>}
        bordered={false}
        style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }}
      >
        <List
          itemLayout="vertical"
          dataSource={responses}
          locale={{ emptyText: "Aucune réponse disponible." }}
          renderItem={(response) => (
            <List.Item
              style={{
                padding: "16px",
                borderBottom: "1px solid #f0f0f0",
                borderRadius: "4px",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Card
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: "6px",
                  background: "#fff",
                  padding: "12px",
                }}
              >
                <Title level={4} style={{ marginBottom: "12px", color: "#1890ff" }}>
                  <strong>Soumis par:</strong> {response.submittedBy.nom} {response.submittedBy.prenom}
                </Title>
                {response.responses.map((res, index) => (
                  <Text key={index} style={{ display: "block", marginBottom: "8px", color: "#555" }}>
                    <strong style={{ color: "#1890ff" }}>{res.label}:</strong> {res.value.toString()}
                  </Text>
                ))}
              </Card>
            </List.Item>
          )}
          style={{ background: "#fff" }}
        />
      </Card>
    </div>
  );
};

export default ForumResponses;