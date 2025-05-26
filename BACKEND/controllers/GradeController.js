const prisma = require("../prisma/prisma");

// CREATE Grade
async function creerGrade(req, res) {
  try {
    const { nom } = req.body;
    const newGrade = await prisma.grade.create({
      data: { nom },
    });
    res.status(201).json(newGrade);
  } catch (error) {
    res.status(500).json({ error: `Failed to create grade: ${error.message}` });
  }
}

// UPDATE Grade
async function modifierGrade(req, res) {
  try {
    const { id } = req.params;
    const { nom } = req.body;
    const updatedGrade = await prisma.grade.update({
      where: { id: parseInt(id) },
      data: { nom },
    });
    res.status(200).json(updatedGrade);
  } catch (error) {
    res.status(500).json({ error: `Failed to update grade: ${error.message}` });
  }
}

// DELETE Grade
async function supprimerGrade(req, res) {
  try {
    const { id } = req.params;
    await prisma.grade.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: `Failed to delete grade: ${error.message}` });
  }
}

module.exports = { creerGrade, modifierGrade, supprimerGrade };
