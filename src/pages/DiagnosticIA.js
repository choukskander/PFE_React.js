import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DiagnosticIA = () => {
  const [lang, setLang] = useState('fr');
  const [symptoms, setSymptoms] = useState([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [useTextInput, setUseTextInput] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await axios.get(`https://pfe-express-js-2.onrender.com/api/symptoms/${lang}`);
        if (response.data.length === 0) {
          setError('Aucun symptôme disponible pour cette langue. Veuillez vérifier les données.');
        }
        setSymptoms(response.data || []);
        setFilteredSymptoms(response.data || []);
      } catch (err) {
        console.error('Erreur lors de la récupération :', err);
        setError('Erreur lors de la récupération des symptômes');
      }
    };
    fetchSymptoms();
  }, [lang]);

  const handleDiagnose = async () => {
    try {
      const response = await axios.post('https://pfe-express-js-2.onrender.com/api/diagnostic', {
        symptoms: useTextInput ? null : selectedSymptoms,
        text: useTextInput ? text : null,
        lang
      });
      setResult(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du diagnostic');
      setResult(null);
    }
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const filterSymptoms = (value) => {
    const filtered = symptoms.filter(s => s.toLowerCase().includes(value.toLowerCase()));
    setFilteredSymptoms(filtered);
  };

  const translations = {
    en: {
      title: 'Disease Diagnosis | Expert System',
      label: 'Select Your Symptoms',
      placeholder: 'Search for symptoms...',
      delete: 'Remove Selected Symptoms',
      reset: 'Clear All',
      diagnose: 'Get Diagnosis',
      select_language: 'Choose Language',
      back: 'Back'
    },
    fr: {
      title: 'Diagnostic des Maladies | Système Expert',
      label: 'Sélectionnez vos symptômes',
      placeholder: 'Recherchez des symptômes...',
      delete: 'Supprimer les symptômes sélectionnés',
      reset: 'Réinitialiser',
      diagnose: 'Diagnostiquer',
      select_language: 'Choisir la langue',
      back: 'Retour'
    },
    ar: {
      title: 'تشخيص الأمراض | نظام خبير',
      label: 'اختر أعراضك',
      placeholder: 'ابحث عن الأعراض...',
      delete: 'حذف الأعراض المختارة',
      reset: 'إعادة تعيين',
      diagnose: 'تشخيص',
      select_language: 'اختر اللغة',
      back: 'رجوع'
    }
  };

  const languages = { en: 'English', fr: 'Français', ar: 'العربية' };
  const direction = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div style={{ direction, textAlign: lang === 'ar' ? 'right' : 'left' }} className="container mt-4">

      {/* ✅ Header avec Retour + Sélecteur de langue */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate(-1)}
        >
          &larr; {translations[lang].back}
        </button>

        <div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="form-select w-auto"
          >
            {Object.entries(languages).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ Titre principal */}
      <h1 className="mb-4">{translations[lang].title}</h1>

      <div className="row">
        {/* Colonne gauche - Sélection des symptômes */}
        <div className="col-md-6">
          {useTextInput ? (
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="3"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={translations[lang].placeholder}
              />
            </div>
          ) : (
            <div className="mb-3">
              <h4>{translations[lang].label}</h4>
              <input
                type="text"
                className="form-control mb-2"
                placeholder={translations[lang].placeholder}
                onChange={(e) => filterSymptoms(e.target.value)}
              />
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                {filteredSymptoms.map((symptom, index) => (
                  <div key={index} className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => toggleSymptom(symptom)}
                    />
                    <label className="form-check-label">{symptom}</label>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <strong>Selected Symptoms:</strong>
                <div>
                  {selectedSymptoms.map((symptom, index) => (
                    <span key={index} className="badge bg-primary me-1">{symptom}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div>
            <button className="btn btn-danger me-2" onClick={() => setSelectedSymptoms([])}>{translations[lang].delete}</button>
            <button className="btn btn-secondary me-2" onClick={() => { setSelectedSymptoms([]); setText(''); }}>{translations[lang].reset}</button>
            <button className="btn btn-success" onClick={handleDiagnose}>{translations[lang].diagnose}</button>
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>

        {/* Colonne droite - Résultat du diagnostic */}
        <div className="col-md-6">
          <h2>
            {result && result.status === 'success'
              ? result.diseases.length === 0
                ? result.messages.no_disease_detected
                : result.messages.probably_have
              : 'Résultat du diagnostic'}
          </h2>
          <div className="mt-4">
            {result && result.status === 'success' && result.diseases.length > 0 ? (
              result.diseases.map((disease, index) => (
                <div key={index} className="card mb-3">
                  <div className="card-body">
                    <h5 className="card-title">{disease.name}</h5>
                    <p className="card-text">{disease.description}</p>
                    <h6>{result.messages.precautions}</h6>
                    <ul>
                      {disease.precautions.map((precaution, i) => (
                        <li key={i}>{precaution}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : result && result.status === 'error' ? (
              <p className="text-danger">{result.message}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticIA;
