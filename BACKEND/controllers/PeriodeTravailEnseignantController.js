const prisma = require('../prisma/prisma');

const creerPeriodeTravailEnseignant = async (req, res) => {
  try {
    const { enseignantId, periodeTravailId } = req.body;

    const periodeTravailEnseignant = await prisma.periodeTravailEnseignant.create({
      data: {
        enseignant: { connect: { id: enseignantId } },
        periodeTravail: { connect: { id: periodeTravailId } },
      },
    });

    res.status(201).json(periodeTravailEnseignant);
  } catch (error) {
    console.error("Erreur lors de la création de la période de travail enseignant :", error);
    res.status(500).json({ erreur: "Échec de la création de la période de travail enseignant" });
  }
};

const supprimerPeriodeTravailEnseignant = async (req, res) => {
  const { id } = req.params;

  try {
    const periodeTravailEnseignant = await prisma.periodeTravailEnseignant.findUnique({ where: { id: parseInt(id) } });

    if (!periodeTravailEnseignant) {
      return res.status(404).json({ erreur: "Période de travail enseignant introuvable" });
    }

    await prisma.periodeTravailEnseignant.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: "Période de travail enseignant supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la période de travail enseignant :", error);
    res.status(500).json({ erreur: "Échec de la suppression de la période de travail enseignant" });
  }
};

const obtenirToutesLesPeriodesTravailEnseignant = async (req, res) => {
  try {
    const periodeTravailEnseignants = await prisma.periodeTravailEnseignant.findMany({
      include: {
        enseignant: true,
        periodeTravail: true,
      },
    });
    res.status(200).json(periodeTravailEnseignants);
  } catch (error) {
    console.error("Erreur lors de la récupération des périodes de travail enseignant :", error);
    res.status(500).json({ erreur: "Échec de la récupération des périodes de travail enseignant" });
  }
};

module.exports = {
  creerPeriodeTravailEnseignant,
  supprimerPeriodeTravailEnseignant,
  obtenirToutesLesPeriodesTravailEnseignant,
};
