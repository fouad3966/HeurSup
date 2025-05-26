const prisma = require('../prisma/prisma');

const creerAbsence = async (req, res) => {
  try {
    const {
      dateDebut,
      dateFin,
      heureDebut,
      minuteDebut,
      heureFin,
      minuteFin,
      justifiee,
      enseignantId,
      sessionId,
    } = req.body;

    const absence = await prisma.absence.create({
      data: {
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        heureDebut,
        minuteDebut,
        heureFin,
        minuteFin,
        justifiee,
        enseignant: enseignantId ? { connect: { id: enseignantId } } : undefined,
        session: sessionId ? { connect: { id: sessionId } } : undefined,
      },
    });

    res.status(201).json(absence);
  } catch (error) {
    console.error("Erreur lors de la création de l'absence :", error);
    res.status(500).json({ erreur: "Échec de la création de l'absence" });
  }
};

const mettreAJourAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dateDebut,
      dateFin,
      heureDebut,
      minuteDebut,
      heureFin,
      minuteFin,
      justifiee,
      enseignantId,
      sessionId,
    } = req.body;

    const absence = await prisma.absence.update({
      where: { id: Number(id) },
      data: {
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        heureDebut,
        minuteDebut,
        heureFin,
        minuteFin,
        justifiee,
        enseignant: enseignantId ? { connect: { id: enseignantId } } : undefined,
        session: sessionId ? { connect: { id: sessionId } } : undefined,
      },
    });

    res.status(200).json(absence);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'absence :", error);
    res.status(500).json({ erreur: "Échec de la mise à jour de l'absence" });
  }
};

const supprimerAbsence = async (req, res) => {
  const { id } = req.params;

  try {
    const absence = await prisma.absence.findUnique({ where: { id: parseInt(id) } });

    if (!absence) {
      return res.status(404).json({ erreur: "Absence introuvable" });
    }

    await prisma.absence.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: "Absence supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'absence :", error);
    res.status(500).json({ erreur: "Échec de la suppression de l'absence" });
  }
};

const getAbsencesByTeacher = async (req, res) => {
  const enseignantId = parseInt(req.params.id);

  if (isNaN(enseignantId)) {
    return res.status(400).json({ error: "Invalid teacher ID" });
  }

  try {
    // Fetch all absences for the teacher
    const absences = await prisma.absence.findMany({
      where: {
        enseignantId: enseignantId,
      },
      orderBy: {
        dateDebut: 'desc',
      },
    });

    // Count total, justified, and unjustified
    const totalAbsences = absences.length;
    const justifiedCount = absences.filter(a => a.justifiee).length;
    const unjustifiedCount = totalAbsences - justifiedCount;

    res.json({
      enseignantId,
      totalAbsences,
      justifiedCount,
      unjustifiedCount,
      absences, // optional: comment out if you only want counts
    });

  } catch (error) {
    console.error("Erreur récupération des absences:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des absences" });
  }
};

const countAbsences = async (req, res) => {
  try {
    // Fetch only the fields needed for counting
    const absences = await prisma.absence.findMany({
      select: {
        justifiee: true,
      },
    });

    const totalAbsences = absences.length;
    const justifiedCount = absences.filter(a => a.justifiee).length;
    const unjustifiedCount = totalAbsences - justifiedCount;

    res.json({
      totalAbsences,
      justifiedCount,
      unjustifiedCount,
    });
  } catch (error) {
    console.error("Erreur lors du comptage des absences:", error);
    res.status(500).json({ error: "Erreur serveur lors du comptage des absences" });
  }
};

const getAbsencesByTeacherGroupedByPeriod = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacherIdInt = parseInt(teacherId, 10);

    // Check if teacher exists
    const teacher = await prisma.enseignant.findUnique({
      where: {
        id: teacherIdInt, // Corrected to use teacherIdInt instead of Int
      },
      include: {
        periodesTravail: {
          include: {
            periodeTravail: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Fetch absences for the teacher
    const absences = await prisma.absence.findMany({
      where: { enseignantId: teacherIdInt },
    });

    // Group absences by period
    const periodsWithCounts = teacher.periodesTravail.map((pt) => {
      const period = pt.periodeTravail;
      const periodAbsences = absences.filter((absence) => {
        const absenceStart = new Date(absence.dateDebut).getTime();
        const periodStart = new Date(period.dateDebut).getTime();
        const periodEnd = new Date(period.dateFin).getTime();
        return absenceStart >= periodStart && absenceStart <= periodEnd;
      });

      const totalAbsences = periodAbsences.length;
      const justifiedCount = periodAbsences.filter((a) => a.justifiee).length;
      const unjustifiedCount = totalAbsences - justifiedCount;

      return {
        periodId: period.id,
        periodStart: period.dateDebut.toISOString().split('T')[0],
        periodEnd: period.dateFin.toISOString().split('T')[0],
        totalAbsences,
        justifiedCount,
        unjustifiedCount,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        teacherId: teacherIdInt,
        periods: periodsWithCounts,
      },
    });
  } catch (error) {
    console.error("Error grouping absences by period:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  creerAbsence,
  mettreAJourAbsence,
  supprimerAbsence,
  getAbsencesByTeacher,
  countAbsences,
  getAbsencesByTeacherGroupedByPeriod,
};