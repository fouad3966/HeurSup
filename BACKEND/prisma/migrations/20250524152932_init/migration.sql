-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('Bancaire', 'Postal');

-- CreateEnum
CREATE TYPE "NomGrade" AS ENUM ('MCA', 'MCB', 'PROF');

-- CreateEnum
CREATE TYPE "TypeSession" AS ENUM ('COURS', 'TD', 'TP');

-- CreateEnum
CREATE TYPE "Promotion" AS ENUM ('CP_1', 'CP_2', 'CS_1', 'CS_2', 'CS_3');

-- CreateEnum
CREATE TYPE "Jour" AS ENUM ('Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi');

-- CreateEnum
CREATE TYPE "Matiere" AS ENUM ('Resaux', 'Algo', 'Systeme');

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "nomComplet" TEXT NOT NULL,
    "telephone" TEXT,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enseignant" (
    "id" SERIAL NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "genre" "Genre" NOT NULL,
    "numeroTelephone" TEXT NOT NULL,
    "vacataire" BOOLEAN NOT NULL,
    "charge" INTEGER NOT NULL,
    "matiere" "Matiere" NOT NULL,
    "typeCompte" "TypeCompte" NOT NULL,
    "numeroCompte" TEXT NOT NULL,
    "droitHeuresSup" BOOLEAN,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enseignant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" SERIAL NOT NULL,
    "nom" "NomGrade" NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnseignantGrade" (
    "id" SERIAL NOT NULL,
    "enseignantId" INTEGER NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "EnseignantGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodeTravail" (
    "id" SERIAL NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodeTravail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodeTravailEnseignant" (
    "id" SERIAL NOT NULL,
    "enseignantId" INTEGER NOT NULL,
    "periodeTravailId" INTEGER NOT NULL,

    CONSTRAINT "PeriodeTravailEnseignant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "semestre" TEXT NOT NULL,
    "promotion" "Promotion" NOT NULL,
    "groupe" TEXT NOT NULL,
    "salle" TEXT NOT NULL,
    "jour" "Jour" NOT NULL,
    "heureDebut" INTEGER NOT NULL,
    "minuteDebut" INTEGER NOT NULL,
    "heureFin" INTEGER NOT NULL,
    "minuteFin" INTEGER NOT NULL,
    "module" TEXT NOT NULL,
    "typeSession" "TypeSession" NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" SERIAL NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "heureDebut" INTEGER NOT NULL,
    "minuteDebut" INTEGER NOT NULL,
    "heureFin" INTEGER NOT NULL,
    "minuteFin" INTEGER NOT NULL,
    "justifiee" BOOLEAN NOT NULL DEFAULT false,
    "enseignantId" INTEGER,
    "sessionId" INTEGER,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourFerie" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "JourFerie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuppHours" (
    "id" SERIAL NOT NULL,
    "enseignantId" INTEGER NOT NULL,
    "heuresTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SuppHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuppHourSession" (
    "id" SERIAL NOT NULL,
    "suppHoursId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "partially" BOOLEAN NOT NULL DEFAULT false,
    "SuppHeureDebut" INTEGER NOT NULL,
    "SuppMinuteDebut" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SuppHourSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeacherSessions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TeacherSessions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Enseignant_email_key" ON "Enseignant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_nom_key" ON "Grade"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "SuppHours_enseignantId_key" ON "SuppHours"("enseignantId");

-- CreateIndex
CREATE UNIQUE INDEX "SuppHourSession_suppHoursId_sessionId_key" ON "SuppHourSession"("suppHoursId", "sessionId");

-- CreateIndex
CREATE INDEX "_TeacherSessions_B_index" ON "_TeacherSessions"("B");

-- AddForeignKey
ALTER TABLE "EnseignantGrade" ADD CONSTRAINT "EnseignantGrade_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnseignantGrade" ADD CONSTRAINT "EnseignantGrade_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodeTravailEnseignant" ADD CONSTRAINT "PeriodeTravailEnseignant_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodeTravailEnseignant" ADD CONSTRAINT "PeriodeTravailEnseignant_periodeTravailId_fkey" FOREIGN KEY ("periodeTravailId") REFERENCES "PeriodeTravail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuppHours" ADD CONSTRAINT "SuppHours_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Enseignant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuppHourSession" ADD CONSTRAINT "SuppHourSession_suppHoursId_fkey" FOREIGN KEY ("suppHoursId") REFERENCES "SuppHours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuppHourSession" ADD CONSTRAINT "SuppHourSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSessions" ADD CONSTRAINT "_TeacherSessions_A_fkey" FOREIGN KEY ("A") REFERENCES "Enseignant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSessions" ADD CONSTRAINT "_TeacherSessions_B_fkey" FOREIGN KEY ("B") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
