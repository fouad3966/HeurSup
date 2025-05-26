const prisma = require('../prisma/prisma');

const creerJourFerie = async (req, res) => {
  try {
    const { date, description } = req.body;

    const jourFerie = await prisma.jourFerie.create({
      data: {
        date: new Date(date),
        description,
      },
    });

    res.status(201).json(jourFerie);
  } catch (error) {
    console.error("Erreur lors de la création du jour férié :", error);
    res.status(500).json({ erreur: "Échec de la création du jour férié" });
  }
};

const supprimerJourFerie = async (req, res) => {
  const { id } = req.params;

  try {
    const jourFerie = await prisma.jourFerie.findUnique({ where: { id: parseInt(id) } });

    if (!jourFerie) {
      return res.status(404).json({ erreur: "Jour férié introuvable" });
    }

    await prisma.jourFerie.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: "Jour férié supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du jour férié :", error);
    res.status(500).json({ erreur: "Échec de la suppression du jour férié" });
  }
};

const obtenirTousLesJoursFeries = async (req, res) => {
  try {
    const joursFeries = await prisma.jourFerie.findMany();
    res.status(200).json(joursFeries);
  } catch (error) {
    console.error("Erreur lors de la récupération des jours fériés :", error);
    res.status(500).json({ erreur: "Échec de la récupération des jours fériés" });
  }
};

module.exports = {
  creerJourFerie,
  supprimerJourFerie,
  obtenirTousLesJoursFeries,
};
