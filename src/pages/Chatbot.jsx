import React, { useState } from 'react';
import { Button, Input, Spin, Upload, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Chatbot.css';

const Chatbot = () => {

  const API_KEY = 'AIzaSyCw0KBz426w72-jNGtlDo6q3Y-f6svfZZU';

  const [symptomInput, setSymptomInput] = useState('');
  const [responseData, setResponseData] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const { Dragger } = Upload;

  // Convertir une image en base64 pour Gemini
  const fileToGenerativePart = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: { data: base64Data, mimeType: file.type },
        });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Fonction principale d'appel à l’API Gemini
  const fetchDiagnosis = async (modelType = 'gemini-2.0-flash', imageParts = null) => {
    if (!symptomInput.trim() && !imageParts) {
      Swal.fire({
        icon: 'warning',
        title: 'Entrée vide',
        text: 'Veuillez entrer un symptôme ou uploader une image.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    setLoading(true);
    setResponseData('');

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: modelType });

      const prompt = imageParts
        ? `Je suis un patient. Voici une image de mes symptômes. Quelle pourrait être la maladie probable ? Répondez en français et précisez clairement que ceci n'est PAS un diagnostic médical et que je dois consulter un médecin.`
        : `Je suis un patient. J'ai les symptômes suivants : ${symptomInput}. Quelle pourrait être la maladie probable ? Répondez en français et précisez clairement que ceci n'est PAS un diagnostic médical et que je dois consulter un médecin.`;

      const content = imageParts ? [prompt, ...imageParts] : prompt;
      const result = await model.generateContent(content);

      const text = result.response.text();
      setResponseData(text);
    } catch (error) {
      console.error('Erreur lors de la récupération du diagnostic:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur API',
        text: `Erreur lors de l’analyse. Vérifiez la clé API et le modèle. (${error.message || error})`,
        toast: true,
        position: 'top-end',
        timer: 5000,
        timerProgressBar: true,
      });
      setResponseData("⚠️ Une erreur est survenue lors de la communication avec Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextDiagnosis = () => fetchDiagnosis('gemini-2.0-flash');
  const handleVisionDiagnosis = async (file) => {
    setSymptomInput('');
    const imageParts = await fileToGenerativePart(file);
    fetchDiagnosis('gemini-2.0-flash', [imageParts]);
  };

  const openModal = () => {
    setModalVisible(true);
    setSymptomInput('');
    setResponseData('');
    setLoading(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSymptomInput('');
    setResponseData('');
    setLoading(false);
  };

  return (
    <>
      {/* Bouton Chatbot */}
      <div
        className="custumer_chatbot_icon_button"
        onClick={openModal}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal(); }}
      >
        <img src="/chatbot-icon.png" alt="Chatbot icon" className="cusumer_img img-fluid" />
      </div>

      {/* Fenêtre principale */}
      <Modal
        style={{ top: 20 }}
        open={modalVisible}
        title="Commencez vos questions médicales"
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <div className="gemini-container">
          <p className="text-justify my-2">
            <strong>⚠️ Attention : Ceci n’est pas un diagnostic médical. Consultez un médecin en cas de doute.</strong>
          </p>

          <div className="gemini-card">
            {/* Upload d'image */}
            <Dragger
              className="my-3"
              accept=".jpg,.jpeg,.png"
              multiple={false}
              beforeUpload={() => false}
              showUploadList={false}
              onChange={(info) => {
                const file = info.fileList[0]?.originFileObj;
                if (file && file.size / 1024 / 1024 < 5) {
                  handleVisionDiagnosis(file);
                } else if (file) {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Fichier trop volumineux',
                    text: 'Image max 5 Mo.',
                    toast: true,
                    position: 'top-end',
                    timer: 3000,
                    timerProgressBar: true,
                  });
                }
              }}
              disabled={loading}
            >
              <p className="ant-upload-drag-icon"><UploadOutlined /></p>
              <p className="ant-upload-text">Cliquez ou glissez une image ici</p>
              <p className="ant-upload-hint">Formats: .jpg, .jpeg, .png — Max 5MB</p>
            </Dragger>

            {/* Saisie texte */}
            <Input
              className="text-input my-3"
              placeholder="Entrez vos symptômes (ex: fièvre, toux)"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onPressEnter={handleTextDiagnosis}
              disabled={loading}
            />

            {/* Bouton analyse */}
            <div className="text-center">
              <Button
                className="pro-button mt-3"
                type="primary"
                onClick={handleTextDiagnosis}
                disabled={loading || !symptomInput.trim()}
              >
                {loading ? 'Analyse en cours...' : 'Analyser les symptômes'}
              </Button>
            </div>

            {/* Résultat */}
            <div className="response-container mt-4">
              {loading ? (
                <div className="text-center"><Spin size="large" tip="Analyse en cours..." /></div>
              ) : (
                responseData && (
                  <>
                    <p className="diagnosis-result">{responseData}</p>
                    <p className="warning-text">⚠️ Ceci n’est pas un avis médical. Consultez un professionnel.</p>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Chatbot;
