const prisma = require("../prisma/prisma");

// CREATE PeriodeTravail
async function creerPeriodeTravail(req, res) {
  try {
    const { dateDebut, dateFin } = req.body;
    const newPeriodeTravail = await prisma.periodeTravail.create({
      data: { dateDebut: new Date(dateDebut), dateFin: new Date(dateFin) },
    });
    res.status(201).json(newPeriodeTravail);
  } catch (error) {
    res.status(500).json({ error: `Failed to create work period: ${error.message}` });
  }
}

// UPDATE PeriodeTravail
async function modifierPeriodeTravail(req, res) {
  try {
    const { id } = req.params;
    const { dateDebut, dateFin } = req.body;
    const updatedPeriodeTravail = await prisma.periodeTravail.update({
      where: { id: parseInt(id) },
      data: { dateDebut: new Date(dateDebut), dateFin: new Date(dateFin) },
    });
    res.status(200).json(updatedPeriodeTravail);
  } catch (error) {
    res.status(500).json({ error: `Failed to update work period: ${error.message}` });
  }
}

// DELETE PeriodeTravail
async function supprimerPeriodeTravail(req, res) {
  try {
    const { id } = req.params;
    await prisma.periodeTravail.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Work period deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: `Failed to delete work period: ${error.message}` });
  }
}

// GET all PeriodeTravail
async function getAllPeriodesTravail(req, res) {
  try {
    const periodes = await prisma.periodeTravail.findMany({
      orderBy: {
        dateDebut: 'asc', // Optional: order by start date
      },
    });
    res.status(200).json(periodes);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch work periods: ${error.message}` });
  }
}

// GET periods grouped by teacher ID
async function getPeriodesGroupedByEnseignant(req, res) {
  try {
    const data = await prisma.periodeTravailEnseignant.findMany({
      include: {
        enseignant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        periodeTravail: true,
      },
    });

    // Group by teacher ID
    const grouped = data.reduce((acc, item) => {
      const { enseignant, periodeTravail } = item;
      if (!acc[enseignant.id]) {
        acc[enseignant.id] = {
          enseignant,
          periodes: [],
        };
      }
      acc[enseignant.id].periodes.push(periodeTravail);
      return acc;
    }, {});

    res.status(200).json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch grouped work periods: ${error.message}` });
  }
}


// GET open PeriodeTravail
async function getOpenPeriodeTravail(req, res) {
  try {
    const now = new Date();
    const period = await prisma.periodeTravail.findFirst({
      where: {
        dateDebut: { lte: now },
        dateFin: { gte: now }
      },
      orderBy: { dateDebut: 'desc' }
    });
    
    if (period) {
      return res.status(200).json(period);
    }
    
    // If no active period overlaps today, find the most recent one or the one starting next
    const anyPeriod = await prisma.periodeTravail.findFirst({
      orderBy: { dateDebut: 'desc' }
    });
    
    if (anyPeriod) {
      return res.status(200).json(anyPeriod);
    }
    
    res.status(404).json({ message: "No period found" });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch open work period: ${error.message}` });
  }
}

module.exports = { creerPeriodeTravail, modifierPeriodeTravail, supprimerPeriodeTravail ,getAllPeriodesTravail,getPeriodesGroupedByEnseignant, getOpenPeriodeTravail};
