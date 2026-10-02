"use client";

import { useState, useEffect } from "react";
import api from "../../../utils/api";
import "./newprof.css";
import Felicitation from "../../../assets/NewProf_assets/felicitations.png";
import maleDefaultPic from "../../../assets/ProfPage_assets/profilePicture.png";
import femaleDefaultPic from "../../../assets/ProfPage_assets/Prof.png";
import { useNavigate } from "react-router-dom";

const NewProf = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [grades, setGrades] = useState([]);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    naissance: "",
    sexe: "Male",
    email: "",
    telephone: "",
    profilePic: null,
    grade: "",
    affiliation: "De récole",
    chargeHeure: "",
    enseignantResponsable: true,
    matiere: "Resaux",
    methodePaiement: "CCP",
    numeroCompte: "",
    codeBancaire: "",
  });

  useEffect(() => {
    // Fetch grades dynamically from the backend
    const fetchGrades = async () => {
      try {
        const response = await api.get('/grades');
        setGrades(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, grade: response.data[0].id.toString() }));
        }
      } catch (err) {
        console.error("Failed to fetch grades:", err);
        setError("Impossible de charger les grades depuis le serveur.");
      }
    };
    fetchGrades();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (error) setError(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData({ ...formData, profilePic: file });
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const navigate = useNavigate();

  const handlePlanning = (e) => {
    e.preventDefault();
    navigate("/Planning");
  };

  // Validate fields for a given step
  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 1) {
      if (!formData.nom.trim()) errors.nom = "Le nom est obligatoire";
      if (!formData.prenom.trim()) errors.prenom = "Le prénom est obligatoire";
      if (!formData.naissance) errors.naissance = "La date de naissance est obligatoire";
      if (!formData.email.trim()) errors.email = "L'email est obligatoire";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Format d'email invalide";
      if (!formData.telephone.trim()) errors.telephone = "Le numéro de téléphone est obligatoire";
    } else if (currentStep === 2) {
      if (!formData.chargeHeure || Number(formData.chargeHeure) <= 0)
        errors.chargeHeure = "La charge horaire est obligatoire et doit être supérieure à 0";
      if (!formData.grade) errors.grade = "Veuillez sélectionner un grade";
    } else if (currentStep === 3) {
      if (formData.methodePaiement === "CCP" && !formData.numeroCompte.trim())
        errors.numeroCompte = "Le numéro de compte CCP est obligatoire";
      if (formData.methodePaiement === "Bancaire" && !formData.codeBancaire.trim())
        errors.codeBancaire = "Le code bancaire est obligatoire";
    }
    return errors;
  };

  const nextStep = () => {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError(null);
    step < 3 && setStep(step + 1);
  };

  const prevStep = () => {
    setFieldErrors({});
    setError(null);
    step > 1 && setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Validate step 3 before submitting
    const errors = validateStep(3);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const formattedDate = formData.naissance
        ? new Date(formData.naissance).toISOString()
        : null;

      const genre = formData.sexe === "Male" ? "Male" : "Female";
      const typeCompte = formData.methodePaiement === "CCP" ? "Postal" : "Bancaire";
      const vacataire = formData.enseignantResponsable;

      let matiere;
      switch (formData.matiere.toLowerCase()) {
        case "réseaux":
        case "resaux":
        case "reseaux":
          matiere = "Resaux";
          break;
        case "algo":
        case "algorithme":
          matiere = "Algo";
          break;
        case "système":
        case "systeme":
        case "system":
          matiere = "Systeme";
          break;
        default:
          matiere = "Resaux";
      }

      // Fetch or create a PeriodeTravail
      let periodeTravailId;
      try {
        const periodResponse = await api.get("/periode-travail/open");
        if (periodResponse.data && periodResponse.data.id) {
          periodeTravailId = periodResponse.data.id;
        } else {
          const now = new Date();
          const endDate = new Date(now.getFullYear(), 11, 31);
          const newPeriod = await api.post("/periode-travail", {
            dateDebut: now.toISOString(),
            dateFin: endDate.toISOString(),
          });
          periodeTravailId = newPeriod.data.id;
        }
      } catch (periodError) {
        console.error("Error fetching/creating period:", periodError);
        periodeTravailId = 1;
      }

      const teacherData = {
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        dateNaissance: formattedDate,
        genre: genre,
        numeroTelephone: formData.telephone,
        numeroCompte:
          formData.methodePaiement === "CCP"
            ? formData.numeroCompte
            : formData.codeBancaire,
        typeCompte: typeCompte,
        charge: Number.parseInt(formData.chargeHeure) || 0,
        matiere: matiere,
        droitHeuresSup: formData.enseignantResponsable,
        vacataire: vacataire,
        gradeId: Number.parseInt(formData.grade),
        periodeTravailId: periodeTravailId,
      };

      // Handle image upload to Cloudinary if a profile picture was selected
      if (formData.profilePic) {
        try {
          console.log("Uploading image to Cloudinary...");
          const imageFormData = new FormData();
          imageFormData.append("image", formData.profilePic);

          const imageResponse = await api.post("/upload-image", imageFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          console.log("Image uploaded successfully:", imageResponse.data);

          if (imageResponse.data && imageResponse.data.data) {
            teacherData.imageUrl = imageResponse.data.data.secure_url;
            teacherData.imagePublicId = imageResponse.data.data.public_id;
          }
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          // Continue with teacher creation even if image upload fails
        }
      }

      console.log("Sending teacher data to API:", teacherData);

      const response = await api.post("/teachers/", teacherData);
      console.log("Teacher created successfully:", response.data);

      setStep(4);
    } catch (error) {
      console.error("Error creating teacher:", error);

      let errorMessage = "Échec de la création de l'enseignant";
      if (error.response) {
        errorMessage =
          error.response.data.erreur ||
          error.response.data.error ||
          error.response.data.message ||
          errorMessage;
        console.error("Server response:", error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onClose();
    navigate("/prof");
  };

  const getPreviewImage = () => {
    if (imagePreview) {
      return imagePreview;
    }
    return formData.sexe === "Male" ? maleDefaultPic : femaleDefaultPic;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {step < 4 ? (
          <>
            <div className="modal-header">
              <h2>
                {step === 1 && "Informations personnelles"}
                {step === 2 && "Informations académiques"}
                {step === 3 && "Informations de paiement"}
              </h2>
              <p>
                {step === 1 && "Fournissez les informations nécessaires"}
                {step === 2 && "Complétez les détails académiques"}
                {step === 3 && "Renseignez les informations de paiement"}
              </p>
              <button className="close-button" onClick={onClose}>
                ×
              </button>
            </div>

            <div className="progress-bar">
              <div className={`step-indicator ${step >= 1 ? "active" : ""}`}>
                1
              </div>
              <div className={`step-indicator ${step >= 2 ? "active" : ""}`}>
                2
              </div>
              <div className={`step-indicator ${step >= 3 ? "active" : ""}`}>
                3
              </div>
            </div>

            {error && (
              <div className="error-banner">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            <div className="form-step-scrollable">
              {step === 1 && (
                <div className="form-step">
                  <div className="name-section">
                    <div className="name-fields">
                      <div className={`form-group ${fieldErrors.nom ? "has-error" : ""}`}>
                        <label>Nom <span className="required">*</span></label>
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          placeholder="Ex: Boussaid"
                        />
                        {fieldErrors.nom && <span className="field-error">{fieldErrors.nom}</span>}
                      </div>
                      <div className={`form-group ${fieldErrors.prenom ? "has-error" : ""}`}>
                        <label>Prénom <span className="required">*</span></label>
                        <input
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleChange}
                          placeholder="Ex: Mohamed"
                        />
                        {fieldErrors.prenom && <span className="field-error">{fieldErrors.prenom}</span>}
                      </div>
                    </div>
                    <label className="file-upload-container">
                      <div className="file-upload-content">
                        {imagePreview || formData.sexe ? (
                          <img
                            src={getPreviewImage() || "/placeholder.svg"}
                            alt="Preview"
                            className="image-preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <>
                            <span className="upload-icon">+</span>
                            <span>Drop image here</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="file-input-hidden"
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <div className={`form-group half-width ${fieldErrors.naissance ? "has-error" : ""}`}>
                      <label>Naissance <span className="required">*</span></label>
                      <input
                        type="date"
                        name="naissance"
                        value={formData.naissance}
                        onChange={handleChange}
                      />
                      {fieldErrors.naissance && <span className="field-error">{fieldErrors.naissance}</span>}
                    </div>
                    <div className="form-group half-width">
                      <label>Sexe</label>
                      <select
                        name="sexe"
                        value={formData.sexe}
                        onChange={handleChange}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className={`form-group ${fieldErrors.email ? "has-error" : ""}`}>
                    <label>Email <span className="required">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Ex: m.boussaid@esi.dz"
                    />
                    {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                  </div>

                  <div className={`form-group ${fieldErrors.telephone ? "has-error" : ""}`}>
                    <label>Numéro de tél <span className="required">*</span></label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="Ex: 0555123456"
                    />
                    {fieldErrors.telephone && <span className="field-error">{fieldErrors.telephone}</span>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="form-step">
                  <div className={`form-group ${fieldErrors.grade ? "has-error" : ""}`}>
                    <label>Grade <span className="required">*</span></label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                    >
                      <option value="" disabled>Sélectionnez un grade</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.id}>
                          {grade.nom === "PROF" ? "Professeur (PROF)" :
                           grade.nom === "MCA" ? "Maître de conférence A (MCA)" :
                           grade.nom === "MCB" ? "Maître de conférence B (MCB)" : grade.nom}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.grade && <span className="field-error">{fieldErrors.grade}</span>}
                  </div>

                  <div className="form-group">
                    <label className="section-label">Affiliation</label>
                    <div className="radio-option-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="affiliation"
                          value="De récole"
                          checked={formData.affiliation === "De récole"}
                          onChange={handleChange}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-label">De l'école</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="affiliation"
                          value="Hors récole"
                          checked={formData.affiliation === "Hors récole"}
                          onChange={handleChange}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-label">Hors l'école</span>
                      </label>
                    </div>
                  </div>

                  <div className={`form-group ${fieldErrors.chargeHeure ? "has-error" : ""}`}>
                    <label>Charge d'heure <span className="required">*</span></label>
                    <input
                      type="number"
                      name="chargeHeure"
                      value={formData.chargeHeure}
                      onChange={handleChange}
                      min="0"
                      placeholder="Ex: 192"
                    />
                    {fieldErrors.chargeHeure && <span className="field-error">{fieldErrors.chargeHeure}</span>}
                  </div>

                  <div className="form-group">
                    <label>Matière enseignée <span className="required">*</span></label>
                    <select
                      name="matiere"
                      value={formData.matiere}
                      onChange={handleChange}
                    >
                      <option value="Resaux">Réseaux</option>
                      <option value="Algo">Algorithme</option>
                      <option value="Systeme">Système</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        name="enseignantResponsable"
                        checked={formData.enseignantResponsable}
                        onChange={handleChange}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-label">
                        Vacataire
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="form-step">
                  <div className="form-group">
                    <label className="section-label">Méthode <span className="required">*</span></label>
                    <div className="radio-option-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="methodePaiement"
                          value="CCP"
                          checked={formData.methodePaiement === "CCP"}
                          onChange={handleChange}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-label">Compte CCP</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="methodePaiement"
                          value="Bancaire"
                          checked={formData.methodePaiement === "Bancaire"}
                          onChange={handleChange}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-label">Compte Bancaire</span>
                      </label>
                    </div>
                  </div>

                  {formData.methodePaiement === "CCP" && (
                    <div className={`form-group ${fieldErrors.numeroCompte ? "has-error" : ""}`}>
                      <label>N° de compte CCP <span className="required">*</span></label>
                      <input
                        type="text"
                        name="numeroCompte"
                        value={formData.numeroCompte}
                        onChange={handleChange}
                        placeholder="Ex: 123456789"
                      />
                      {fieldErrors.numeroCompte && <span className="field-error">{fieldErrors.numeroCompte}</span>}
                    </div>
                  )}

                  {formData.methodePaiement === "Bancaire" && (
                    <div className={`form-group ${fieldErrors.codeBancaire ? "has-error" : ""}`}>
                      <label>Code bancaire <span className="required">*</span></label>
                      <input
                        type="text"
                        name="codeBancaire"
                        value={formData.codeBancaire}
                        onChange={handleChange}
                        placeholder="Ex: 987654321"
                      />
                      {fieldErrors.codeBancaire && <span className="field-error">{fieldErrors.codeBancaire}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-actions">
              {step > 1 && (
                <button
                  className="secondary-button"
                  onClick={prevStep}
                  disabled={loading}
                >
                  Précédent
                </button>
              )}
              {step < 3 ? (
                <button className="primary-button" onClick={nextStep}>
                  Suivant
                </button>
              ) : (
                <button
                  className="primary-button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Traitement en cours..." : "Valider"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="success-container">
            <div className="progress-bar">
              <div className="step-indicator active">1</div>
              <div className="step-indicator active">2</div>
              <div className="step-indicator active">3</div>
            </div>

            <h2>Félicitations !</h2>
            <p>L'enseignant a été ajouté avec succès.</p>

            <div className="divider"></div>

            <img
              src={Felicitation || "/placeholder.svg"}
              alt="Félicitations"
              className="success-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder.svg";
              }}
            />

            <div className="button-group">
              <button
                className="secondary-button success-button"
                onClick={handleDone}
              >
                Terminé
              </button>
              <button
                className="primary-button success-button"
                onClick={handlePlanning}
              >
                Ajouter Emploi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProf;
