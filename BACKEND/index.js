const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const prisma = require('./prisma/prisma');

const AbsenceRoutes = require('./routes/AbsenceRoutes');
const AuthRoutes = require('./routes/AuthRoutes');
const EnseignantGradeRoutes = require('./routes/EnseignantGradeRoutes');
const GradeRoutes = require('./routes/GradeRoutes');
const JourFerieRoutes = require('./routes/JourFerieRoutes');
const PeriodeTravailEnseignantRoutes = require('./routes/PeriodeTravailEnseignantRoutes');
const PeriodeTravailRoutes = require('./routes/PeriodeTravailRoutes');
const SessionRoutes = require('./routes/SessionRoutes');
const TeacherRoutes = require('./routes/TeacherRoutes');
const SuppHoursRoutes = require('./routes/SuppHoursRoutes');
const ImageRoutes=require('./routes/ImageRoutes')
// Set up port
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// Register all routes (order usually doesn’t matter)
app.use(AbsenceRoutes);
app.use(AuthRoutes);
app.use(EnseignantGradeRoutes);
app.use(GradeRoutes);
app.use(JourFerieRoutes);
app.use(PeriodeTravailEnseignantRoutes);
app.use(PeriodeTravailRoutes);
app.use(SessionRoutes);
app.use(TeacherRoutes);
app.use(SuppHoursRoutes);
app.use(ImageRoutes)

prisma.$connect()
    .then(() => {
        console.log('Connected to the database successfully');
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error('ERROR connecting to the database:', error.message || error);
        process.exit(1);
    });
