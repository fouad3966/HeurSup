const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    // Clear existing data to avoid duplicates (optional, remove if you don't want to clear)
    await prisma.suppHourSession.deleteMany();
    await prisma.suppHours.deleteMany();
    await prisma.absence.deleteMany();
    await prisma.session.deleteMany();
    await prisma.periodeTravailEnseignant.deleteMany();
    await prisma.periodeTravail.deleteMany();
    await prisma.enseignantGrade.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.enseignant.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.jourFerie.deleteMany();

    // Create Admin
    await prisma.admin.create({
      data: {
        email: 'admin@example.com',
        motDePasse: 'admin', // In production, hash this password
        nomComplet: 'Admin User',
        telephone: faker.phone.number(),
      },
    });
    console.log('Admin created successfully.');

    // Create Grades
    const grades = await Promise.all([
      prisma.grade.create({ data: { nom: 'MCA' } }),
      prisma.grade.create({ data: { nom: 'MCB' } }),
      prisma.grade.create({ data: { nom: 'PROF' } }),
    ]);
    console.log('Grades created:', grades);

    // Create Default Periods with specific IDs
    const periods = [];
    await prisma.periodeTravail.create({
      data: {
        id: 1, // 20 Sep 2024 to 31 Dec 2024
        dateDebut: new Date('2024-09-20'),
        dateFin: new Date('2024-12-31'),
      },
    });
    periods.push({ id: 1 });

    await prisma.periodeTravail.create({
      data: {
        id: 2, // 1 Jan 2025 to 20 Jan 2025
        dateDebut: new Date('2025-01-01'),
        dateFin: new Date('2025-01-20'),
      },
    });
    periods.push({ id: 2 });

    await prisma.periodeTravail.create({
      data: {
        id: 3, // 21 Jan 2025 to 1 Jun 2025
        dateDebut: new Date('2025-01-21'),
        dateFin: new Date('2025-06-01'),
      },
    });
    periods.push({ id: 3 });

    console.log('Periods created with specific IDs:', periods);

    // Create 3 Teachers
    const teachers = await Promise.all(
      Array.from({ length: 3 }).map(async (_, index) => {
        const teacher = await prisma.enseignant.create({
          data: {
            prenom: faker.person.firstName(),
            nom: faker.person.lastName(),
            email: faker.internet.email(),
            dateNaissance: faker.date.past({ years: 40, refDate: '1990-01-01' }),
            genre: faker.helpers.arrayElement(['Male', 'Female']),
            numeroTelephone: faker.phone.number(),
            vacataire: faker.datatype.boolean(),
            charge: faker.number.int({ min: 10, max: 20 }),
            matiere: faker.helpers.arrayElement(['Resaux', 'Algo', 'Systeme']),
            typeCompte: faker.helpers.arrayElement(['Bancaire', 'Postal']),
            numeroCompte: faker.finance.accountNumber(),
            droitHeuresSup: true,
            imageUrl: faker.image.url(),
            imagePublicId: faker.string.uuid(),
          },
        });

        // Link teacher to a grade
        await prisma.enseignantGrade.create({
          data: {
            enseignantId: teacher.id,
            gradeId: grades[index % grades.length].id,
            dateDebut: new Date('2024-01-01'),
            dateFin: null,
          },
        });

        // Link teacher to all periods
        await Promise.all(
          periods.map((period) =>
            prisma.periodeTravailEnseignant.create({
              data: {
                enseignantId: teacher.id,
                periodeTravailId: period.id,
              },
            })
          )
        );

        return teacher;
      })
    );
    console.log('Teachers created and linked to grades and periods:', teachers);

    // Create Sessions (Full Schedule: Sunday to Thursday)
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
    const sessionTypes = ['COURS', 'TD', 'TP'];
    const promotions = ['CP_1', 'CP_2', 'CS_1', 'CS_2', 'CS_3'];
    const modules = ['Networks 101', 'Algorithms Basics', 'Operating Systems'];

    for (const teacher of teachers) {
      for (const day of days) {
        // Each teacher has 2-3 sessions per day (random)
        const numSessions = faker.number.int({ min: 2, max: 3 });

        // Generate session times (e.g., 8:00-10:00, 10:00-12:00, 14:00-16:00)
        const startTimes = [
          { heureDebut: 8, minuteDebut: 0, heureFin: 10, minuteFin: 0 },
          { heureDebut: 10, minuteDebut: 0, heureFin: 12, minuteFin: 0 },
          { heureDebut: 14, minuteDebut: 0, heureFin: 16, minuteFin: 0 },
        ].slice(0, numSessions);

        for (const time of startTimes) {
          await prisma.session.create({
            data: {
              semestre: 'S1',
              promotion: faker.helpers.arrayElement(promotions),
              groupe: `G${faker.number.int({ min: 1, max: 5 })}`,
              salle: `Room ${faker.number.int({ min: 101, max: 110 })}`,
              jour: day,
              heureDebut: time.heureDebut,
              minuteDebut: time.minuteDebut,
              heureFin: time.heureFin,
              minuteFin: time.minuteFin,
              module: faker.helpers.arrayElement(modules),
              typeSession: faker.helpers.arrayElement(sessionTypes),
              enseignants: {
                connect: { id: teacher.id },
              },
            },
          });
        }
      }
    }
    console.log('Sessions created for all teachers (Sunday to Thursday).');

    // Algerian Holidays for 2025 (based on official dates, approximate as some depend on lunar calendar)
    const algerianHolidays2025 = [
      { date: new Date('2025-01-01'), description: 'Nouvel An (Jour de l\'An)' },
      { date: new Date('2025-03-06'), description: 'Fête de la Victoire (8 Mai 1945)' },
      { date: new Date('2025-04-15'), description: 'Aid El Fitr (approximate, depends on lunar calendar)' },
      { date: new Date('2025-05-01'), description: 'Fête du Travail (1er Mai)' },
      { date: new Date('2025-06-05'), description: 'Aid El Adha (approximate, depends on lunar calendar)' },
      { date: new Date('2025-07-05'), description: 'Fête de l\'Indépendance' },
      { date: new Date('2025-11-01'), description: 'Fête de la Révolution' },
    ];

    // Insert Algerian holidays into JourFerie table
    await Promise.all(
      algerianHolidays2025.map((holiday) =>
        prisma.jourFerie.create({
          data: {
            date: holiday.date,
            description: holiday.description,
          },
        })
      )
    );
    console.log('Algerian holidays for 2025 added successfully.');

    // Fetch existing teachers and their sessions, including nested absences
    const teachersWithSessions = await prisma.enseignant.findMany({
      include: {
        sessions: {
          include: {
            absences: true, // Include the absences relation for each session
          },
        },
      },
    });

    if (!teachersWithSessions.length) {
      console.log('No teachers found to create absences.');
    } else {
      // Randomly create absences for existing sessions
      for (const teacher of teachersWithSessions) {
        // Filter sessions that don't already have absences
        const eligibleSessions = teacher.sessions.filter((session) => {
          // Ensure session.absences is an array (should always be true now with proper include)
          if (!Array.isArray(session.absences)) {
            console.warn(`Session ${session.id} has no absences array. Skipping.`);
            return false;
          }
          return session.absences.length === 0; // Only select sessions with no absences
        });

        if (eligibleSessions.length === 0) {
          console.log(`No eligible sessions found for teacher ${teacher.id} to create absences.`);
          continue;
        }

        // Randomly select 20-40% of eligible sessions for absences
        const numAbsences = Math.floor(eligibleSessions.length * faker.number.float({ min: 0.2, max: 0.4 }));
        const selectedSessions = faker.helpers.arrayElements(eligibleSessions, numAbsences);

        for (const session of selectedSessions) {
          // Since Session model uses jour (day of the week), pick a date in May 2025 that matches the session's jour
          const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
          const targetDay = session.jour;
          const targetDayIndex = daysOfWeek.indexOf(targetDay);

          // Start from May 1, 2025, and find the first date that matches the target day of the week
          const startDate = new Date('2025-05-01');
          while (daysOfWeek[startDate.getDay()] !== targetDay) {
            startDate.setDate(startDate.getDate() + 1);
          }

          // Use this date as the absence date (can be adjusted to loop through multiple matching dates if needed)
          const absenceDate = new Date(startDate);

          await prisma.absence.create({
            data: {
              dateDebut: absenceDate,
              dateFin: new Date(absenceDate.getTime() + 60 * 60 * 1000), // 1-hour duration
              heureDebut: session.heureDebut,
              minuteDebut: session.minuteDebut,
              heureFin: session.heureFin,
              minuteFin: session.minuteFin,
              justifiee: faker.datatype.boolean({ probability: 0.3 }), // 30% chance of being justified
              enseignantId: teacher.id,
              sessionId: session.id,
            },
          });
        }
      }
      console.log('Random absences created for teachers successfully.');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();