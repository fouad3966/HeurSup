"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import { useToast } from "../../Toast/Toast";
import "./bodyP1.css";
import { FaPhone, FaEnvelope, FaTrash, FaSearch, FaPlus, FaUsers, FaGraduationCap, FaChalkboardTeacher } from "react-icons/fa";
import NewProf from "../NewProf/NewProf";

import maleDefaultPic from "../../../assets/ProfPage_assets/profilePicture.png";
import femaleDefaultPic from "../../../assets/ProfPage_assets/Prof.png";

const Body = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    teacher: null,
    index: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  const getDefaultImage = (genre) => {
    return genre === "Male" ? maleDefaultPic : femaleDefaultPic;
  };

  const handleImageError = (e, genre) => {
    e.target.src = getDefaultImage(genre);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const teachersResponse = await api.get("/teachers/");
      const teachersData = teachersResponse.data;

      const gradesResponse = await api.get("/enseignant-grades");
      const gradesData = gradesResponse.data;

      const teacherGradesMap = {};
      gradesData.forEach((gradeRelation) => {
        if (
          !teacherGradesMap[gradeRelation.enseignantId] ||
          new Date(gradeRelation.dateDebut) >
            new Date(teacherGradesMap[gradeRelation.enseignantId].dateDebut)
        ) {
          teacherGradesMap[gradeRelation.enseignantId] = {
            gradeId: gradeRelation.gradeId,
            dateDebut: gradeRelation.dateDebut,
            gradeName: gradeRelation.grade.nom,
          };
        }
      });

      const formattedTeachers = teachersData.map((teacher) => {
        const teacherGrade = teacherGradesMap[teacher.id];
        const gradeName = teacherGrade ? teacherGrade.gradeName : "MCB";

        let title;
        switch (gradeName) {
          case "MCA":
            title = "Maître de conférences A";
            break;
          case "PROF":
            title = "Professeur";
            break;
          default:
            title = "Maître de conférences B";
        }

        return {
          id: teacher.id,
          name: `${teacher.prenom} ${teacher.nom}`,
          rank: gradeName,
          email: teacher.email || "email@example.com",
          phone: teacher.numeroTelephone || "+213 000 000 000",
          title: title,
          profilePic: teacher.imageUrl || getDefaultImage(teacher.genre),
          genre: teacher.genre,
        };
      });

      setTeachers(formattedTeachers);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setError("Impossible de charger les enseignants.");
      setLoading(false);
    }
  };

  // Stats
  const totalTeachers = teachers.length;
  const mcaCount = teachers.filter((t) => t.rank === "MCA").length;
  const mcbCount = teachers.filter((t) => t.rank === "MCB").length;
  const profCount = teachers.filter((t) => t.rank === "PROF").length;

  // Filter
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === "all" || teacher.rank === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const handleDeleteTeacher = async (index) => {
    try {
      setDeleteLoading(true);
      const teacherToDelete = filteredTeachers[index];

      if (!teacherToDelete || !teacherToDelete.id) {
        throw new Error("Données invalides");
      }

      // Delete associated grade relationships first
      try {
        const gradesResponse = await api.get("/enseignant-grades");
        const teacherGrades = gradesResponse.data.filter(
          (grade) => grade.enseignantId === teacherToDelete.id
        );
        for (const grade of teacherGrades) {
          await api.delete(`/enseignant-grades/${grade.id}`);
        }
      } catch {
        // Continue even if cascade cleanup fails partially
      }

      const response = await api.delete(`/teachers/${teacherToDelete.id}`);

      if (response.status === 200) {
        setTeachers((prev) => prev.filter((t) => t.id !== teacherToDelete.id));
        setDeleteConfirmation({ show: false, teacher: null, index: null });
        toast.success("Enseignant supprimé avec succès");
      }
    } catch (error) {
      let errorMessage = "Erreur lors de la suppression";
      if (error.response) {
        errorMessage = error.response.data?.erreur || error.response.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const showDeleteConfirmation = (teacher, index) => {
    setDeleteConfirmation({ show: true, teacher, index });
  };

  const handleProfileClick = (e, teacher) => {
    if (e.target.closest(".delete-icon-container") || e.target.closest(".confirmation-modal")) {
      e.stopPropagation();
      return;
    }
    navigate("/profile", { state: { teacherId: teacher.id } });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchTeachers();
  };

  return (
    <div className="main-content">
      <div className="content-container">
        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div className="modal-overlay" onClick={() => setDeleteConfirmation({ show: false, teacher: null, index: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirmer la suppression</h3>
                <p>Cette action est irréversible. Voulez-vous continuer ?</p>
              </div>
              <div className="modal-teacher-info">
                <img
                  src={deleteConfirmation.teacher.profilePic}
                  alt={deleteConfirmation.teacher.name}
                  className="modal-teacher-pic"
                  onError={(e) => handleImageError(e, deleteConfirmation.teacher.genre)}
                />
                <div>
                  <h4>{deleteConfirmation.teacher.name}</h4>
                  <span className={`grade-chip grade-${deleteConfirmation.teacher.rank.toLowerCase()}`}>
                    {deleteConfirmation.teacher.rank}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirmation({ show: false, teacher: null, index: null })}
                  disabled={deleteLoading}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteTeacher(deleteConfirmation.index)}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon-wrap">
              <FaUsers />
            </div>
            <div className="stat-info">
              <span className="stat-number">{totalTeachers}</span>
              <span className="stat-label">Total Enseignants</span>
            </div>
          </div>
          <div className="stat-card stat-prof">
            <div className="stat-icon-wrap">
              <FaGraduationCap />
            </div>
            <div className="stat-info">
              <span className="stat-number">{profCount}</span>
              <span className="stat-label">Professeurs</span>
            </div>
          </div>
          <div className="stat-card stat-mca">
            <div className="stat-icon-wrap">
              <FaChalkboardTeacher />
            </div>
            <div className="stat-info">
              <span className="stat-number">{mcaCount}</span>
              <span className="stat-label">MCA</span>
            </div>
          </div>
          <div className="stat-card stat-mcb">
            <div className="stat-icon-wrap">
              <FaChalkboardTeacher />
            </div>
            <div className="stat-info">
              <span className="stat-number">{mcbCount}</span>
              <span className="stat-label">MCB</span>
            </div>
          </div>
        </div>

        {/* Header Bar */}
        <div className="page-header">
          <div className="header-text">
            <h2>Gestion des enseignants</h2>
            <p>Gérez et organisez les profils et informations des enseignants.</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher un enseignant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-chips">
              {["all", "PROF", "MCA", "MCB"].map((grade) => (
                <button
                  key={grade}
                  className={`filter-chip ${filterGrade === grade ? "active" : ""}`}
                  onClick={() => setFilterGrade(grade)}
                >
                  {grade === "all" ? "Tous" : grade}
                </button>
              ))}
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <FaPlus />
              Ajouter
            </button>
          </div>
        </div>

        {isModalOpen && <NewProf onClose={handleModalClose} />}

        {/* Teachers Grid */}
        <div className="teachers-grid">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="teacher-card skeleton-card">
                  <div className="skeleton skeleton-avatar"></div>
                  <div className="skeleton skeleton-text-lg"></div>
                  <div className="skeleton skeleton-text-sm"></div>
                  <div className="skeleton skeleton-text-md"></div>
                </div>
              ))}
            </>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={fetchTeachers} className="btn btn-primary">
                Réessayer
              </button>
            </div>
          ) : filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher, index) => (
              <div
                className={`teacher-card ${hoveredCard === index ? "hovered" : ""}`}
                key={teacher.id}
                onClick={(e) => handleProfileClick(e, teacher)}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="delete-icon-container"
                  onClick={(e) => {
                    e.stopPropagation();
                    showDeleteConfirmation(teacher, index);
                  }}
                >
                  <FaTrash className="delete-icon" />
                </div>
                <div className="card-avatar-section">
                  <img
                    src={teacher.profilePic}
                    alt={teacher.name}
                    className="card-avatar"
                    onError={(e) => handleImageError(e, teacher.genre)}
                  />
                  <span className={`grade-chip grade-${teacher.rank.toLowerCase()}`}>
                    {teacher.rank}
                  </span>
                </div>
                <h3 className="card-name">{teacher.name}</h3>
                <p className="card-title">{teacher.title}</p>
                <div className="card-contact">
                  <div className="contact-row">
                    <FaPhone className="contact-icon" />
                    <span>{teacher.phone}</span>
                  </div>
                  <div className="contact-row">
                    <FaEnvelope className="contact-icon" />
                    <span>{teacher.email}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👨‍🏫</div>
              <h3>Aucun enseignant trouvé</h3>
              <p>
                {searchTerm
                  ? "Aucun résultat ne correspond à votre recherche."
                  : "Commencez par ajouter un nouvel enseignant."}
              </p>
              {!searchTerm && (
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                  <FaPlus /> Ajouter un enseignant
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Body;
