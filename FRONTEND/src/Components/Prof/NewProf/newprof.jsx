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
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    naissance: "",
    sexe: "Male",
    email: "",
    telephone: "",
    profilePic: null,
    grade: "1", // Store grade ID directly
    affiliation: "De récole",
    chargeHeure: "",
    enseignantResponsable: true, // Default to true for droitHeuresSup
    matiere: "Resaux", // Default to one of the enum values
    methodePaiement: "CCP",
    numeroCompte: "",
    codeBancaire: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData({ ...formData, profilePic: file });
    }
  };

  // Clean up object URL when component unmounts or when a new image is selected
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

  const nextStep = () => step < 3 && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !formData.nom ||
        !formData.prenom ||
        !formData.email ||
        !formData.naissance ||
        !formData.telephone
      ) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      // Format the date correctly - ensure it's in ISO format
      const formattedDate = formData.naissance
        ? new Date(formData.naissance).toISOString()
        : null;

      if (!formattedDate) {
        throw new Error("Date de naissance est requise");
      }

      // Map gender from UI to backend format
      const genre = formData.sexe === "Male" ? "Male" : "Female";

      // Map account type from UI to backend format
      const typeCompte =
        formData.methodePaiement === "CCP" ? "Postal" : "Bancaire";

      // Determine if teacher is vacataire based on affiliation
      const vacataire = formData.enseignantResponsable;

      // Map matiere to enum value
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
          matiere = "Resaux"; // Default value
      }

      // Fetch or create a PeriodeTravail
      let periodeTravailId;
      try {
        const periodResponse = await api.get("/periode-travail/open");
        if (periodResponse.data && periodResponse.data.id) {
          periodeTravailId = periodResponse.data.id;
        } else {
          const now = new Date();
          const endDate = new Date(now.getFullYear(), 11, 31); // Default to Dec 31
          const newPeriod = await api.post("/periode-travail", {
            dateDebut: now.toISOString(),
            dateFin: endDate.toISOString(),
          });
          periodeTravailId = newPeriod.data.id;
        }
      } catch (periodError) {
        console.error("Error fetching/creating period:", periodError);
        periodeTravailId = 1; // Fallback with a valid ID from your DB
      }

      // Create the teacher data object
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

      // Create the teacher
      const response = await api.post("/teachers/", teacherData);
      console.log("Teacher created successfully:", response.data);

      // Move to success screen
      setStep(4);
    } catch (error) {
      console.error("Error creating teacher:", error);

      let errorMessage = "Échec de la création de l'enseignant";
      if (error.response) {
        errorMessage =
          error.response.data.erreur ||
          error.response.data.error ||
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

  // Function to get the appropriate image for preview
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
              <div
                className="error-message"
                style={{ color: "red", margin: "10px 0", textAlign: "center" }}
              >
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="form-step">
                <div className="name-section">
                  <div className="name-fields">
                    <div className="form-group">
                      <label>Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        required
                      />
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
                  <div className="form-group half-width">
                    <label>Naissance</label>
                    <input
                      type="date"
                      name="naissance"
                      value={formData.naissance}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group half-width">
                    <label>Sexe</label>
                    <select
                      name="sexe"
                      value={formData.sexe}
                      onChange={handleChange}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Numéro de tél</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <div className="form-group">
                  <label>Grade</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                  >
                    <option value="2">Maître de conférence A (MCA)</option>
                    <option value="3">Maître de conférence B (MCB)</option>
                    <option value="1">Professeur (PROF)</option>
                  </select>
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

                <div className="form-group">
                  <label>Charge d'heure</label>
                  <input
                    type="number"
                    name="chargeHeure"
                    value={formData.chargeHeure}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Matière enseignée</label>
                  <select
                    name="matiere"
                    value={formData.matiere}
                    onChange={handleChange}
                    required
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
                  <label className="section-label">Méthode</label>
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

                <div className="form-group">
                  <label>N° de compte</label>
                  <input
                    type="text"
                    name="numeroCompte"
                    value={formData.numeroCompte}
                    onChange={handleChange}
                    disabled={formData.methodePaiement !== "CCP"}
                  />
                </div>
              </div>
            )}

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
