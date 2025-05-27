import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../Prof/Navbar/navbar";
import "./rapport.css";
import {
  FaPen,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaDownload,
} from "react-icons/fa";

const Rapport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [weeklyData, setWeeklyData] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [absences, setAbsences] = useState({
    total: 0,
    justified: 0,
    unjustified: 0,
  });
  const [totalSuppHours, setTotalSuppHours] = useState(0);
  const [teachersObligations, setTeachersObligations] = useState([]);
  const [teacherTypeFilter, setTeacherTypeFilter] = useState("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");

  const api = axios.create({
    baseURL: "http://localhost:5000",
  });

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch professors
        const professorsResponse = await api.get("/teachers/");
        const formattedProfessors = professorsResponse.data.map(
          (professor) => ({
            id: professor.id,
            name: `${professor.prenom} ${professor.nom}`,
            email: professor.email,
            imageUrl: professor.imageUrl,
          })
        );
        setProfessors(formattedProfessors);

        // Calculate supplementary hours for each teacher with error handling
        for (const professor of formattedProfessors) {
          try {
            console.log(`Calculating for teacher ${professor.id}`);
            await api.get(`/calculate/${professor.id}`);
          } catch (calcError) {
            console.error(
              `Error calculating for teacher ${professor.id}:`,
              calcError
            );
          }
        }

        // Fetch periods and filter for IDs 1, 2, 3
        const periodsResponse = await api.get("/periods/all");
        const filteredPeriods = periodsResponse.data
          .filter((period) => [1, 2, 3].includes(period.id))
          .map((period) => ({
            id: period.id,
            name: `Période ${period.id}`,
            startDate: period.dateDebut,
            endDate: period.dateFin,
            editing: false,
            hours: 0,
            totalAbsences: 0,
            justifiedAbsences: 0,
            unjustifiedAbsences: 0,
          }));
        setPeriods(filteredPeriods);

        // Fetch total absences across all teachers
        const absencesResponse = await api.get("/absences/count");
        console.log("Absences response:", absencesResponse.data);
        setAbsences({
          total: absencesResponse.data.totalAbsences || 0,
          justified: absencesResponse.data.justifiedCount || 0,
          unjustified: absencesResponse.data.unjustifiedCount || 0,
        });

        // Calculate total supplementary hours across all professors and all periods
        let globalSuppHours = 0;
        for (const professor of formattedProfessors) {
          try {
            // Get all periods for this professor
            const professorPeriodsResponse = await api.get(
              "/periods/byTeacher"
            );
            const professorPeriods =
              professorPeriodsResponse.data.find(
                (p) => p.enseignant.id === professor.id
              )?.periodes || [];

            // Calculate supp hours for each period
            for (const period of professorPeriods) {
              try {
                const response = await api.post(
                  `/suppHoursCalculate/${professor.id}`,
                  {
                    startDate: period.dateDebut,
                    endDate: period.dateFin,
                  }
                );
                if (response.data.success) {
                  globalSuppHours += response.data.data.periodTotal || 0;
                }
              } catch (periodError) {
                console.error(
                  `Error calculating period ${period.id} for teacher ${professor.id}:`,
                  periodError
                );
              }
            }
          } catch (professorError) {
            console.error(
              `Error processing professor ${professor.id}:`,
              professorError
            );
          }
        }

        console.log("Calculated Global Supp Hours:", globalSuppHours);
        setTotalSuppHours(Number.parseFloat(globalSuppHours.toFixed(1)));

        // Fetch obligation data for all teachers for the year 2025
        const year = 2025;
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        const obligationsData = [];
        for (const professor of formattedProfessors) {
          try {
            console.log(`Fetching obligation data for teacher ${professor.id}`);
            const response = await api.post(
              `/suppHoursCalculate/${professor.id}`,
              { startDate, endDate }
            );
            if (response.data.success) {
              const { data } = response.data;
              const nameParts = data.teacherName.trim().split(/\s+/);
              const prenom = nameParts[0] || "";
              const nom =
                nameParts.length > 1 ? nameParts.slice(1).join(" ") : prenom;
              obligationsData.push({
                id: data.teacherId,
                nom: nom,
                prenom: prenom,
                heuresSup: data.periodTotal || 0,
                numeroCompte: data.numeroCompte || "",
                typeCompte: data.typeCompte || "",
                montantNet: data.montantNet || 0,
              });
            } else {
              console.warn(
                `Obligation data not found for teacher ${professor.id}`
              );
              const nameParts = professor.name.trim().split(/\s+/);
              const prenom = nameParts[0] || "";
              const nom =
                nameParts.length > 1 ? nameParts.slice(1).join(" ") : prenom;
              obligationsData.push({
                id: professor.id,
                nom: nom,
                prenom: prenom,
                heuresSup: 0,
                numeroCompte: "",
                typeCompte: "",
                montantNet: 0,
              });
            }
          } catch (obligationError) {
            console.error(
              `Error fetching obligation data for teacher ${professor.id}:`,
              obligationError
            );
            const nameParts = professor.name.trim().split(/\s+/);
            const prenom = nameParts[0] || "";
            const nom =
              nameParts.length > 1 ? nameParts.slice(1).join(" ") : prenom;
            obligationsData.push({
              id: professor.id,
              nom: nom,
              prenom: prenom,
              heuresSup: 0,
              numeroCompte: "",
              typeCompte: "",
              montantNet: 0,
            });
          }
        }
        setTeachersObligations(obligationsData);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load some data. Some features may be unavailable.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch weekly data when professor changes
  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (selectedProfessor) {
        try {
          console.log(`Fetching weekly data for teacher ${selectedProfessor}`);

          // Generate weeks for the current month only
          const year = currentYear;
          const month = currentMonth;
          const firstDayOfMonth = new Date(year, month, 1);
          const lastDayOfMonth = new Date(year, month + 1, 0);

          const weeks = [];
          let weekNum = 1;
          const currentDate = new Date(firstDayOfMonth);

          // Calculate weeks within the current month
          while (currentDate <= lastDayOfMonth) {
            const weekStart = new Date(currentDate);
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6); // 7 days total

            // Ensure week end doesn't go beyond the month
            if (weekEnd > lastDayOfMonth) {
              weekEnd.setTime(lastDayOfMonth.getTime());
            }

            try {
              console.log(
                `Fetching data for week ${weekNum}: ${
                  weekStart.toISOString().split("T")[0]
                } to ${weekEnd.toISOString().split("T")[0]}`
              );

              // Call the correct endpoint for each week
              const response = await api.post(
                `/suppHoursCalculate/${selectedProfessor}`,
                {
                  startDate: weekStart.toISOString().split("T")[0],
                  endDate: weekEnd.toISOString().split("T")[0],
                }
              );

              console.log(`Week ${weekNum} response:`, response.data);

              const weekData = {
                week: `Semaine ${weekNum} [${
                  weekStart.toISOString().split("T")[0]
                },${weekEnd.toISOString().split("T")[0]}]`,
                hours: response.data.success
                  ? response.data.data.periodTotal || 0
                  : 0,
              };

              weeks.push(weekData);
            } catch (weekError) {
              console.error(`Error fetching week ${weekNum} data:`, weekError);
              weeks.push({
                week: `Semaine ${weekNum} [${
                  weekStart.toISOString().split("T")[0]
                },${weekEnd.toISOString().split("T")[0]}]`,
                hours: 0,
              });
            }

            // Move to next week (7 days)
            currentDate.setDate(currentDate.getDate() + 7);
            weekNum++;
          }

          console.log(
            `Generated ${weeks.length} weeks for ${getMonthName(month)}:`,
            weeks
          );
          setWeeklyData(weeks);
        } catch (err) {
          console.error("Error fetching weekly data:", err);
          setWeeklyData([]);
          setError("Failed to load weekly data for the selected teacher.");
        }
      } else {
        setWeeklyData([]);
      }
    };

    fetchWeeklyData();
  }, [selectedProfessor, currentMonth, currentYear]);

  // Fetch period hours and absences for the selected teacher
  useEffect(() => {
    const fetchPeriodData = async () => {
      if (selectedProfessor) {
        try {
          console.log(`Fetching period data for teacher ${selectedProfessor}`);
          // Fetch supplementary hours for each period
          const updatedPeriods = await Promise.all(
            periods.map(async (period) => {
              if (period.startDate && period.endDate) {
                try {
                  console.log(`Fetching hours for period ${period.id}`);
                  const response = await api.post(
                    `/suppHoursCalculate/${selectedProfessor}`,
                    {
                      startDate: period.startDate,
                      endDate: period.endDate,
                    }
                  );
                  return {
                    ...period,
                    hours: response.data.success
                      ? response.data.data.periodTotal || 0
                      : 0,
                  };
                } catch (error) {
                  console.error(
                    `Error fetching hours for period ${period.id}:`,
                    error
                  );
                  return { ...period, hours: 0 };
                }
              }
              return { ...period, hours: 0 };
            })
          );

          // Fetch absences grouped by period for this teacher
          try {
            console.log(`Fetching absences for teacher ${selectedProfessor}`);
            const absencesResponse = await api.get(
              `/teacher/${selectedProfessor}/absences/grouped`
            );
          
            console.log("Absences by period response:", absencesResponse.data);
          
            if (absencesResponse.data.success) {
              const periodAbsences = absencesResponse.data.data.periods || [];
          
              const periodsWithAbsences = updatedPeriods.map((period) => {
                const absenceData = periodAbsences.find(
                  (pa) => pa.periodId === period.id
                );
          
                return {
                  ...period,
                  totalAbsences: absenceData?.totalAbsences || 0,
                  justifiedAbsences: absenceData?.justifiedCount || 0,
                  unjustifiedAbsences: absenceData?.unjustifiedCount || 0,
                };
              });
          
              setPeriods(periodsWithAbsences);
            } else {
              console.warn(
                `Absences API returned success: false for teacher ${selectedProfessor}`
              );
              setPeriods(updatedPeriods);
            }
          } catch (absenceError) {
            console.error(
              `Error fetching absences for teacher ${selectedProfessor}:`,
              absenceError
            );
            setPeriods(updatedPeriods);
          }
          
        } catch (err) {
          console.error("Error calculating period data:", err);
          setError("Failed to calculate period data for the selected teacher.");
        }
      }
    };

    fetchPeriodData();
  }, [
    selectedProfessor,
    periods.map((p) => `${p.startDate}-${p.endDate}`).join(","),
  ]);

  // Filter periods for the selected teacher
  useEffect(() => {
    const fetchTeacherPeriods = async () => {
      if (selectedProfessor) {
        try {
          const response = await api.get("/periods/byTeacher");
          const teacherPeriodsData =
            response.data.find(
              (p) => p.enseignant.id === Number.parseInt(selectedProfessor)
            )?.periodes || [];
          setPeriods((prevPeriods) =>
            prevPeriods.map((p) => ({
              ...p,
              assigned: teacherPeriodsData.some((tp) => tp.id === p.id),
            }))
          );
        } catch (err) {
          console.error("Error fetching teacher periods:", err);
          setError("Failed to load teacher periods.");
        }
      }
    };
    fetchTeacherPeriods();
  }, [selectedProfessor]);

  const handleProfessorChange = (e) => {
    setSelectedProfessor(e.target.value);
  };

  const handleTeacherTypeFilterChange = (e) => {
    setTeacherTypeFilter(e.target.value);
  };

  const handleAccountTypeFilterChange = (e) => {
    setAccountTypeFilter(e.target.value);
  };

  const handleDownloadReport = async () => {
    try {
      const startDate = new Date(currentYear, 0, 1).toISOString().split("T")[0];
      const endDate = new Date(currentYear, 11, 31).toISOString().split("T")[0];

      const response = await api.post(
        "/suppHours/export-xlsx",
        { startDate, endDate },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Etat_de_paiement_des_HS.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Échec du téléchargement du fichier.");
    }
  };

  const handleDownloadWeeklyReport = async () => {
    if (!selectedProfessor) return;

    try {
      const periodStart = new Date(2024, 8, 20).toISOString().split("T")[0];

      const response = await api.post(
        `/export/teacher-xlsx/${selectedProfessor}`,
        { periodStart },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Déclaration_obligation_${selectedProfessor}_${getMonthName(
          currentMonth
        )}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading weekly report:", err);
      alert("Échec du téléchargement de la déclaration.");
    }
  };

  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const getMonthName = (month) => {
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return monthNames[month];
  };

  const calculateTotalHours = () => {
    if (selectedProfessor && weeklyData.length > 0) {
      return weeklyData
        .reduce(
          (total, week) => total + Number.parseFloat(week.hours || "0"),
          0
        )
        .toFixed(1);
    }
    return "0.0";
  };

  const togglePeriodEditing = (id) => {
    setPeriods(
      periods.map((period) =>
        period.id === id ? { ...period, editing: !period.editing } : period
      )
    );
  };

  const updatePeriodDate = (id, field, value) => {
    setPeriods(
      periods.map((period) =>
        period.id === id ? { ...period, [field]: value } : period
      )
    );
  };

  const savePeriod = async (id) => {
    const period = periods.find((p) => p.id === id);
    try {
      await api.put(`/periodes-travail/${id}`, {
        dateDebut: period.startDate,
        dateFin: period.endDate,
      });
      setPeriods(
        periods.map((p) => (p.id === id ? { ...p, editing: false } : p))
      );
    } catch (err) {
      console.error("Error saving period:", err);
      setError("Failed to save period.");
    }
  };

  // Calculate period stats
  const getPeriodStats = (period) => {
    return {
      hours: period.hours || 0,
      totalAbsences: period.totalAbsences || 0,
      justifiedAbsences: period.justifiedAbsences || 0,
      unjustifiedAbsences: period.unjustifiedAbsences || 0,
    };
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      for (const professor of professors) {
        try {
          console.log(`Recalculating for teacher ${professor.id}`);
          await api.get(`/calculate/${professor.id}`);
        } catch (calcError) {
          console.error(
            `Error recalculating for teacher ${professor.id}:`,
            calcError
          );
        }
      }

      // Recalculate global supplementary hours
      let globalSuppHours = 0;
      for (const professor of professors) {
        try {
          const professorPeriodsResponse = await api.get("/periods/byTeacher");
          const professorPeriods =
            professorPeriodsResponse.data.find(
              (p) => p.enseignant.id === professor.id
            )?.periodes || [];

          for (const period of professorPeriods) {
            try {
              const response = await api.post(
                `/suppHoursCalculate/${professor.id}`,
                {
                  startDate: period.dateDebut,
                  endDate: period.dateFin,
                }
              );
              if (response.data.success) {
                globalSuppHours += response.data.data.periodTotal || 0;
              }
            } catch (periodError) {
              console.error(
                `Error calculating period ${period.id} for teacher ${professor.id}:`,
                periodError
              );
            }
          }
        } catch (professorError) {
          console.error(
            `Error processing professor ${professor.id}:`,
            professorError
          );
        }
      }

      setTotalSuppHours(Number.parseFloat(globalSuppHours.toFixed(1)));

      const absencesResponse = await api.get("/absences/count");
      console.log("Absences response after refresh:", absencesResponse.data);
      setAbsences({
        total: absencesResponse.data.totalAbsences || 0,
        justified: absencesResponse.data.justifiedCount || 0,
        unjustified: absencesResponse.data.unjustifiedCount || 0,
      });
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError(
        "Failed to refresh some data. Some features may be unavailable."
      );
    }
    setLoading(false);
  };

  // Filter teachersObligations based on filters
  const filteredObligations = teachersObligations.filter((teacher) => {
    const matchesAccountType =
      accountTypeFilter === "all" ||
      (accountTypeFilter === "postal" &&
        teacher.typeCompte.toLowerCase() === "postal") ||
      (accountTypeFilter === "bancaire" &&
        teacher.typeCompte.toLowerCase() === "bancaire");
    const matchesTeacherType = teacherTypeFilter === "all"; // Placeholder: no teacherType field
    return matchesAccountType && matchesTeacherType;
  });

  return (
    <div className="page-container">
      <Navbar />

      <div className="rapport-content">
        <div className="rapport-header">
          <div>
            <h1>Rapport d'activité</h1>
            <p>
              Consultez et analysez les rapports d'activité des enseignants.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-message">
            <p>Chargement des données...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-content">
                  <h3>Heures sup Totales</h3>
                  <div className="card-value">{totalSuppHours}h</div>
                </div>
                <div className="card-icon hours-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-content">
                  <h3>Absences totales</h3>
                  <div className="card-value">{absences.total}</div>
                </div>
                <div className="card-icon absences-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="18" y1="8" x2="23" y2="13"></line>
                    <line x1="23" y1="8" x2="18" y2="13"></line>
                  </svg>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-content">
                  <h3>Absences justifiées</h3>
                  <div className="card-value">{absences.justified}</div>
                </div>
                <div className="card-icon justified-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-content">
                  <h3>Absences non justifiées</h3>
                  <div className="card-value">{absences.unjustified}</div>
                </div>
                <div className="card-icon unjustified-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
              </div>
            </div>

            {/* Declaration Table */}
            <div className="chart-container declaration-table">
              <div className="table-header">
                <div className="table-filters">
                  <select
                    className="filter-select"
                    value={accountTypeFilter}
                    onChange={handleAccountTypeFilterChange}
                  >
                    <option value="all">Tous</option>
                    <option value="postal">CCP (postal)</option>
                    <option value="bancaire">Bancaire</option>
                  </select>
                </div>
                <h3>Déclaration d'obligation pour les enseignants</h3>
                <button
                  className="download-icon-button"
                  onClick={handleDownloadReport}
                  title="Télécharger le rapport"
                >
                  <FaDownload />
                </button>
              </div>
              <div className="chart-content">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>HS</th>
                      <th>N° CS</th>
                      <th>Type</th>
                      <th>Montant Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredObligations.length > 0 ? (
                      filteredObligations.map((teacher) => (
                        <tr key={teacher.id}>
                          <td>{teacher.id}</td>
                          <td>{teacher.nom}</td>
                          <td>{teacher.prenom}</td>
                          <td>{teacher.heuresSup}</td>
                          <td>{teacher.numeroCompte}</td>
                          <td>{teacher.typeCompte.toLowerCase()}</td>
                          <td>{teacher.montantNet}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          style={{ textAlign: "center", padding: "20px" }}
                        >
                          Aucune donnée disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Teacher Filter */}
            <div className="teacher-filter-container">
              <div className="filter-header">
                <h3>Sélectionner un enseignant</h3>
              </div>
              <div className="filter-content">
                <select
                  value={selectedProfessor}
                  onChange={handleProfessorChange}
                  className="teacher-select"
                >
                  <option value="">Tous les enseignants</option>
                  {professors.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weekly Chart */}
            {selectedProfessor && (
              <div className="chart-container weekly-chart">
                <div className="month-navigation">
                  <button className="nav-button" onClick={goToPreviousMonth}>
                    <FaChevronLeft />
                  </button>
                  <h3>{getMonthName(currentMonth)}</h3>
                  <button className="nav-button" onClick={goToNextMonth}>
                    <FaChevronRight />
                  </button>
                  <button
                    className="download-icon-button"
                    onClick={handleDownloadWeeklyReport}
                    title="Télécharger le rapport hebdomadaire"
                  >
                    <FaDownload />
                  </button>
                </div>
                <div className="chart-content">
                  <table className="data-table weekly-table">
                    <thead>
                      <tr>
                        <th>Jour et Date</th>
                        <th>Nombre d'heures</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.length > 0 ? (
                        weeklyData.map((week, index) => (
                          <tr key={index}>
                            <td>{week.week}</td>
                            <td className="hours-cell">
                              <span>{week.hours}</span>
                              <span className="hours-label">heures</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="2"
                            style={{ textAlign: "center", padding: "20px" }}
                          >
                            Aucune donnée disponible pour ce mois
                          </td>
                        </tr>
                      )}
                      {weeklyData.length > 0 && (
                        <tr className="total-row">
                          <td>Total</td>
                          <td className="hours-cell">
                            <span>{calculateTotalHours()}</span>
                            <span className="hours-label">heures</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Stats */}
            {selectedProfessor && (
              <div className="detailed-stats">
                <h3>Statistiques détaillées</h3>

                <div className="periods-container">
                  {periods.map((period) => {
                    const stats = getPeriodStats(period);
                    return (
                      <div className="period-card" key={period.id}>
                        <div className="period-header">
                          <h4>
                            {period.name} {period.assigned ? "(Assigné)" : ""}
                          </h4>
                          <button
                            className="edit-period-button"
                            onClick={() => togglePeriodEditing(period.id)}
                          >
                            <FaPen />
                          </button>
                        </div>

                        {period.editing ? (
                          <div className="period-edit">
                            <div className="date-inputs">
                              <div className="date-input">
                                <label>Date début</label>
                                <div className="date-input-wrapper">
                                  <FaCalendarAlt className="calendar-icon" />
                                  <input
                                    type="date"
                                    value={period.startDate || ""}
                                    onChange={(e) =>
                                      updatePeriodDate(
                                        period.id,
                                        "startDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              <div className="date-input">
                                <label>Date fin</label>
                                <div className="date-input-wrapper">
                                  <FaCalendarAlt className="calendar-icon" />
                                  <input
                                    type="date"
                                    value={period.endDate || ""}
                                    onChange={(e) =>
                                      updatePeriodDate(
                                        period.id,
                                        "endDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            <button
                              className="save-period-button"
                              onClick={() => savePeriod(period.id)}
                            >
                              Enregistrer
                            </button>
                          </div>
                        ) : (
                          <div className="period-info">
                            <div className="period-dates">
                              {period.startDate && period.endDate ? (
                                <span>
                                  Du{" "}
                                  {new Date(
                                    period.startDate
                                  ).toLocaleDateString()}
                                  au{" "}
                                  {new Date(
                                    period.endDate
                                  ).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="no-dates">
                                  Aucune date sélectionnée
                                </span>
                              )}
                            </div>
                            <div className="period-stats">
                              <div className="stat-row">
                                <span className="stat-label">
                                  Heures supplémentaires:
                                </span>
                                <span className="stat-value">
                                  {stats.hours} heures
                                </span>
                              </div>
                              <div className="stat-row">
                                <span className="stat-label">Absences:</span>
                                <span className="stat-value">
                                  {stats.totalAbsences}
                                </span>
                              </div>
                              <div className="stat-row">
                                <span className="stat-label">
                                  Absences justifiées:
                                </span>
                                <span className="stat-value">
                                  {stats.justifiedAbsences}
                                </span>
                              </div>
                              <div className="stat-row">
                                <span className="stat-label">
                                  Absences non justifiées:
                                </span>
                                <span className="stat-value">
                                  {stats.unjustifiedAbsences}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Rapport;
