const prisma = require("./prisma.js");

async function main() {
  console.log("Cleaning up existing data...");
  
  // Clean up in proper order to respect foreign keys
  await prisma.absence.deleteMany();
  await prisma.suppHourSession.deleteMany();
  await prisma.suppHours.deleteMany();
  await prisma.session.deleteMany();
  await prisma.periodeTravailEnseignant.deleteMany();
  await prisma.enseignantGrade.deleteMany();
  await prisma.enseignant.deleteMany();
  
  console.log("Existing teacher data cleaned.");

  // Make sure we have a PeriodeTravail to assign them to
  let periode = await prisma.periodeTravail.findFirst();
  if (!periode) {
    periode = await prisma.periodeTravail.create({
      data: {
        dateDebut: new Date(new Date().getFullYear(), 0, 1),
        dateFin: new Date(new Date().getFullYear(), 11, 31)
      }
    });
  }

  const profs = [
    {
      prenom: "Mohamed",
      nom: "Boussaid",
      email: "m.boussaid@esi.dz",
      dateNaissance: new Date("1975-04-12"),
      genre: "Male",
      numeroTelephone: "0555123456",
      vacataire: false,
      charge: 150,
      matiere: "Resaux",
      typeCompte: "Postal",
      numeroCompte: "123456789",
      droitHeuresSup: true,
      imageUrl: "/seed/prof_1.jpg",
      gradeId: 1 // Professeur
    },
    {
      prenom: "Amina",
      nom: "Belkacem",
      email: "a.belkacem@esi.dz",
      dateNaissance: new Date("1982-08-23"),
      genre: "Female",
      numeroTelephone: "0770987654",
      vacataire: false,
      charge: 192,
      matiere: "Algo",
      typeCompte: "Bancaire",
      numeroCompte: "987654321",
      droitHeuresSup: true,
      imageUrl: "/seed/prof_2.jpg",
      gradeId: 2 // MCA
    },
    {
      prenom: "Yassine",
      nom: "Ouali",
      email: "y.ouali@esi.dz",
      dateNaissance: new Date("1991-02-15"),
      genre: "Male",
      numeroTelephone: "0661234987",
      vacataire: true,
      charge: 90,
      matiere: "Systeme",
      typeCompte: "Postal",
      numeroCompte: "456123789",
      droitHeuresSup: false,
      imageUrl: "/seed/prof_3.jpg",
      gradeId: 3 // MCB
    },
    {
      prenom: "Samia",
      nom: "Kaddour",
      email: "s.kaddour@esi.dz",
      dateNaissance: new Date("1990-11-05"),
      genre: "Female",
      numeroTelephone: "0552345678",
      vacataire: false,
      charge: 192,
      matiere: "Resaux",
      typeCompte: "Bancaire",
      numeroCompte: "789123456",
      droitHeuresSup: true,
      imageUrl: "/seed/prof_4.jpg",
      gradeId: 3 // MCB
    },
    {
      prenom: "Rachid",
      nom: "Ghellab",
      email: "r.ghellab@esi.dz",
      dateNaissance: new Date("1965-06-30"),
      genre: "Male",
      numeroTelephone: "0771223344",
      vacataire: false,
      charge: 100,
      matiere: "Systeme",
      typeCompte: "Postal",
      numeroCompte: "321654987",
      droitHeuresSup: true,
      imageUrl: "/seed/prof_5.jpg",
      gradeId: 1 // Professeur
    },
    {
      prenom: "Tarek",
      nom: "Lounis",
      email: "t.lounis@esi.dz",
      dateNaissance: new Date("1985-09-18"),
      genre: "Male",
      numeroTelephone: "0663445566",
      vacataire: true,
      charge: 120,
      matiere: "Algo",
      typeCompte: "Bancaire",
      numeroCompte: "654987321",
      droitHeuresSup: true,
      imageUrl: "/seed/prof_6.jpg",
      gradeId: 2 // MCA
    }
  ];

  for (const prof of profs) {
    const { gradeId, ...profData } = prof;
    
    // Create teacher
    const newProf = await prisma.enseignant.create({
      data: profData
    });

    // Create relation to grade
    await prisma.enseignantGrade.create({
      data: {
        enseignantId: newProf.id,
        gradeId: gradeId,
        dateDebut: new Date()
      }
    });

    // Assign to active period
    await prisma.periodeTravailEnseignant.create({
      data: {
        enseignantId: newProf.id,
        periodeTravailId: periode.id
      }
    });
  }

  console.log(`Successfully seeded ${profs.length} realistic professors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // DO NOT CALL $disconnect on the shared instance to prevent killing the main app if it's running
  });
