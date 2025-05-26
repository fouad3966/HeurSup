const prisma = require('../prisma/prisma');

const creerEnseignantGrade = async (req, res) => {
  try {
    const { enseignantId, gradeId, dateDebut, dateFin } = req.body;

    const enseignantGrade = await prisma.enseignantGrade.create({
      data: {
        enseignant: { connect: { id: enseignantId } },
        grade: { connect: { id: gradeId } },
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
      },
    });

    res.status(201).json(enseignantGrade);
  } catch (error) {
    console.error("Erreur lors de la création de l'enseignant-grade :", error);
    res.status(500).json({ erreur: `Échec de la création de l'enseignant-grade ${error.meta.cause}` });
  }
};

const mettreAJourEnseignantGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { enseignantId, gradeId, dateDebut, dateFin } = req.body;

    const enseignantGrade = await prisma.enseignantGrade.update({
      where: { id: Number(id) },
      data: {
        enseignant: { connect: { id: enseignantId } },
        grade: { connect: { id: gradeId } },
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
      },
    });

    res.status(200).json(enseignantGrade);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'enseignant-grade :", error);
    res.status(500).json({ erreur: "Échec de la mise à jour de l'enseignant-grade" });
  }
};

const supprimerEnseignantGrade = async (req, res) => {
  const { id } = req.params;

  try {
    const enseignantGrade = await prisma.enseignantGrade.findUnique({ where: { id: parseInt(id) } });

    if (!enseignantGrade) {
      return res.status(404).json({ erreur: "Enseignant-grade introuvable" });
    }

    await prisma.enseignantGrade.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: "Enseignant-grade supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'enseignant-grade :", error);
    res.status(500).json({ erreur: "Échec de la suppression de l'enseignant-grade" });
  }
};

const obtenirTousLesEnseignantGrades = async (req, res) => {
  try {
    const enseignantGrades = await prisma.enseignantGrade.findMany({
      include: {
        enseignant: true,
        grade: true,
      },
    });
    res.status(200).json(enseignantGrades);
  } catch (error) {
    console.error("Erreur lors de la récupération des enseignant-grades :", error);
    res.status(500).json({ erreur: "Échec de la récupération des enseignant-grades" });
  }
};

module.exports = {
  creerEnseignantGrade,
  mettreAJourEnseignantGrade,
  supprimerEnseignantGrade,
  obtenirTousLesEnseignantGrades,
};
