const prisma = require("../prisma/prisma");

const getSupplementaryHourSessions = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacherIdInt = Number.parseInt(teacherId, 10);

    const teacher = await prisma.enseignant.findUnique({
      where: { id: teacherIdInt },
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const sessions = await prisma.session.findMany({
      where: {
        enseignants: {
          some: {
            id: teacherIdInt,
          },
        },
      },
      include: {
        enseignants: true,
      },
    });

    if (!sessions.length) {
      return res.status(404).json({ success: false, message: "No sessions found for this teacher" });
    }

    let suppSessions = [];
    let regularSessions = [];
    let totalSuppHours = 0;
    let totalRegularTDEquivalent = 0;

    // Check if teacher is vacataire
    if (teacher.vacataire) {
      // All sessions are supplementary for vacataire
      suppSessions = sessions.map((session) => {
        const startTime = session.heureDebut + session.minuteDebut / 60;
        const endTime = session.heureFin + session.minuteFin / 60;
        const duration = endTime - startTime;
        const coefficient =
          session.typeSession === "COURS"
            ? 1.5
            : session.typeSession === "TD"
            ? 1
            : session.typeSession === "TP"
            ? 0.75
            : 1;

        const tdEquivalent = duration * coefficient;
        const roundedDuration = Math.ceil(duration);

        totalSuppHours += roundedDuration;

        return {
          ...session,
          duration: roundedDuration,
          tdEquivalent,
          partially: false,
          SuppHeureDebut: session.heureDebut,
          SuppMinuteDebut: session.minuteDebut,
        };
      });
      regularSessions = [];
      totalRegularTDEquivalent = 0;
    } else {
      // Permanent: regular/supplementary calculation
      const sessionsWithDetails = sessions.map((session) => {
        const startTime = session.heureDebut + session.minuteDebut / 60;
        const endTime = session.heureFin + session.minuteFin / 60;
        const duration = endTime - startTime;

        const coefficient =
          session.typeSession === "COURS"
            ? 1.5
            : session.typeSession === "TD"
            ? 1
            : session.typeSession === "TP"
            ? 0.75
            : 1;

        const tdEquivalent = duration * coefficient;

        return {
          ...session,
          duration,
          tdEquivalent,
        };
      });

      const sortedSessions = [...sessionsWithDetails].sort((a, b) => {
        const typeOrder = { COURS: 0, TD: 1, TP: 2 };
        if (typeOrder[a.typeSession] !== typeOrder[b.typeSession]) {
          return typeOrder[a.typeSession] - typeOrder[b.typeSession];
        }

        const dayOrder = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        return dayOrder.indexOf(a.jour) - dayOrder.indexOf(b.jour);
      });

      let remainingTDHours = 9-teacher.charge;

      for (const session of sortedSessions) {
        if (remainingTDHours >= session.tdEquivalent) {
          remainingTDHours -= session.tdEquivalent;
          regularSessions.push(session);
          totalRegularTDEquivalent += session.tdEquivalent;
        } else if (remainingTDHours > 0) {
          const regularPortion = remainingTDHours;
          const suppPortion = session.tdEquivalent - remainingTDHours;

          const suppRatio = suppPortion / session.tdEquivalent;
          const regularRatio = regularPortion / session.tdEquivalent;
          const suppDuration = suppRatio * session.duration;

          const totalSessionMinutes = session.duration * 60;
          const regularMinutes = regularRatio * totalSessionMinutes;

          const sessionStartMinutes = session.heureDebut * 60 + session.minuteDebut;
          const suppStartMinutes = sessionStartMinutes + regularMinutes;

          const suppHeureDebut = Math.floor(suppStartMinutes / 60);
          const suppMinuteDebut = Math.floor(suppStartMinutes % 60);

          const roundedSuppDuration = Math.ceil(suppDuration);

          suppSessions.push({
            ...session,
            partially: true,
            originalDuration: session.duration,
            duration: roundedSuppDuration,
            tdEquivalent: suppPortion,
            regularPortion,
            SuppHeureDebut: suppHeureDebut,
            SuppMinuteDebut: suppMinuteDebut,
          });
          totalSuppHours += roundedSuppDuration;
          totalRegularTDEquivalent += regularPortion;
          remainingTDHours = 0;
        } else {
          const roundedSessionDuration = Math.ceil(session.duration);
          suppSessions.push({
            ...session,
            partially: false,
            SuppHeureDebut: session.heureDebut,
            SuppMinuteDebut: session.minuteDebut,
            duration: roundedSessionDuration,
          });
          totalSuppHours += roundedSessionDuration;
        }
      }
    }

    // Save or update supplementary hours record
    let suppHoursRecord = await prisma.suppHours.findUnique({
      where: { enseignantId: teacherIdInt }
    });

    if (suppHoursRecord) {
      suppHoursRecord = await prisma.suppHours.update({
        where: { enseignantId: teacherIdInt },
        data: { heuresTotal: totalSuppHours }
      });
      await prisma.suppHourSession.deleteMany({
        where: { suppHoursId: suppHoursRecord.id }
      });
    } else {
      suppHoursRecord = await prisma.suppHours.create({
        data: {
          enseignantId: teacherIdInt,
          heuresTotal: totalSuppHours
        }
      });
    }

    // Create supp hour sessions links
    for (const session of suppSessions) {
      await prisma.suppHourSession.create({
        data: {
          suppHoursId: suppHoursRecord.id,
          sessionId: session.id,
          partially: session.partially || false,
          SuppHeureDebut: session.SuppHeureDebut,
          SuppMinuteDebut: session.SuppMinuteDebut,
          duration: session.duration || 1.0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplementary hours calculated and saved successfully",
      data: {
        id: suppHoursRecord.id,
        teacherId: teacherIdInt,
        totalRegularTDEquivalent,
        totalSuppHours,
        suppSessionsCount: suppSessions.length,
        regularSessionsCount: regularSessions.length,
      },
    });
  } catch (error) {
    console.error("Error calculating and saving supplementary hours:", error);
    return res.status(500).json({
      success: false,
      error: `Failed to calculate and save supplementary hours: ${error.message}`,
    });
  }
};

const getTeacherSuppHours = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacherIdInt = parseInt(teacherId, 10);

    const teacher = await prisma.enseignant.findUnique({
      where: { id: teacherIdInt }
    });

    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: "Teacher not found" 
      });
    }

    const suppHours = await prisma.suppHours.findMany({
      where: { enseignantId: teacherIdInt },
      include: {
        sessionsLink: {
          include: {
            session: {
              select: {
                jour: true
              }
            }
          }
        }
      }
    });

    if (!suppHours || suppHours.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No supplementary hours found for this teacher" 
      });
    }

    return res.status(200).json({
      success: true,
      data: suppHours
    });
  } catch (error) {
    console.error("Error fetching teacher supplementary hours:", error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch teacher supplementary hours: ${error.message}`
    });
  }
};
const getTeacherSuppHoursInPeriod = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.body;
    const teacherIdInt = parseInt(teacherId, 10);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required in the request body"
      });
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD format."
      });
    }

    // Get teacher info
    const teacher = await prisma.enseignant.findUnique({
      where: { id: teacherIdInt },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: `Teacher with ID ${teacherIdInt} not found.`
      });
    }

    // Get supplementary hours record
    const suppHours = await prisma.suppHours.findUnique({
      where: { enseignantId: teacherIdInt },
      include: {
        sessionsLink: {
          include: { session: true }
        }
      }
    });

    // Return zero if no supp hours
    if (!suppHours) {
      return res.status(200).json({
        success: true,
        data: {
          teacherId: teacherIdInt,
          teacherName: `${teacher.prenom} ${teacher.nom}`,
          typeCompte: teacher.typeCompte,
          numeroCompte: teacher.numeroCompte,
          periodStart: startDate,
          periodEnd: endDate,
          periodTotal: 0,
          totalSessions: 0,
          montantNet: 0,
          sessionsDates: [],
          message: "No supplementary hours found for this teacher."
        }
      });
    }

    // Build date map for the period
    const dateMap = new Map();
    const currentDate = new Date(startDateTime);
    while (currentDate <= endDateTime) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][currentDate.getDay()];
      dateMap.set(dateString, { date: new Date(currentDate), dayOfWeek });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Absences in period
    const absences = await prisma.absence.findMany({
      where: {
        enseignantId: teacherIdInt,
        dateDebut: { gte: startDateTime },
        dateFin: { lte: endDateTime }
      }
    });

    // Calculate total supplementary hours, filter by absences and holidays
    let periodTotalHours = 0;
    let totalSessions = 0;
    let sessionsDates = [];

    for (const suppSession of suppHours.sessionsLink) {
      const session = suppSession.session;
      const sessionDay = session.jour;

      // All matching dates in range
      const matchingDates = Array.from(dateMap.entries())
        .filter(([_, data]) => data.dayOfWeek === sessionDay)
        .map(([dateStr, data]) => ({ dateStr, date: data.date }));

      for (const { dateStr } of matchingDates) {
        // Skip if absent
        const isAbsent = absences.some(absence => {
          const absenceDate = new Date(absence.dateDebut);
          const absenceDateStr = absenceDate.toISOString().split('T')[0];
          if (absenceDateStr !== dateStr) return false;
          const absenceStart = absence.heureDebut * 60 + absence.minuteDebut;
          const absenceEnd = absence.heureFin * 60 + absence.minuteFin;
          const suppStart = suppSession.SuppHeureDebut * 60 + suppSession.SuppMinuteDebut;
          const suppEnd = suppStart + (suppSession.duration * 60);
          return (
            (suppStart >= absenceStart && suppStart < absenceEnd) ||
            (suppEnd > absenceStart && suppEnd <= absenceEnd) ||
            (suppStart <= absenceStart && suppEnd >= absenceEnd)
          );
        });
        if (isAbsent) continue;

        // Skip if holiday
        const isHoliday = await prisma.jourFerie.findFirst({
          where: {
            date: {
              gte: new Date(dateStr + 'T00:00:00Z'),
              lt: new Date(dateStr + 'T23:59:59Z')
            }
          }
        });
        if (isHoliday) continue;

        // Valid session: count it
        periodTotalHours += suppSession.duration;
        totalSessions++;
        sessionsDates.push(dateStr);
      }
    }

    // Get current grade (active during period)
    let enseignantGrades = await prisma.enseignantGrade.findMany({
      where: {
        enseignantId: teacherIdInt,
        dateDebut: { lte: endDateTime },
        OR: [
          { dateFin: null },
          { dateFin: { gte: startDateTime } }
        ]
      },
      include: { grade: true },
      orderBy: { dateDebut: 'desc' }
    });

    // Fallback: If no grade matched the exact period, just get the latest known grade
    if (enseignantGrades.length === 0) {
      enseignantGrades = await prisma.enseignantGrade.findMany({
        where: { enseignantId: teacherIdInt },
        include: { grade: true },
        orderBy: { dateDebut: 'desc' },
        take: 1
      });
    }
    
    let grade = enseignantGrades.length > 0 ? enseignantGrades[0].grade.nom : null;

    // Calculate montantNet
    let montantNet = 0;
    if (grade && periodTotalHours) {
      if (grade === "MCA") montantNet = 840 * periodTotalHours;
      else if (grade === "MCB") montantNet = 750 * periodTotalHours;
      else if (grade === "PROF") montantNet = 960 * periodTotalHours;
      else montantNet = 0;
    }
    montantNet = Math.round(montantNet * 100) / 100; // 2 decimals

    // Final response
    return res.status(200).json({
      success: true,
      data: {
        teacherId: teacherIdInt,
        teacherName: `${teacher.prenom} ${teacher.nom}`,
        typeCompte: teacher.typeCompte,
        numeroCompte: teacher.numeroCompte,
        periodStart: startDate,
        periodEnd: endDate,
        periodTotal: parseFloat(periodTotalHours.toFixed(2)),
        totalSessions,
        montantNet,
        sessionsDates
      }
    });
  } catch (error) {
    console.error("Error calculating supplementary hours in period:", error);
    return res.status(500).json({
      success: false,
      error: `Failed to calculate supplementary hours in period: ${error.message}`
    });
  }
};


const getTeacherSuppHoursByPeriod = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate teacherId
    if (!teacherId || isNaN(parseInt(teacherId, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing teacherId",
      });
    }

    const teacherIdInt = parseInt(teacherId, 10);

    // Check if teacher exists
    const teacher = await prisma.enseignant.findUnique({
      where: { id: teacherIdInt },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Fetch supplementary hours with related sessions and teacher's work periods
    const suppHours = await prisma.suppHours.findMany({
      where: { enseignantId: teacherIdInt },
      include: {
        sessionsLink: {
          include: {
            session: {
              select: {
                id: true,
                jour: true,
                semestre: true,
                promotion: true,
                groupe: true,
                salle: true,
                heureDebut: true,
                minuteDebut: true,
                heureFin: true,
                minuteFin: true,
                module: true,
                typeSession: true,
              },
            },
          },
        },
        enseignant: {
          include: {
            periodesTravail: {
              include: {
                periodeTravail: {
                  select: {
                    id: true,
                    dateDebut: true,
                    dateFin: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group supplementary hours by work period
    const groupedSuppHours = suppHours.reduce((acc, suppHour) => {
      const periods = suppHour.enseignant.periodesTravail.map((pt) => ({
        periodId: pt.periodeTravail.id,
        dateDebut: pt.periodeTravail.dateDebut,
        dateFin: pt.periodeTravail.dateFin,
        sessions: suppHour.sessionsLink.map((link) => ({
          jour: link.session.jour,
          semestre: link.session.semestre,
          promotion: link.session.promotion,
          groupe: link.session.groupe,
          salle: link.session.salle,
          heureDebut: link.session.heureDebut,
          minuteDebut: link.session.minuteDebut,
          heureFin: link.session.heureFin,
          minuteFin: link.session.minuteFin,
          module: link.session.module,
          typeSession: link.session.typeSession,
          duration: link.duration,
        })),
        heuresTotal: suppHour.heuresTotal,
      }));

      return [...acc, ...periods];
    }, []);

    return res.status(200).json({
      success: true,
      data: groupedSuppHours,
    });
  } catch (error) {
    console.error("Error grouping supp hours by period:", error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

const getTeacherWeeklyHoursByMonth = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacherIdInt = parseInt(teacherId, 10);

    // Check if teacher exists
    const teacher = await prisma.enseignant.findUnique({
      where: { id: teacherIdInt },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Fetch supplementary hours with related sessions
    const suppHours = await prisma.suppHours.findMany({
      where: { enseignantId: teacherIdInt },
      include: {
        sessionsLink: {
          include: {
            session: {
              select: {
                jour: true,
              },
            },
          },
        },
      },
    });

    // Calculate global total (sum of all heuresTotal)
    const globalTotalHours = suppHours.reduce((sum, record) => sum + record.heuresTotal, 0);

    if (!suppHours.length) {
      return res.status(200).json({
        success: true,
        data: {
          months: [],
          globalTotal: { label: "Total Global", hours: 0 },
          message: "No supplementary hours found for this teacher.",
        },
      });
    }

    // Process all months of 2025
    const year = 2025;
    const allMonths = [];
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    for (let month = 1; month <= 12; month++) {
      const firstDayOfMonth = new Date(year, month - 1, 1);
      const lastDayOfMonth = new Date(year, month, 0); // Last day of the month
      const weeks = {};
      let weekNum = 1;
      let weekStart = new Date(firstDayOfMonth);

      // Calculate weeks for the current month
      while (weekStart <= lastDayOfMonth) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of the week (7 days)
        if (weekEnd > lastDayOfMonth) {
          weekEnd.setDate(lastDayOfMonth.getDate());
        }

        weeks[weekNum] = { start: new Date(weekStart), end: new Date(weekEnd) };
        weekStart.setDate(weekStart.getDate() + 7);
        weekNum++;
      }

      // Initialize weekly hours for the month
      const weeklyHours = {};
      for (const weekNum of Object.keys(weeks)) {
        weeklyHours[weekNum] = 0;
      }

      // Aggregate hours by week based on session jour
      suppHours.forEach((suppHour) => {
        suppHour.sessionsLink.forEach((link) => {
          const sessionDay = link.session.jour;
          for (const [weekNum, { start, end }] of Object.entries(weeks)) {
            let currentDate = new Date(start);
            while (currentDate <= end) {
              if (daysOfWeek[currentDate.getDay()] === sessionDay) {
                weeklyHours[weekNum] += link.duration || 0;
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        });
      });

      // Calculate monthly total
      const monthlyTotal = Object.values(weeklyHours).reduce((sum, hours) => sum + hours, 0);

      // Add month data to the response
      allMonths.push({
        month: new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long' }),
        weeks: Object.entries(weeklyHours).map(([weekNum, hours]) => ({
          week: `Semaine ${weekNum} [${weeks[weekNum].start.toISOString().split("T")[0]},${weeks[weekNum].end.toISOString().split("T")[0]}]`,
          hours: parseFloat(hours.toFixed(1)),
        })),
        total: {
          label: "Total",
          hours: parseFloat(monthlyTotal.toFixed(1)),
        },
      });
    }

    // Prepare response data
    const responseData = {
      months: allMonths,
      globalTotal: {
        label: "Total Global",
        hours: parseFloat(globalTotalHours.toFixed(1)),
      },
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error grouping weekly hours:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTotalSuppHoursAllTeachers = async (req, res) => {
  try {
    // Fetch all teachers with their suppHours and related sessions and work periods
    const teachers = await prisma.enseignant.findMany({
      include: {
        suppHours: {
          include: {
            sessionsLink: {
              include: {
                session: true,
              },
            },
          },
        },
        periodesTravail: {
          include: {
            periodeTravail: true,
          },
        },
      },
    });

    let totalSuppHoursAllTeachers = 0;

    // Iterate over each teacher
    for (const teacher of teachers) {
      if (!teacher.suppHours || teacher.suppHours.length === 0) continue;

      // Each teacher should have one SuppHours record by your schema (enseignantId is unique)
      const suppHoursRecord = teacher.suppHours[0];

      if (!suppHoursRecord || !teacher.periodesTravail) continue;

      // Sum supp hours only if session dates fall within the teacher's work periods
      // We can sum suppHoursRecord.heuresTotal directly if periods don't need filtering by date
      // But let's be accurate and check session dates inside periods if needed

      // Map teacher's work periods for quick date range check
      const periods = teacher.periodesTravail.map((pt) => pt.periodeTravail);

      // Sum supplementary hours only for sessions inside any period
      let teacherSuppHoursSum = 0;

      for (const sessionLink of suppHoursRecord.sessionsLink) {
        const sessionDate = sessionLink.session.jour; // This is enum, not date — no direct date info here

        // The schema does not provide session date but day of week (Jour enum).
        // Assuming session dates are not provided, you can sum all supp hours as they relate to teacher's periods
        // If you want to filter by periods (dateDebut, dateFin), you would need session date fields, which don't exist here.
        // So sum all supp hours linked to the teacher

        teacherSuppHoursSum += sessionLink.duration;
      }

      totalSuppHoursAllTeachers += teacherSuppHoursSum;
    }

    return res.status(200).json({
      success: true,
      totalSuppHours: totalSuppHoursAllTeachers,
    });
  } catch (error) {
    console.error("Error calculating total supplementary hours:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};





// Helper function to calculate supplementary hours for a specific teacher in a specific period
const calculateTeacherPeriodSuppHours = async (teacherId, startDate, endDate) => {
  try {
    // Get teacher's supplementary hours record
    const suppHours = await prisma.suppHours.findUnique({
      where: { enseignantId: teacherId },
      include: {
        sessionsLink: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!suppHours) {
      return 0;
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    // Create date map for the period
    const dateMap = new Map();
    const currentDate = new Date(startDateTime);

    while (currentDate <= endDateTime) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][currentDate.getDay()];
      dateMap.set(dateString, { date: new Date(currentDate), dayOfWeek });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get absences for this teacher in this period
    const absences = await prisma.absence.findMany({
      where: {
        enseignantId: teacherId,
        dateDebut: {
          gte: startDateTime,
        },
        dateFin: {
          lte: endDateTime,
        },
      },
    });

    let periodTotalHours = 0;

    // Process each supplementary session
    for (const suppSession of suppHours.sessionsLink) {
      const session = suppSession.session;
      const sessionDay = session.jour;
      
      // Find matching dates for this session day in the period
      const matchingDates = Array.from(dateMap.entries())
        .filter(([_, data]) => data.dayOfWeek === sessionDay)
        .map(([dateStr, data]) => ({ dateStr, date: data.date }));
      
      for (const { dateStr } of matchingDates) {
        // Check if session is affected by absence
        const isAbsent = absences.some((absence) => {
          const absenceDate = new Date(absence.dateDebut);
          const absenceDateStr = absenceDate.toISOString().split('T')[0];

          if (absenceDateStr !== dateStr) return false;

          const absenceStart = absence.heureDebut * 60 + absence.minuteDebut;
          const absenceEnd = absence.heureFin * 60 + absence.minuteFin;
          const suppStart = suppSession.SuppHeureDebut * 60 + suppSession.SuppMinuteDebut;
          const suppEnd = suppStart + (suppSession.duration * 60);

          return (
            (suppStart >= absenceStart && suppStart < absenceEnd) ||
            (suppEnd > absenceStart && suppEnd <= absenceEnd) ||
            (suppStart <= absenceStart && suppEnd >= absenceEnd)
          );
        });

        if (isAbsent) continue;

        // Check if it's a holiday
        const isHoliday = await prisma.jourFerie.findFirst({
          where: {
            date: {
              gte: new Date(dateStr + 'T00:00:00Z'),
              lt: new Date(dateStr + 'T23:59:59Z'),
            },
          },
        });

        if (isHoliday) continue;

        // Add session duration to period total
        periodTotalHours += suppSession.duration;
      }
    }

    return periodTotalHours;

  } catch (error) {
    console.error(`Error calculating period supp hours for teacher ${teacherId}:`, error);
    return 0;
  }
};



module.exports = {
  getSupplementaryHourSessions,
  getTeacherSuppHours,
  getTeacherSuppHoursInPeriod,
  getTeacherSuppHoursByPeriod,
  getTeacherWeeklyHoursByMonth,
};