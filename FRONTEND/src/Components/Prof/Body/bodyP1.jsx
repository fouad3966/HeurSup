"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import "./bodyP1.css";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaEnvelope, FaTrash, FaSearch } from "react-icons/fa";
import NewProf from "../NewProf/NewProf";

// Import default profile images
import maleDefaultPic from "../../../assets/ProfPage_assets/profilePicture.png";
import femaleDefaultPic from "../../../assets/ProfPage_assets/Prof.png";

const Body = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    teacher: null,
    index: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Create axios instance with default config
  const api = axios.create({
    baseURL: "http://localhost:5000",
  });

  // Add request interceptor to add token to all requests
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Function to get default image based on gender
  const getDefaultImage = (genre) => {
    return genre === "Male" ? maleDefaultPic : femaleDefaultPic;
  };

  // Handle image loading error
  const handleImageError = (e, genre) => {
    e.target.src = getDefaultImage(genre);
  };

  // Load professors from API when component mounts
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        navigate("/");
        return;
      }

      // First fetch all teachers
      const teachersResponse = await api.get("/teachers/");
      const teachersData = teachersResponse.data;

      // Then fetch all teacher-grade relationships
      const gradesResponse = await api.get("/enseignant-grades");
      const gradesData = gradesResponse.data;

      // Create a map of teacher IDs to their most recent grade
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

      // Transform the API response to match the expected format
      const formattedTeachers = teachersData.map((teacher) => {
        const teacherGrade = teacherGradesMap[teacher.id];
        const gradeName = teacherGrade ? teacherGrade.gradeName : "MCB"; // Default to MCB if no grade

        // Determine title based on grade
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
          email: teacher.email || "email@example.com", // Provide default email if missing
          phone: teacher.numeroTelephone || "+12 345 6789 0", // Provide default phone if missing
          title: title,
          profilePic: teacher.imageUrl || getDefaultImage(teacher.genre),
          genre: teacher.genre,
        };
      });

      setTeachers(formattedTeachers);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setError("Failed to fetch teachers. Please try again later.");
      setLoading(false);
    }
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteTeacher = async (index) => {
    try {
      setDeleteLoading(true);
      const teacherToDelete = teachers[index];

      if (!teacherToDelete || !teacherToDelete.id) {
        throw new Error("Invalid teacher data");
      }

      // First, delete any associated grade relationships
      try {
        const gradesResponse = await api.get("/enseignant-grades");
        const teacherGrades = gradesResponse.data.filter(
          (grade) => grade.enseignantId === teacherToDelete.id
        );

        // Delete each grade relationship
        for (const grade of teacherGrades) {
          await api.delete(`/enseignant-grades/${grade.id}`);
        }
      } catch (error) {
        console.error("Error deleting teacher grade relationships:", error);
        // Continue with teacher deletion even if grade deletion fails
      }

      // Then delete the teacher
      const response = await api.delete(`/teachers/${teacherToDelete.id}`);

      if (response.status === 200) {
        const updatedTeachers = [...teachers];
        updatedTeachers.splice(index, 1);
        setTeachers(updatedTeachers);
        setDeleteConfirmation({ show: false, teacher: null, index: null });
        alert("Teacher deleted successfully");
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to delete teacher:", error);
      let errorMessage = "An unknown error occurred";

      if (error.response) {
        errorMessage =
          error.response.data?.erreur ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message;
      }

      alert(`Failed to delete teacher: ${errorMessage}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const showDeleteConfirmation = (teacher, index) => {
    setDeleteConfirmation({
      show: true,
      teacher,
      index,
    });
  };

  const handleProfileClick = (e, teacher) => {
    if (
      e.target.closest(".delete-icon-container") ||
      e.target.closest(".confirmation-modal")
    ) {
      e.stopPropagation();
      return;
    }
    // Navigate to profile page with the teacher's ID
    navigate("/profile", { state: { teacherId: teacher.id } });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchTeachers();
  };

  return (
    <div className="main">
      <div className="body-container">
        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div
            className="confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirmation-content">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this professor?</p>
              <div className="professor-details">
                <img
                  src={
                    deleteConfirmation.teacher.profilePic || "/placeholder.svg"
                  }
                  alt={deleteConfirmation.teacher.name}
                  className="confirmation-profile-pic"
                  onError={(e) =>
                    handleImageError(e, deleteConfirmation.teacher.genre)
                  }
                />
                <div>
                  <h4>{deleteConfirmation.teacher.name}</h4>
                  <p>
                    <strong>Rank:</strong> {deleteConfirmation.teacher.rank}
                  </p>
                  <p>
                    <strong>Email:</strong> {deleteConfirmation.teacher.email}
                  </p>
                </div>
              </div>
              <div className="confirmation-buttons">
                <button
                  className="cancel-button"
                  onClick={() =>
                    setDeleteConfirmation({
                      show: false,
                      teacher: null,
                      index: null,
                    })
                  }
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button"
                  onClick={() => handleDeleteTeacher(deleteConfirmation.index)}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="body-header">
          <div>
            <h2>Gestion des enseignants</h2>
            <p>
              Gérez et organisez facilement les profils et les informations des
              enseignants.
            </p>
          </div>
          <div className="search-and-button">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par nom..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="new-teacher-button"
            >
              New Teacher
            </button>
          </div>
        </div>

        {isModalOpen && <NewProf onClose={handleModalClose} />}

        <div className="teachers-grid">
          {loading ? (
            <div className="loading-message">
              <p>Loading professors...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchTeachers} className="retry-button">
                Retry
              </button>
            </div>
          ) : filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher, index) => (
              <div
                className={`teacher-card ${
                  hoveredCard === index ? "hovered" : ""
                }`}
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
                <div className="profile-container">
                  <img
                    src={teacher.profilePic || "/placeholder.svg"}
                    alt={teacher.name}
                    className="profile-pic"
                    onError={(e) => handleImageError(e, teacher.genre)}
                  />
                  <span className={`rank-badge ${teacher.rank.toLowerCase()}`}>
                    {teacher.rank}
                  </span>
                </div>
                <h3>{teacher.name}</h3>
                <p className="title">{teacher.title}</p>
                <div className="contact-info">
                  <div>
                    <FaPhone className="icon" /> {teacher.phone}
                  </div>
                  <div>
                    <FaEnvelope className="icon" /> {teacher.email}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-teachers-message">
              <p>No professors found. Add a new professor to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Body;
