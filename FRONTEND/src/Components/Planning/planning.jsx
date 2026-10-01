"use client";

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import Navbar from "../Prof/Navbar/navbar";
import "./planning.css";

const Planning = () => {
  // State variables for data
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State variables for UI
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [sessions, setSessions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [showJustificationOption, setShowJustificationOption] = useState(false);
  const [absenceJustified, setAbsenceJustified] = useState(false);

  // Add a state variable for the selected semester
  const [selectedSemester, setSelectedSemester] = useState("S1");

  // Form data for new session
  const [newSession, setNewSession] = useState({
    semestre: "S1",
    promotion: "CP_1",
    groupe: "G1",
    salle: "S1",
    jour: "Dimanche",
    heureDebut: { hour: "08", minute: "00" },
    heureFin: { hour: "10", minute: "00" },
    module: "Réseaux",
    type: "COURS",
  });

  // Form data for new holiday
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    description: "",
  });

  // Form data for new absence
  const [newAbsence, setNewAbsence] = useState({
    jourDebut: "",
    jourFin: "",
    heureDebut: { hour: "00", minute: "00" },
    heureFin: { hour: "00", minute: "00" },
    justifiee: false,
    professorId: "",
  });

  // Fetch professors and holidays when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch professors
        const professorsResponse = await api.get("/teachers/");

        // Format professor data for the dropdown
        const formattedProfessors = professorsResponse.data.map(
          (professor) => ({
            id: professor.id,
            name: `${professor.prenom} ${professor.nom}`,
            email: professor.email,
            imageUrl: professor.imageUrl,
          })
        );

        setProfessors(formattedProfessors);

        // Fetch holidays
        const holidaysResponse = await api.get("/jours-feries");

        // Format holiday data
        const formattedHolidays = holidaysResponse.data.map((holiday) => ({
          id: holiday.id,
          date: new Date(holiday.date),
          description: holiday.description,
          day: new Date(holiday.date).toLocaleDateString("fr-FR", {
            weekday: "long",
          }),
        }));

        setHolidays(formattedHolidays);

        // Fetch sessions
        await fetchSessions();

        // Fetch absences
        await fetchAbsences();

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch absences when selected professor changes
  useEffect(() => {
    if (selectedProfessor) {
      fetchAbsences();
    } else {
      setAbsences([]);
    }
  }, [selectedProfessor]);

  // Update the generateWeekDays function to start from Sunday
  const generateWeekDays = (date) => {
    const day = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = date.getDate() - day; // Adjust to start week on Sunday
    const sunday = new Date(date.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);
      days.push({
        date: nextDay,
        day: [
          "Dimanche",
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
        ][nextDay.getDay()], // Full day names
        dateNum: nextDay.getDate(),
      });
    }
    return days;
  };

  // Get week date range string
  const getWeekDateRange = () => {
    if (currentWeek.length === 0) return "";

    const startDate = currentWeek[0].date;
    const endDate = currentWeek[6].date;

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.toLocaleString("default", { month: "long" });
    const endMonth = endDate.toLocaleString("default", { month: "long" });
    const year = startDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth} ${year}`;
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    }
  };

  // Add useEffect to initialize the week days
  useEffect(() => {
    setCurrentWeek(generateWeekDays(new Date(currentDate)));
  }, [currentDate]);

  // Update newAbsence.professorId when selectedProfessor changes
  useEffect(() => {
    setNewAbsence((prev) => ({
      ...prev,
      professorId: selectedProfessor,
    }));
  }, [selectedProfessor]);

  // Handle opening session details
  const handleSessionClick = (session) => {
    setSelectedSession(session);

    // Check if the session is already marked as absent
    const sessionDay = currentWeek.find((day) => day.day === session.day);
    if (sessionDay) {
      const existingAbsence = absences.find((absence) => {
        const sameDay =
          absence.startDate.getDate() === sessionDay.date.getDate() &&
          absence.startDate.getMonth() === sessionDay.date.getMonth() &&
          absence.startDate.getFullYear() === sessionDay.date.getFullYear();

        const sameTime =
          absence.startTime === session.startTime &&
          absence.endTime === session.endTime;

        const sameProfessor = absence.professorId === session.professorId;

        return sameDay && sameTime && sameProfessor;
      });

      if (existingAbsence) {
        setShowJustificationOption(true);
        setAbsenceJustified(existingAbsence.justified);
      } else {
        setShowJustificationOption(false);
        setAbsenceJustified(false);
      }
    } else {
      setShowJustificationOption(false);
      setAbsenceJustified(false);
    }

    setShowSessionModal(true);
  };

  // First, modify the handleSessionChange function to remove enseignant field
  const handleSessionChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setNewSession({
        ...newSession,
        [parent]: {
          ...newSession[parent],
          [child]: value,
        },
      });
    } else {
      setNewSession({
        ...newSession,
        [name]: value,
      });
    }
  };

  // Handle form input changes for new holiday
  const handleHolidayChange = (e) => {
    const { name, value } = e.target;
    setNewHoliday({
      ...newHoliday,
      [name]: value,
    });
  };

  // Handle form input changes for new absence
  const handleAbsenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setNewAbsence({
        ...newAbsence,
        [parent]: {
          ...newAbsence[parent],
          [child]: value,
        },
      });
    } else {
      setNewAbsence({
        ...newAbsence,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Add a function to handle semester change
  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
  };

  // Add a function to filter sessions by selected professor
  const getFilteredSessions = () => {
    // If no professor is selected, return empty array (no sessions should appear)
    if (!selectedProfessor) {
      return [];
    }

    let filtered = sessions;

    // Filter by professor
    filtered = filtered.filter(
      (session) => session.professorId === selectedProfessor
    );

    // Filter by semester - only show sessions for the selected semester
    filtered = filtered.filter(
      (session) => session.semestre === selectedSemester
    );

    return filtered;
  };

  // Add a function to filter absences by selected professor
  const getFilteredAbsences = () => {
    if (!selectedProfessor) return absences;
    return absences.filter(
      (absence) => absence.professorId === selectedProfessor
    );
  };

  // Fetch sessions from the API
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/sessions");

      // Format sessions for frontend display
      const formattedSessions = response.data.map((session) => {
        // Format time
        const startHour = session.heureDebut.toString().padStart(2, "0");
        const startMinute = session.minuteDebut.toString().padStart(2, "0");
        const endHour = session.heureFin.toString().padStart(2, "0");
        const endMinute = session.minuteFin.toString().padStart(2, "0");

        const startTime = `${startHour}:${startMinute}`;
        const endTime = `${endHour}:${endMinute}`;

        // Determine color based on session type
        let color;
        switch (session.typeSession) {
          case "COURS":
            color = "#ffcccc"; // Light red
            break;
          case "TD":
            color = "#ffddbb"; // Light orange
            break;
          case "TP":
            color = "#ccffcc"; // Light green
            break;
          default:
            color = "#e6e6ff"; // Light blue
        }

        // Find the teacher ID if available
        const teacherId =
          session.enseignants && session.enseignants.length > 0
            ? session.enseignants[0].id.toString()
            : null;

        return {
          id: session.id,
          professorId: teacherId,
          day: session.jour,
          startTime,
          endTime,
          module: session.module,
          type: session.typeSession,
          promotion: session.promotion,
          group: session.groupe,
          room: session.salle,
          color,
          semestre: session.semestre,
        };
      });

      setSessions(formattedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to load sessions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch absences from the API
  const fetchAbsences = async () => {
    try {
      let response;

      // If a professor is selected, fetch their specific absences
      if (selectedProfessor) {
        response = await api.get(`/teacher/${selectedProfessor}/absences`);

        // The teacher-specific endpoint returns a different structure
        // Extract the absences array from the response
        const absencesData = response.data.absences || [];

        // Format absences for frontend display
        const formattedAbsences = absencesData.map((absence) => {
          // Format time
          const startHour = absence.heureDebut.toString().padStart(2, "0");
          const startMinute = absence.minuteDebut.toString().padStart(2, "0");
          const endHour = absence.heureFin.toString().padStart(2, "0");
          const endMinute = absence.minuteFin.toString().padStart(2, "0");

          const startTime = `${startHour}:${startMinute}`;
          const endTime = `${endHour}:${endMinute}`;

          return {
            id: absence.id,
            startDate: new Date(absence.dateDebut),
            endDate: new Date(absence.dateFin),
            startTime,
            endTime,
            justified: absence.justifiee,
            professorId: absence.enseignantId
              ? absence.enseignantId.toString()
              : null,
            sessionId: absence.sessionId,
          };
        });

        console.log(
          `Fetched ${formattedAbsences.length} absences for teacher ${selectedProfessor}:`,
          formattedAbsences
        );
        setAbsences(formattedAbsences);
      } else {
        // If no professor is selected, clear absences or fetch all
        setAbsences([]);
      }

      // Force a re-render by updating the lastUpdateTime
      setLastUpdateTime(Date.now());
    } catch (error) {
      console.error("Error fetching absences:", error);
      setAbsences([]);
    }
  };

  // Modify the handleAddSession function to connect to the backend API
  const handleAddSession = async () => {
    // Validate inputs
    if (
      !selectedProfessor ||
      !newSession.jour ||
      !newSession.module ||
      !newSession.type
    ) {
      alert(
        "Veuillez sélectionner un enseignant et remplir tous les champs obligatoires"
      );
      return;
    }

    try {
      setLoading(true);

      // Update the new session with the currently selected semester
      setNewSession((prev) => ({
        ...prev,
        semestre: selectedSemester,
      }));

      // Format hours and minutes with leading zeros
      const startHour = newSession.heureDebut.hour.padStart(2, "0");
      const startMinute = newSession.heureDebut.minute.padStart(2, "0");
      const endHour = newSession.heureFin.hour.padStart(2, "0");
      const endMinute = newSession.heureFin.minute.padStart(2, "0");

      // Convert time inputs to proper format
      const startTime = `${startHour}:${startMinute}`;
      const endTime = `${endHour}:${endMinute}`;

      // Map the promotion string to the enum value
      const promotionValue = newSession.promotion;

      // Map the day string to the enum value
      const jourValue = newSession.jour;

      // Map the session type to the enum value
      const typeSessionValue = newSession.type;

      // Create session data for API
      const sessionData = {
        semestre: newSession.semestre,
        promotion: promotionValue,
        groupe: newSession.groupe,
        salle: newSession.salle,
        jour: jourValue,
        heureDebut: Number.parseInt(startHour),
        minuteDebut: Number.parseInt(startMinute),
        heureFin: Number.parseInt(endHour),
        minuteFin: Number.parseInt(endMinute),
        module: newSession.module,
        typeSession: typeSessionValue,
        teacherIds: [Number.parseInt(selectedProfessor)], // Convert to integer and put in array
      };

      // Send to backend
      const response = await api.post("/sessions", sessionData);
      const createdSession = response.data;

      // Determine color based on session type
      let color;
      switch (newSession.type) {
        case "COURS":
          color = "#ffcccc"; // Light red
          break;
        case "TD":
          color = "#ffddbb"; // Light orange
          break;
        case "TP":
          color = "#ccffcc"; // Light green
          break;
        default:
          color = "#e6e6ff"; // Light blue
      }

      // Format the created session for frontend display
      const newSessionObj = {
        id: createdSession.id,
        professorId: selectedProfessor,
        day: newSession.jour,
        startTime: startTime,
        endTime: endTime,
        module: newSession.module,
        type: newSession.type,
        promotion: newSession.promotion,
        group: newSession.groupe,
        room: newSession.salle,
        color,
        semestre: newSession.semestre,
      };

      // Add to sessions array
      setSessions([...sessions, newSessionObj]);
      setShowAddModal(false);

      // Reset form
      setNewSession({
        semestre: "S1",
        promotion: "CP_1",
        groupe: "G1",
        salle: "S1",
        jour: "Dimanche",
        heureDebut: { hour: "08", minute: "00" },
        heureFin: { hour: "10", minute: "00" },
        module: "Réseaux",
        type: "COURS",
      });
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update the handleAddHoliday function to add holidays to the calendar and backend
  const handleAddHoliday = async () => {
    if (!newHoliday.date) {
      alert("Veuillez sélectionner une date");
      return;
    }

    try {
      // Create a holiday in the backend
      const response = await api.post("/jours-feries", {
        date: new Date(newHoliday.date).toISOString(),
        description: newHoliday.description || "Jour Férié",
      });

      // Get the created holiday from the response
      const createdHoliday = response.data;

      // Format the holiday for the frontend
      const holidayDate = new Date(createdHoliday.date);
      const dayName = [
        "Dimanche",
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
      ][holidayDate.getDay()];

      const newHolidayObj = {
        id: createdHoliday.id,
        date: holidayDate,
        day: dayName,
        description: createdHoliday.description,
      };

      // Add to holidays array
      setHolidays([...holidays, newHolidayObj]);
      setShowHolidayModal(false);

      // Reset form
      setNewHoliday({
        date: "",
        description: "",
      });
    } catch (error) {
      console.error("Error creating holiday:", error);
      alert("Failed to create holiday. Please try again.");
    }
  };

  // Update the handleAddAbsence function to add absences to the calendar for a date range and save to backend
  const handleAddAbsence = async () => {
    if (!selectedProfessor) {
      alert("Veuillez sélectionner un enseignant");
      return;
    }

    if (!newAbsence.jourDebut || !newAbsence.jourFin) {
      alert("Veuillez sélectionner les dates de début et de fin");
      return;
    }

    try {
      setLoading(true);

      // Create absence for the date range
      const startDate = new Date(newAbsence.jourDebut);
      const endDate = new Date(newAbsence.jourFin);

      // Format time inputs
      const startHour = newAbsence.heureDebut.hour.padStart(2, "0");
      const startMinute = newAbsence.heureDebut.minute.padStart(2, "0");
      const endHour = newAbsence.heureFin.hour.padStart(2, "0");
      const endMinute = newAbsence.heureFin.minute.padStart(2, "0");

      const startTime = `${startHour}:${startMinute}`;
      const endTime = `${endHour}:${endMinute}`;

      // Check if this is a full day absence (00:00 to 00:00)
      const isFullDay =
        startHour === "00" &&
        startMinute === "00" &&
        endHour === "00" &&
        endMinute === "00";

      // Get all sessions for the selected professor
      const professorSessions = sessions.filter(
        (session) => session.professorId === selectedProfessor
      );

      // Create new absences for each session in the date range
      const newAbsences = [];

      // For each day in the range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Get the day name for this date
        const dayName = [
          "Dimanche",
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
        ][currentDate.getDay()];

        // Find sessions on this day
        const sessionsOnDay = professorSessions.filter(
          (session) => session.day === dayName
        );

        // For each session on this day
        for (const session of sessionsOnDay) {
          // Convert session times to minutes for comparison
          const [sessionStartHour, sessionStartMinute] = session.startTime
            .split(":")
            .map(Number);
          const [sessionEndHour, sessionEndMinute] = session.endTime
            .split(":")
            .map(Number);

          const sessionStartMinutes =
            sessionStartHour * 60 + sessionStartMinute;
          const sessionEndMinutes = sessionEndHour * 60 + sessionEndMinute;

          // Convert absence times to minutes
          const absenceStartMinutes =
            Number.parseInt(startHour) * 60 + Number.parseInt(startMinute);
          const absenceEndMinutes =
            Number.parseInt(endHour) * 60 + Number.parseInt(endMinute);

          // Determine if this session should be marked as absent based on the date and time
          let shouldMarkAbsent = false;

          // If it's a full day absence (00:00 to 00:00), mark all sessions as absent
          if (isFullDay) {
            shouldMarkAbsent = true;
          }
          // If it's the first day of the absence range
          else if (currentDate.getTime() === startDate.getTime()) {
            // On the first day, only mark sessions that start after the absence start time
            shouldMarkAbsent = sessionStartMinutes >= absenceStartMinutes;
          }
          // If it's the last day of the absence range
          else if (currentDate.getTime() === endDate.getTime()) {
            // On the last day, only mark sessions that end before the absence end time
            shouldMarkAbsent = sessionEndMinutes <= absenceEndMinutes;
          }
          // For days in between the start and end dates, mark all sessions as absent
          else {
            shouldMarkAbsent = true;
          }

          if (shouldMarkAbsent) {
            const absenceDate = new Date(currentDate);

            // Create absence data for API
            const absenceData = {
              dateDebut: absenceDate.toISOString(),
              dateFin: absenceDate.toISOString(),
              heureDebut: sessionStartHour,
              minuteDebut: sessionStartMinute,
              heureFin: sessionEndHour,
              minuteFin: sessionEndMinute,
              justifiee: newAbsence.justifiee,
              enseignantId: Number.parseInt(selectedProfessor),
              sessionId: session.id,
            };

            // Send to backend
            const response = await api.post("/absences", absenceData);
            const createdAbsence = response.data;

            // Format the created absence for frontend display
            const newAbsenceObj = {
              id: createdAbsence.id,
              startDate: absenceDate,
              endDate: absenceDate,
              startTime: session.startTime,
              endTime: session.endTime,
              justified: newAbsence.justifiee,
              professorId: selectedProfessor,
              sessionId: session.id,
            };

            newAbsences.push(newAbsenceObj);
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Add all the new absences
      if (newAbsences.length > 0) {
        setAbsences([...absences, ...newAbsences]);
      } else {
        alert(
          "Aucune séance trouvée dans la plage de dates et heures sélectionnée"
        );
      }

      setShowAbsenceModal(false);

      // Reset form
      setNewAbsence({
        jourDebut: "",
        jourFin: "",
        heureDebut: { hour: "00", minute: "00" },
        heureFin: { hour: "00", minute: "00" },
        justifiee: false,
        professorId: selectedProfessor,
      });
    } catch (error) {
      console.error("Error creating absences:", error);
      alert("Failed to create absences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add navigation functions for the week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Add a function to check if a session is marked as absent
  const isSessionAbsent = (session) => {
    const sessionDay = currentWeek.find((day) => day.day === session.day);
    if (!sessionDay) return false;

    return getFilteredAbsences().some((absence) => {
      // Check if absence is for this session
      const sameDay =
        absence.startDate.getDate() === sessionDay.date.getDate() &&
        absence.startDate.getMonth() === sessionDay.date.getMonth() &&
        absence.startDate.getFullYear() === sessionDay.date.getFullYear();

      const sameTime =
        absence.startTime === session.startTime &&
        absence.endTime === session.endTime;

      const sameProfessor = absence.professorId === session.professorId;

      return sameDay && sameTime && sameProfessor;
    });
  };

  // Add a function to get absence info for a session
  const getSessionAbsenceInfo = (session) => {
    const sessionDay = currentWeek.find((day) => day.day === session.day);
    if (!sessionDay) return null;

    return getFilteredAbsences().find((absence) => {
      const sameDay =
        absence.startDate.getDate() === sessionDay.date.getDate() &&
        absence.startDate.getMonth() === sessionDay.date.getMonth() &&
        absence.startDate.getFullYear() === sessionDay.date.getFullYear();

      const sameTime =
        absence.startTime === session.startTime &&
        absence.endTime === session.endTime;

      const sameProfessor = absence.professorId === session.professorId;

      return sameDay && sameTime && sameProfessor;
    });
  };

  // Modify the handleDeleteSession function to also delete associated absences
  const handleDeleteSession = async () => {
    if (selectedSession) {
      try {
        setLoading(true);

        // Delete the session from the backend
        await api.delete(`/sessions/${selectedSession.id}`);

        // Delete the session from the frontend state
        setSessions(
          sessions.filter((session) => session.id !== selectedSession.id)
        );

        // Find and delete any associated absences
        const sessionDay = currentWeek.find(
          (day) => day.day === selectedSession.day
        );
        if (sessionDay) {
          const absencesToDelete = absences.filter((absence) => {
            // Check if absence is on the same day and time as the session
            const sameDay =
              absence.startDate.getDate() === sessionDay.date.getDate() &&
              absence.startDate.getMonth() === sessionDay.date.getMonth() &&
              absence.startDate.getFullYear() === sessionDay.date.getFullYear();

            const sameTime =
              absence.startTime === selectedSession.startTime &&
              selectedSession.endTime === selectedSession.endTime;

            const sameProfessor =
              selectedSession.professorId &&
              absence.professorId === selectedSession.professorId;

            return sameDay && sameTime && sameProfessor;
          });

          // Delete each absence from the backend
          for (const absence of absencesToDelete) {
            await api.delete(`/absences/${absence.id}`);
          }

          // Update the frontend state
          setAbsences(
            absences.filter((absence) => {
              // Check if absence is on the same day and time as the session
              const sameDay =
                absence.startDate.getDate() === sessionDay.date.getDate() &&
                absence.startDate.getMonth() === sessionDay.date.getMonth() &&
                absence.startDate.getFullYear() ===
                  sessionDay.date.getFullYear();

              const sameTime =
                absence.startTime === selectedSession.startTime &&
                selectedSession.endTime === selectedSession.endTime;

              const sameProfessor =
                selectedSession.professorId &&
                absence.professorId === selectedSession.professorId;

              // Keep absences that don't match this session
              return !(sameDay && sameTime && sameProfessor);
            })
          );
        }

        setShowSessionModal(false);
      } catch (error) {
        console.error("Error deleting session:", error);
        alert("Failed to delete session. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Mark or unmark session as absence directly from the session modal
  const handleMarkSessionAsAbsence = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);

      // Find the day in current week
      const sessionDay = currentWeek.find(
        (day) => day.day === selectedSession.day
      );
      if (!sessionDay) return;

      const sessionDate = sessionDay.date;

      // Check if the session is already marked as absent
      const existingAbsenceIndex = absences.findIndex((absence) => {
        const sameDay =
          absence.startDate.getDate() === sessionDay.date.getDate() &&
          absence.startDate.getMonth() === sessionDay.date.getMonth() &&
          absence.startDate.getFullYear() === sessionDay.date.getFullYear();

        const sameTime =
          absence.startTime === selectedSession.startTime &&
          selectedSession.endTime === selectedSession.endTime;

        const sameProfessor =
          selectedSession.professorId &&
          absence.professorId === selectedSession.professorId;

        return sameDay && sameTime && sameProfessor;
      });

      // If showJustificationOption is false, we're removing the absence
      if (!showJustificationOption) {
        if (existingAbsenceIndex !== -1) {
          // Delete the absence from the backend
          await api.delete(`/absences/${absences[existingAbsenceIndex].id}`);

          // Remove the absence from the frontend state
          const newAbsences = [...absences];
          newAbsences.splice(existingAbsenceIndex, 1);
          setAbsences(newAbsences);
        }
        setShowSessionModal(false);
        return;
      }

      // Parse time values from the session
      const [startHour, startMinute] = selectedSession.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = selectedSession.endTime
        .split(":")
        .map(Number);

      // If we're here, we're either adding a new absence or updating an existing one
      if (existingAbsenceIndex !== -1) {
        // Update existing absence
        const absenceToUpdate = absences[existingAbsenceIndex];

        // Update in backend
        await api.put(`/absences/${absenceToUpdate.id}`, {
          dateDebut: sessionDate.toISOString(),
          dateFin: sessionDate.toISOString(),
          heureDebut: startHour,
          minuteDebut: startMinute,
          heureFin: endHour,
          minuteFin: endMinute,
          justifiee: absenceJustified,
          enseignantId: Number.parseInt(selectedSession.professorId),
          sessionId: selectedSession.id,
        });

        // Update in frontend state
        const newAbsences = [...absences];
        newAbsences[existingAbsenceIndex] = {
          ...absenceToUpdate,
          justified: absenceJustified,
        };
        setAbsences(newAbsences);
      } else {
        // Create new absence in backend
        const absenceData = {
          dateDebut: sessionDate.toISOString(),
          dateFin: sessionDate.toISOString(),
          heureDebut: startHour,
          minuteDebut: startMinute,
          heureFin: endHour,
          minuteFin: endMinute,
          justifiee: absenceJustified,
          enseignantId: Number.parseInt(selectedSession.professorId),
          sessionId: selectedSession.id,
        };

        const response = await api.post("/absences", absenceData);
        const createdAbsence = response.data;

        // Add to frontend state
        const newAbsenceObj = {
          id: createdAbsence.id,
          startDate: sessionDate,
          endDate: sessionDate,
          startTime: selectedSession.startTime,
          endTime: selectedSession.endTime,
          justified: absenceJustified,
          professorId: selectedSession.professorId,
          sessionId: selectedSession.id,
        };

        setAbsences([...absences, newAbsenceObj]);
      }

      // Close modal
      setShowSessionModal(false);
    } catch (error) {
      console.error("Error updating absence:", error);
      alert("Failed to update absence. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add a function to get the current month and year
  const getCurrentMonthYear = () => {
    const date = currentWeek.length > 0 ? currentWeek[0].date : new Date();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return { month: month.charAt(0).toUpperCase() + month.slice(1), year };
  };

  // Generate time slots for the calendar (30-minute intervals)
  const timeSlots = [];
  for (let i = 8; i <= 17; i++) {
    timeSlots.push(`${i.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${i.toString().padStart(2, "0")}:30`);
  }

  // Check if a day is a holiday
  const isDayHoliday = (day) => {
    const dayDate = day.date;
    return holidays.some(
      (holiday) =>
        holiday.date.getDate() === dayDate.getDate() &&
        holiday.date.getMonth() === dayDate.getMonth() &&
        holiday.date.getFullYear() === dayDate.getFullYear()
    );
  };

  // Get holiday info for a day
  const getHolidayInfo = (day) => {
    const dayDate = day.date;
    return holidays.find(
      (holiday) =>
        holiday.date.getDate() === dayDate.getDate() &&
        holiday.date.getMonth() === dayDate.getMonth() &&
        holiday.date.getFullYear() === dayDate.getFullYear()
    );
  };

  // Check if a time slot has an absence
  const hasAbsence = (day, timeSlot) => {
    const dayDate = day.date;
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = hour * 60 + minute; // Convert to minutes for easier comparison

    return getFilteredAbsences().some((absence) => {
      // Check if the day is within the absence date range
      const isInDateRange =
        dayDate >= new Date(absence.startDate) &&
        dayDate <= new Date(absence.endDate);

      if (!isInDateRange) return false;

      // Check if the time slot is within the absence time range
      const [startHour, startMinute] = absence.startTime.split(":").map(Number);
      const [endHour, endMinute] = absence.endTime.split(":").map(Number);

      const absenceStartTime = startHour * 60 + startMinute;
      const absenceEndTime = endHour * 60 + endMinute;

      return slotTime >= absenceStartTime && slotTime < absenceEndTime;
    });
  };

  // Get absence info for a time slot
  const getAbsenceInfo = (day, timeSlot) => {
    const dayDate = day.date;
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = hour * 60 + minute;

    return getFilteredAbsences().find((absence) => {
      const isInDateRange =
        dayDate >= new Date(absence.startDate) &&
        dayDate <= new Date(absence.endDate);

      if (!isInDateRange) return false;

      const [startHour, startMinute] = absence.startTime.split(":").map(Number);
      const [endHour, endMinute] = absence.endTime.split(":").map(Number);

      const absenceStartTime = startHour * 60 + startMinute;
      const absenceEndTime = endHour * 60 + endMinute;

      return slotTime >= absenceStartTime && slotTime < absenceEndTime;
    });
  };

  // Calculate session position and dimensions - FIXED VERSION
  const getSessionPosition = (session) => {
    // Find the day column index
    const dayIndex = currentWeek.findIndex((d) => d.day === session.day);
    if (dayIndex === -1) return null; // Not in current week

    // Parse time values
    const [startHour, startMinute] = session.startTime.split(":").map(Number);
    const [endHour, endMinute] = session.endTime.split(":").map(Number);

    // Calculate start and end in minutes since 8:00
    const startMinutes = (startHour - 8) * 60 + startMinute;

    // Calculate total minutes from start to end
    const totalStartMinutes = startHour * 60 + startMinute;
    const totalEndMinutes = endHour * 60 + endMinute;
    const durationMinutes = totalEndMinutes - totalStartMinutes;

    // Calculate position and size
    return {
      dayIndex,
      top: startMinutes,
      height: durationMinutes,
    };
  };

  // Handle deleting a holiday
  const handleDeleteHoliday = async (holiday) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce jour férié?")) {
      try {
        // Delete from backend
        await api.delete(`/jours-feries/${holiday.id}`);

        // Delete from frontend state
        setHolidays(holidays.filter((h) => h.id !== holiday.id));
      } catch (error) {
        console.error("Error deleting holiday:", error);
        alert("Failed to delete holiday. Please try again.");
      }
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // In the return statement, replace the entire return with this:
  return (
    <div className="page-container">
      <Navbar />

      <div className="planning-content">
        <div className="planning-header">
          <h1>gestion d'emploi du temps</h1>
          <p>
            Gérez et organisez les emplois du temps des enseignants
            efficacement.
          </p>
        </div>

        <div className="holiday-section">
          <div className="section-header">
            <h2 className="section-title">Les jours fériés</h2>
            <button
              className="add-button"
              onClick={() => setShowHolidayModal(true)}
            >
              <span className="plus-icon">+</span>
            </button>
          </div>
          <p className="section-description">
            Ajoutez et gérez les jours fériés afin qu'ils soient automatiquement
            intégrés dans l'emploi du temps de tous les enseignants et pris en
            compte dans le calcul des heures.
          </p>
        </div>

        <div className="planning-controls">
          <div className="professor-select">
            {loading ? (
              <div className="loading-message">
                Chargement des enseignants...
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <select
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
              >
                <option value="">Select enseignant</option>
                {professors.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="planning-actions">
            <button
              className="action-button add-creneau"
              onClick={() => setShowAddModal(true)}
              disabled={!selectedProfessor}
            >
              <span className="plus-icon">+</span> ajouter créneau
            </button>
          </div>
        </div>

        <div className="calendar-navigation">
          <button className="nav-button prev" onClick={goToPreviousWeek}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div className="date-selector">
            <div className="dropdown-container">
              <select
                value={
                  currentWeek.length > 0
                    ? currentWeek[0].date.getMonth()
                    : new Date().getMonth()
                }
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(Number.parseInt(e.target.value));
                  setCurrentDate(newDate);
                }}
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <span className="dropdown-icon">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>

            <div className="dropdown-container">
              <select
                value={
                  currentWeek.length > 0
                    ? currentWeek[0].date.getFullYear()
                    : new Date().getFullYear()
                }
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(Number.parseInt(e.target.value));
                  setCurrentDate(newDate);
                }}
              >
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - 5 + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="dropdown-icon">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
          </div>

          <button className="nav-button next" onClick={goToNextWeek}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div className="legend">
          <div className="legend-item">
            <span className="legend-dot absence"></span>
            <span>absence</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot jour-ferie"></span>
            <span>jour férié</span>
          </div>
          <button
            className="absence-button"
            onClick={() => setShowAbsenceModal(true)}
            disabled={!selectedProfessor}
          >
            <span className="plus-icon">+</span> ajouter absence
          </button>
        </div>

        <div className="calendar-container">
          <div className="calendar-header">
            <div className="time-column"></div>
            {currentWeek.map((day, index) => {
              const holidayInfo = isDayHoliday(day)
                ? getHolidayInfo(day)
                : null;
              const dayAbbr = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][
                index
              ];

              return (
                <div
                  key={index}
                  className={`day-column ${
                    isDayHoliday(day) ? "holiday-day" : ""
                  } ${
                    day.day === "Vendredi" || day.day === "Samedi"
                      ? "weekend-day"
                      : ""
                  }`}
                >
                  <div className="day-name">{dayAbbr}</div>
                  <div className="day-date">{day.dateNum}</div>
                  {holidayInfo && (
                    <div className="holiday-indicator">
                      <button
                        className="delete-holiday-btn"
                        onClick={() => handleDeleteHoliday(holidayInfo)}
                        title="Supprimer ce jour férié"
                      >
                        ×
                      </button>
                      Jour Férié
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="calendar-grid">
            <div className="time-labels">
              {timeSlots.map((time, index) => (
                <div key={index} className="time-slot">
                  {time}
                </div>
              ))}
            </div>

            <div className="calendar-content">
              {/* Calendar cells */}
              {timeSlots.map((time, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {currentWeek.map((day, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`calendar-cell 
                        ${isDayHoliday(day) ? "holiday-cell" : ""} 
                        ${hasAbsence(day, time) ? "absence-cell" : ""}
                        ${
                          day.day === "Vendredi" || day.day === "Samedi"
                            ? "weekend-cell"
                            : ""
                        }
                    `}
                    >
                      {isDayHoliday(day) && rowIndex === 0 && (
                        <div className="holiday-content">
                          {getHolidayInfo(day)?.description || "Jour Férié"}
                        </div>
                      )}
                      {hasAbsence(day, time) && rowIndex % 2 === 0 && (
                        <div
                          className={`absence-content ${
                            getAbsenceInfo(day, time)?.justified
                              ? "justified"
                              : "unjustified"
                          }`}
                        >
                          Absence{" "}
                          {getAbsenceInfo(day, time)?.justified
                            ? "Justifiée"
                            : "Non Justifiée"}
                        </div>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}

              {/* Sessions - Filter by selected professor */}
              {getFilteredSessions().map((session, index) => {
                const position = getSessionPosition(session);
                if (!position) return null;

                const { dayIndex, top, height } = position;
                const isAbsent = isSessionAbsent(session);
                const absenceInfo = isAbsent
                  ? getSessionAbsenceInfo(session)
                  : null;

                return (
                  <div
                    key={index}
                    className={`session-item ${
                      isAbsent ? "absent-session" : ""
                    }`}
                    style={{
                      left: `calc(${dayIndex} * (100% / 7))`,
                      width: `calc(100% / 7)`,
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: isAbsent ? "#ffcccc" : session.color,
                    }}
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="session-time">
                      {session.startTime} - {session.endTime}
                    </div>
                    <div className="session-title">{session.module}</div>
                    <div className="session-details">
                      {session.promotion}{" "}
                      {session.group !== "/" ? session.group : ""}
                    </div>
                    {isAbsent && (
                      <div className="absence-badge">
                        {absenceInfo?.justified ? "Justifiée" : "Absent"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Ajout d'un créneau</h2>
              <p>Provide the necessary informations for the new timeslot</p>
              <button
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Semestre</label>
                  <select
                    name="semestre"
                    value={newSession.semestre}
                    onChange={handleSessionChange}
                  >
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Promotion</label>
                  <select
                    name="promotion"
                    value={newSession.promotion}
                    onChange={handleSessionChange}
                  >
                    <option value="CP_1">CP_1</option>
                    <option value="CP_2">CP_2</option>
                    <option value="CS_1">CS_1</option>
                    <option value="CS_2">CS_2</option>
                    <option value="CS_3">CS_3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Groupe</label>
                  <select
                    name="groupe"
                    value={newSession.groupe}
                    onChange={handleSessionChange}
                  >
                    <option value="G1">G1</option>
                    <option value="G2">G2</option>
                    <option value="G3">G3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Salle</label>
                  <select
                    name="salle"
                    value={newSession.salle}
                    onChange={handleSessionChange}
                  >
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Jour</label>
                <select
                  name="jour"
                  value={newSession.jour}
                  onChange={handleSessionChange}
                >
                  <option value="Dimanche">Dimanche</option>
                  <option value="Lundi">Lundi</option>
                  <option value="Mardi">Mardi</option>
                  <option value="Mercredi">Mercredi</option>
                  <option value="Jeudi">Jeudi</option>
                  <option value="Vendredi">Vendredi</option>
                  <option value="Samedi">Samedi</option>
                </select>
              </div>

              <div className="form-row time-inputs">
                <div className="form-group">
                  <label>Heure Début</label>
                  <div className="time-input-container">
                    <input
                      type="text"
                      name="heureDebut.hour"
                      value={newSession.heureDebut.hour}
                      onChange={handleSessionChange}
                      maxLength="2"
                    />
                    <span>h</span>
                    <input
                      type="text"
                      name="heureDebut.minute"
                      value={newSession.heureDebut.minute}
                      onChange={handleSessionChange}
                      maxLength="2"
                    />
                    <span>min</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Heure Fin</label>
                  <div className="time-input-container">
                    <input
                      type="text"
                      name="heureFin.hour"
                      value={newSession.heureFin.hour}
                      onChange={handleSessionChange}
                      maxLength="2"
                    />
                    <span>h</span>
                    <input
                      type="text"
                      name="heureFin.minute"
                      value={newSession.heureFin.minute}
                      onChange={handleSessionChange}
                      maxLength="2"
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Module</label>
                <select
                  name="module"
                  value={newSession.module}
                  onChange={handleSessionChange}
                >
                  <option value="Réseaux">Réseaux</option>
                  <option value="ACSI">ACSI</option>
                  <option value="Programmation">Programmation</option>
                </select>
              </div>

              <div className="form-group">
                <label>Type de séance</label>
                <select
                  name="type"
                  value={newSession.type}
                  onChange={handleSessionChange}
                >
                  <option value="COURS">Cours</option>
                  <option value="TD">TD</option>
                  <option value="TP">TP</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="save-button" onClick={handleAddSession}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && selectedSession && (
        <div className="modal-overlay">
          <div className="modal-container session-details-modal">
            <button
              className="close-button"
              onClick={() => setShowSessionModal(false)}
            >
              ×
            </button>
            <div className="session-time-header">
              {selectedSession.startTime} - {selectedSession.endTime}
            </div>
            <div className="session-details-content">
              <div className="detail-row">
                <span className="detail-label">Séance</span>
                <span className="detail-value">{selectedSession.module}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Promotion</span>
                <span className="detail-value">
                  {selectedSession.promotion}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Groupe</span>
                <span className="detail-value">{selectedSession.group}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Salle</span>
                <span className="detail-value">{selectedSession.room}</span>
              </div>

              <div className="session-actions">
                <div className="absence-option">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={showJustificationOption}
                      onChange={(e) =>
                        setShowJustificationOption(e.target.checked)
                      }
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label">
                      Marquer comme absence
                    </span>
                  </label>

                  <div
                    className="justification-option"
                    style={{
                      display: showJustificationOption ? "flex" : "none",
                    }}
                  >
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={absenceJustified}
                        onChange={(e) => setAbsenceJustified(e.target.checked)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-label">Justifiée</span>
                    </label>
                  </div>

                  <button
                    className="action-button"
                    onClick={handleMarkSessionAsAbsence}
                  >
                    Confirmer
                  </button>
                </div>

                <button
                  className="action-button delete"
                  onClick={handleDeleteSession}
                >
                  <span className="trash-icon">🗑️</span> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHolidayModal && (
        <div className="modal-overlay">
          <div className="modal-container holiday-modal">
            <div className="modal-header">
              <h2>Les jours fériés</h2>
              <button
                className="close-button"
                onClick={() => setShowHolidayModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Jour</label>
                  <input
                    type="date"
                    name="date"
                    value={newHoliday.date}
                    onChange={handleHolidayChange}
                  />
                </div>
                <div className="form-group">
                  <label>Événement</label>
                  <input
                    type="text"
                    name="description"
                    value={newHoliday.description}
                    onChange={handleHolidayChange}
                    placeholder="Description de l'événement"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="save-button" onClick={handleAddHoliday}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAbsenceModal && (
        <div className="modal-overlay">
          <div className="modal-container absence-modal">
            <div className="modal-header">
              <h2>Ajout d'une absence</h2>
              <p>
                Enregistrez une absence pour ce créneau en précisant la raison.
              </p>
              <button
                className="close-button"
                onClick={() => setShowAbsenceModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Jour Début</label>
                  <input
                    type="date"
                    name="jourDebut"
                    value={newAbsence.jourDebut}
                    onChange={handleAbsenceChange}
                  />
                </div>
                <div className="form-group">
                  <label>Jour Fin</label>
                  <input
                    type="date"
                    name="jourFin"
                    value={newAbsence.jourFin}
                    onChange={handleAbsenceChange}
                  />
                </div>
              </div>

              <div className="form-row time-inputs">
                <div className="form-group">
                  <label>Heure Début</label>
                  <div className="time-input-container">
                    <input
                      type="text"
                      name="heureDebut.hour"
                      value={newAbsence.heureDebut.hour}
                      onChange={handleAbsenceChange}
                      maxLength="2"
                    />
                    <span>h</span>
                    <input
                      type="text"
                      name="heureDebut.minute"
                      value={newAbsence.heureDebut.minute}
                      onChange={handleAbsenceChange}
                      maxLength="2"
                    />
                    <span>min</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Heure Fin</label>
                  <div className="time-input-container">
                    <input
                      type="text"
                      name="heureFin.hour"
                      value={newAbsence.heureFin.hour}
                      onChange={handleAbsenceChange}
                      maxLength="2"
                    />
                    <span>h</span>
                    <input
                      type="text"
                      name="heureFin.minute"
                      value={newAbsence.heureFin.minute}
                      onChange={handleAbsenceChange}
                      maxLength="2"
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    name="justifiee"
                    checked={newAbsence.justifiee}
                    onChange={handleAbsenceChange}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-label">Justifiée</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="save-button" onClick={handleAddAbsence}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;
