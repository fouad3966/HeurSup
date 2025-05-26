const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // ✅ Single instance

// Helper to find the closest static end date
function getClosestStaticEndDate() {
  const now = new Date();
  const currentYear = now.getFullYear();

  const endOfFirstPeriod = new Date(currentYear, 11, 31); // Dec 31
  const endOfSecondPeriod = new Date(currentYear, 0, 20);  // Jan 20
  const endOfThirdPeriod = new Date(currentYear, 4, 8);    // May 8

  const possibleDates = [];

  if (endOfFirstPeriod > now) possibleDates.push(endOfFirstPeriod);
  if (endOfThirdPeriod > now) possibleDates.push(endOfThirdPeriod);
  if (now.getMonth() === 0 && now <= endOfSecondPeriod) possibleDates.push(endOfSecondPeriod);

  return possibleDates.reduce((closest, date) => {
    const diff = date - now;
    return !closest || diff < (closest - now) ? date : closest;
  }, null);
}


// ✅ Create enseignant + initial grade + period
const creerEnseignant = async (req, res) => {
  try {
    const {
      prenom, nom, email, dateNaissance, genre, numeroTelephone,
      vacataire, charge, matiere, typeCompte, numeroCompte, droitHeuresSup,
      gradeId, periodeTravailId, imageUrl, imagePublicId,
    } = req.body;

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const enseignant = await tx.enseignant.create({
        data: {
          prenom, nom, email,
          dateNaissance: new Date(dateNaissance),
          genre, numeroTelephone,
          vacataire, charge, matiere,
          typeCompte, numeroCompte, droitHeuresSup, imageUrl,
           imagePublicId,
        },
      });

      await tx.enseignantGrade.create({
        data: {
          enseignantId: enseignant.id,
          gradeId,
          dateDebut: now,
        },
      });

      await tx.periodeTravailEnseignant.create({
        data: {
          enseignantId: enseignant.id,
          periodeTravailId,
        },
      });

      res.status(201).json({ message: "Enseignant créé avec succès", enseignant });
    });
  } catch (error) {
    console.error("Erreur création enseignant:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// ✅ Grade change with historic tracking
const gererChangementDeGrade = async (enseignantId, nouveauGradeId) => {
  const now = new Date();
  const selectedEndDate = getClosestStaticEndDate();

  await prisma.$transaction(async (tx) => {
    await tx.enseignantGrade.updateMany({
      where: { enseignantId, dateFin: null },
      data: { dateFin: now },
    });

    await tx.enseignantGrade.create({
      data: {
        enseignantId,
        gradeId: nouveauGradeId,
        dateDebut: now,
      },
    });

    const dernierePeriode = await tx.periodeTravailEnseignant.findFirst({
      where: { enseignantId },
      orderBy: {
        periodeTravail: {
          dateDebut: 'desc',
        },
      },
      include: {
        periodeTravail: true,
      },
    });
    

    if (dernierePeriode && dernierePeriode.periodeTravail.dateFin === null) {
      await tx.periodeTravail.update({
        where: {
          id: dernierePeriode.periodeTravailId,
        },
        data: {
          dateFin: now,
        },
      });
    }
    

    const nouvellePeriode = await tx.periodeTravail.create({
      data: {
        dateDebut: now,
        dateFin: selectedEndDate,
      },
    });

    await tx.periodeTravailEnseignant.create({
      data: {
        enseignantId,
        periodeTravailId: nouvellePeriode.id,
      },
    });
  });
};


// ✅ Update enseignant info + handle grade change if needed
const mettreAJourEnseignant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      prenom, nom, email, dateNaissance, genre, numeroTelephone,
      numeroCompte, typeCompte, charge, matiere, droitHeuresSup,
      vacataire, imageUrl, imagePublicId, gradeId
    } = req.body;

    const enseignantId = Number(id);
    if (isNaN(enseignantId)) return res.status(400).json({ erreur: "ID invalide" });

    const enseignant = await prisma.enseignant.findUnique({
      where: { id: enseignantId },
      include: {
        gradeEnseignants: {
          orderBy: { dateDebut: 'desc' },
          take: 1,
        }
      }
    });

    if (!enseignant) return res.status(404).json({ erreur: "Enseignant non trouvé" });

    const dernierGrade = enseignant.gradeEnseignants[0];

    // Grade changed?
    if (!dernierGrade || dernierGrade.gradeId !== Number(gradeId)) {
      await gererChangementDeGrade(enseignantId, Number(gradeId));
    }

    const updated = await prisma.enseignant.update({
      where: { id: enseignantId },
      data: {
        prenom, nom, email,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
        genre, numeroTelephone,
        numeroCompte, typeCompte, charge,
        matiere, droitHeuresSup, vacataire,
        imageUrl, imagePublicId,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Erreur mise à jour enseignant:", error);
    res.status(500).json({ erreur: "Échec de la mise à jour" });
  }
};


// ✅ Delete enseignant and clean relations
const supprimerEnseignant = async (req, res) => {
  const { id } = req.params;
  const enseignantId = Number(id);

  try {
    const enseignant = await prisma.enseignant.findUnique({ where: { id: enseignantId } });
    if (!enseignant) return res.status(404).json({ erreur: "Enseignant introuvable" });

    await prisma.$transaction(async (tx) => {
      await tx.absence.deleteMany({ where: { enseignantId } });
      await tx.periodeTravailEnseignant.deleteMany({ where: { enseignantId } });
      await tx.enseignantGrade.deleteMany({ where: { enseignantId } });
      await tx.suppHourSession.deleteMany({
        where: { suppHours: { enseignantId } }
      });
      await tx.suppHours.deleteMany({ where: { enseignantId } });

      await tx.enseignant.update({
        where: { id: enseignantId },
        data: { sessions: { set: [] } },
      });

      await tx.enseignant.delete({ where: { id: enseignantId } });
    });

    res.status(200).json({ message: "Enseignant supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression enseignant:", error);
    res.status(500).json({ erreur: "Échec de la suppression" });
  }
};


// ✅ Get all enseignants
const obtenirTousLesEnseignants = async (req, res) => {
  try {
    const enseignants = await prisma.enseignant.findMany();
    res.status(200).json(enseignants);
  } catch (error) {
    console.error("Erreur récupération enseignants:", error);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
};


// ✅ List enseignants grouped by current grade
const listerEnseignantsParGrade = async (req, res) => {
  try {
    const enseignantsGradesActuels = await prisma.enseignantGrade.findMany({
      where: { dateFin: null },
      include: { enseignant: true, grade: true },
    });

    const grouped = {};

    for (const eg of enseignantsGradesActuels) {
      const gradeNom = eg.grade.nom;
      if (!grouped[gradeNom]) grouped[gradeNom] = [];
      grouped[gradeNom].push(eg.enseignant);
    }

    res.status(200).json(grouped);
  } catch (error) {
    console.error("Erreur listing enseignants par grade:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



const getEnseignantsParPeriode = async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const allLiens = await prisma.periodeTravailEnseignant.findMany({
      include: {
        enseignant: true,
        periodeTravail: true,
      },
    });

    // Group by periodeTravailId
    const grouped = {};

    for (const lien of allLiens) {
      const periodeId = lien.periodeTravailId;

      if (!grouped[periodeId]) {
        grouped[periodeId] = {
          periode: lien.periodeTravail,
          enseignants: [],
        };
      }

      grouped[periodeId].enseignants.push(lien.enseignant);
    }

    res.status(200).json(grouped);
  } catch (error) {
    console.error("Erreur lors de la récupération des enseignants par période :", error);
    res.status(500).json({ erreur: "Échec de la récupération" });
  }
};


module.exports = {
  creerEnseignant,
  mettreAJourEnseignant,
  supprimerEnseignant,
  obtenirTousLesEnseignants,
  listerEnseignantsParGrade,
  getEnseignantsParPeriode,
};
