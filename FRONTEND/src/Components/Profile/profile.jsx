"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Navbar from "../Prof/Navbar/navbar";
import maleDefaultPic from "../../assets/ProfPage_assets/profilePicture.png";
import femaleDefaultPic from "../../assets/ProfPage_assets/Prof.png";
import "./profile.css";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [gradeId, setGradeId] = useState(null);
  const [currentGradeRelationId, setCurrentGradeRelationId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [profileData, setProfileData] = useState({
    personalInfo: {
      nom: "",
      prenom: "",
      naissance: "",
      sexe: "Male",
      email: "",
      phone: "",
    },
    academicInfo: {
      grade: "",
      affiliation: "",
      chargeHeure: "",
      matiere: "",
      droitHeuresSup: false,
    },
    paymentInfo: {
      methode: "CCP",
      compte: "",
    },
  });

  const navigate = useNavigate();
  const location = useLocation();

  const getDefaultImage = (genre) => {
    return genre === "Male" ? maleDefaultPic : femaleDefaultPic;
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setNewProfilePic(file);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    const id = location.state?.teacherId || null;
    console.log("Setting initial teacher ID:", id);
    setTeacherId(id);
  }, [location.state]);

  const fetchTeacherData = useCallback(
    async (id) => {
      console.log("Fetching data for teacher ID:", id);
      setLoading(true);
      setError(null);

      try {
        const teachersResponse = await api.get("/teachers/");
        if (!teachersResponse.data || teachersResponse.data.length === 0) {
          setError("No teachers found in the database");
          setLoading(false);
          return;
        }

        let teacherToUse = teachersResponse.data[0];
        let teacherIdToUse = teacherToUse.id;

        if (id) {
          const teacherExists = teachersResponse.data.some((t) => t.id === id);
          if (teacherExists) {
            teacherIdToUse = id;
            teacherToUse = teachersResponse.data.find((t) => t.id === id);
          } else {
            console.warn(
              `Teacher with ID ${id} not found, using first teacher`
            );
          }
        }

        setProfileImage(teacherToUse.imageUrl || null);
        setTeacherId(teacherIdToUse);

        const gradesResponse = await api.get("/enseignant-grades");
        const teacherGrades = gradesResponse.data.filter(
          (grade) => grade.enseignantId === teacherIdToUse
        );

        let gradeName = "MCB";
        let gradeIdValue = 1; // Default to MCB (id=1) to match Grade table
        let currentGradeRelationIdValue = null;

        if (teacherGrades.length > 0) {
          const sortedGrades = teacherGrades.sort(
            (a, b) => new Date(b.dateDebut) - new Date(a.dateDebut)
          );
          const latestGrade = sortedGrades[0];
          gradeIdValue = latestGrade.gradeId;
          currentGradeRelationIdValue = latestGrade.id;

          if (latestGrade.grade && latestGrade.grade.nom) {
            gradeName = latestGrade.grade.nom;
          } else {
            try {
              const gradeResponse = await api.get(
                `/grades/${latestGrade.gradeId}`
              );
              if (gradeResponse.data && gradeResponse.data.nom) {
                gradeName = gradeResponse.data.nom;
              }
            } catch (gradeError) {
              console.error("Error fetching grade:", gradeError);
            }
          }
        }

        setGradeId(gradeIdValue);
        setCurrentGradeRelationId(currentGradeRelationIdValue);

        const formatDate = (isoDate) => {
          if (!isoDate) return "";
          const date = new Date(isoDate);
          return `${date.getDate().toString().padStart(2, "0")}/${(
            date.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`;
        };

        const affiliation = teacherToUse.vacataire
          ? "Hors l'école"
          : "De l'école";
        const paymentMethod =
          teacherToUse.typeCompte === "Postal" ? "CCP" : "Bancaire";

        setProfileData({
          personalInfo: {
            nom: teacherToUse.nom || "",
            prenom: teacherToUse.prenom || "",
            naissance: formatDate(teacherToUse.dateNaissance) || "",
            sexe: teacherToUse.genre || "Male",
            email: teacherToUse.email || "",
            phone: teacherToUse.numeroTelephone || "",
          },
          academicInfo: {
            grade: gradeName,
            affiliation: affiliation,
            chargeHeure: teacherToUse.charge?.toString() || "0",
            matiere: teacherToUse.matiere || "Resaux",
            droitHeuresSup: teacherToUse.droitHeuresSup || false,
          },
          paymentInfo: {
            methode: paymentMethod,
            compte: teacherToUse.numeroCompte || "",
          },
        });

        setLoading(false);
      } catch (error) {
        console.error(
          "Error fetching teacher data:",
          JSON.stringify(error, null, 2)
        );
        setError("Failed to fetch teacher data. Please try again later.");
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    if (teacherId !== null) {
      fetchTeacherData(teacherId);
    }
  }, [teacherId, fetchTeacherData]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .profile-image-container:hover .image-overlay {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fullName = `${profileData.personalInfo.prenom} ${profileData.personalInfo.nom}`;

  const handleInputChange = (section, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parseDate = (dateString) => {
        if (!dateString) return null;
        const [day, month, year] = dateString.split("/");
        return new Date(`${year}-${month}-${day}`).toISOString();
      };

      const genre = profileData.personalInfo.sexe;
      const typeCompte =
        profileData.paymentInfo.methode === "CCP" ? "Postal" : "Bancaire";
      const vacataire = profileData.academicInfo.affiliation === "Hors l'école";
      const newGradeId =
        profileData.academicInfo.grade === "MCB"
          ? 2
          : profileData.academicInfo.grade === "PROF"
          ? 3
          : 1; // MCA maps to 3

      let teacherData = {
        prenom: profileData.personalInfo.prenom,
        nom: profileData.personalInfo.nom,
        email: profileData.personalInfo.email,
        dateNaissance: parseDate(profileData.personalInfo.naissance),
        genre: genre,
        numeroTelephone: profileData.personalInfo.phone,
        numeroCompte: profileData.paymentInfo.compte,
        typeCompte: typeCompte,
        charge: Number.parseInt(profileData.academicInfo.chargeHeure) || 0,
        matiere: profileData.academicInfo.matiere,
        droitHeuresSup: profileData.academicInfo.droitHeuresSup,
        vacataire: vacataire,
        gradeId: newGradeId, // Updated mapping
      };

      // Handle image upload if a new profile picture is selected
      if (newProfilePic) {
        setImageUploading(true);
        const imageFormData = new FormData();
        imageFormData.append("image", newProfilePic);

        const imageResponse = await api.post("/upload-image", imageFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (imageResponse.data && imageResponse.data.data) {
          teacherData.imageUrl = imageResponse.data.data.secure_url;
          teacherData.imagePublicId = imageResponse.data.data.public_id;
          setProfileImage(teacherData.imageUrl); // Update local state with new image
        }
        setImageUploading(false);
      }

      console.log(
        "Sending teacher data to PUT /teachers:",
        JSON.stringify(teacherData, null, 2)
      );

      const updateResponse = await api.put(
        `/teachers/${teacherId}`,
        teacherData
      );
      console.log(
        "Teacher update response:",
        JSON.stringify(updateResponse.data, null, 2)
      );

      // Update state with new gradeId
      setGradeId(newGradeId);

      alert("Profile updated successfully");
      setIsEditing(false);
      setNewProfilePic(null); // Clear the new image after successful save
      setImagePreview(null); // Clear the preview
    } catch (error) {
      console.error(
        "Error updating teacher:",
        JSON.stringify(error.response?.data || error, null, 2)
      );
      let errorMessage = "Failed to update profile";
      if (error.response?.data?.erreur) {
        errorMessage = error.response.data.erreur;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`Failed to update profile: ${errorMessage}`);
    } finally {
      setSaving(false);
      setImageUploading(false);
    }
  };

  const handleBackToList = () => {
    navigate("/prof");
  };

  const renderEditableField = (section, field, value) => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(section, field, e.target.value)}
          className="editable-input"
        />
      );
    }
    return <span className="info-value">{value}</span>;
  };

  const getImageSrc = () => {
    if (imagePreview) return imagePreview;
    if (profileImage) {
      if (profileImage.startsWith("http")) {
        return profileImage;
      } else {
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${profileImage.replace(/\\/g, "/")}`;
      }
    }
    return getDefaultImage(profileData.personalInfo.sexe);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-content loading">
          <p>Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-content error">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">
        <div className="profile-header">
          <div
            className="profile-image-container"
            onClick={handleImageClick}
            style={{
              position: "relative",
              cursor: isEditing ? "pointer" : "default",
            }}
          >
            <img
              src={getImageSrc() || "/placeholder.svg"}
              alt="Profile"
              className="profile-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getDefaultImage(profileData.personalInfo.sexe);
              }}
              style={{ opacity: imageUploading ? 0.5 : 1 }}
            />
            {isEditing && (
              <div
                className="image-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "50%",
                  opacity: 0,
                  transition: "opacity 0.2s",
                  pointerEvents: "none",
                }}
              >
                <span style={{ color: "white", fontSize: "14px" }}>Change</span>
              </div>
            )}
            {imageUploading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: "50%",
                }}
              >
                <span style={{ color: "white" }}>Uploading...</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>
          <div className="profile-identity">
            <h1>{fullName}</h1>
          </div>
          <button
            className="edit-button"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={saving}
          >
            {isEditing
              ? saving
                ? "Enregistrement..."
                : "Enregistrer"
              : "Modifier"}
          </button>
        </div>

        <div className="profile-sections">
          
          <div className="profile-section">
            <div className="section-header">
              <div className="section-icon personal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <h3>Informations personnelles</h3>
            </div>
            <div className="section-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Nom</span>
                  <div className="info-value-container">
                    {renderEditableField("personalInfo", "nom", profileData.personalInfo.nom)}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Prénom</span>
                  <div className="info-value-container">
                    {renderEditableField("personalInfo", "prenom", profileData.personalInfo.prenom)}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Naissance</span>
                  <div className="info-value-container">
                    {renderEditableField("personalInfo", "naissance", profileData.personalInfo.naissance)}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Sexe</span>
                  <div className="info-value-container">
                    {isEditing ? (
                      <select
                        value={profileData.personalInfo.sexe}
                        onChange={(e) => handleInputChange("personalInfo", "sexe", e.target.value)}
                        className="editable-select"
                      >
                        <option value="Female">Femme</option>
                        <option value="Male">Homme</option>
                      </select>
                    ) : (
                      <span className="info-value">{profileData.personalInfo.sexe === "Male" ? "Homme" : "Femme"}</span>
                    )}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <div className="info-value-container">
                    {renderEditableField("personalInfo", "email", profileData.personalInfo.email)}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Numéro de téléphone</span>
                  <div className="info-value-container">
                    {renderEditableField("personalInfo", "phone", profileData.personalInfo.phone)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <div className="section-icon academic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              </div>
              <h3>Informations académiques</h3>
            </div>
            <div className="section-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Grade</span>
                  <div className="info-value-container">
                    {isEditing ? (
                      <select
                        value={profileData.academicInfo.grade}
                        onChange={(e) => handleInputChange("academicInfo", "grade", e.target.value)}
                        className="editable-select"
                      >
                        <option value="MCB">Maître de conférence B</option>
                        <option value="PROF">Professeur</option>
                        <option value="MCA">Maître de conférence A</option>
                      </select>
                    ) : (
                      <span className="info-value">
                        {profileData.academicInfo.grade === "MCB"
                          ? "Maître de conférence B"
                          : profileData.academicInfo.grade === "PROF"
                          ? "Professeur"
                          : "Maître de conférence A"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Affiliation</span>
                  <div className="info-value-container">
                    {isEditing ? (
                      <select
                        value={profileData.academicInfo.affiliation}
                        onChange={(e) => handleInputChange("academicInfo", "affiliation", e.target.value)}
                        className="editable-select"
                      >
                        <option value="De l'école">De l'école</option>
                        <option value="Hors l'école">Hors l'école</option>
                      </select>
                    ) : (
                      <span className="info-value">{profileData.academicInfo.affiliation}</span>
                    )}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Charge d'heure</span>
                  <div className="info-value-container">
                    {renderEditableField("academicInfo", "chargeHeure", profileData.academicInfo.chargeHeure)}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Matière</span>
                  <div className="info-value-container">
                    {isEditing ? (
                      <select
                        value={profileData.academicInfo.matiere}
                        onChange={(e) => handleInputChange("academicInfo", "matiere", e.target.value)}
                        className="editable-select"
                      >
                        <option value="Resaux">Réseaux</option>
                        <option value="Algo">Algorithme</option>
                        <option value="Systeme">Système</option>
                      </select>
                    ) : (
                      <span className="info-value">
                        {profileData.academicInfo.matiere === "Resaux"
                          ? "Réseaux"
                          : profileData.academicInfo.matiere === "Algo"
                          ? "Algorithme"
                          : "Système"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Vacataire</span>
                  <div className="info-value-container">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={profileData.academicInfo.droitHeuresSup}
                        onChange={(e) => handleInputChange("academicInfo", "droitHeuresSup", e.target.checked)}
                        className="editable-checkbox"
                        style={{ width: '20px', height: '20px', accentColor: '#4f46e5' }}
                      />
                    ) : (
                      <span className="info-value">{profileData.academicInfo.droitHeuresSup ? "Oui" : "Non"}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <div className="section-icon payment">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              </div>
              <h3>Informations de paiement</h3>
            </div>
            <div className="section-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Méthode</span>
                  <div className="info-value-container">
                    {isEditing ? (
                      <select
                        value={profileData.paymentInfo.methode}
                        onChange={(e) => handleInputChange("paymentInfo", "methode", e.target.value)}
                        className="editable-select"
                      >
                        <option value="CCP">CCP</option>
                        <option value="Bancaire">Bancaire</option>
                      </select>
                    ) : (
                      <span className="info-value">{profileData.paymentInfo.methode}</span>
                    )}
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">N° de compte</span>
                  <div className="info-value-container">
                    {renderEditableField("paymentInfo", "compte", profileData.paymentInfo.compte)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
