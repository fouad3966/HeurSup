const prisma = require('../prisma/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { email, motDePasse, nomComplet, telephone } = req.body;

    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        email,
        motDePasse: hashedPassword,
        nomComplet,
        telephone
      }
    });

    res.status(201).json({ message: 'Admin créé avec succès.', admin: newAdmin });
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    res.status(500).json({ error: `Erreur serveur : ${error.message}` });
  }
};

const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    console.log("BODY RECEIVED:", req.body);

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Email non trouvé.' });
    }

    const passwordMatch = await bcrypt.compare(motDePasse, admin.motDePasse);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    const token = jwt.sign({ adminId: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({ message: 'Connexion réussie.', token });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: `Erreur serveur : ${error.message}` });
  }
};

const getAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        nomComplet: true,
        telephone: true,
      }
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin non trouvé." });
    }

    res.status(200).json(admin);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'admin :", error);
    res.status(500).json({ error: `Erreur serveur : ${error.message}` });
  }
};


module.exports = {
  register,
  login,
  getAdmin
};
