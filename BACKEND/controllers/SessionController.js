const prisma = require('../prisma/prisma');

async function createSession(req, res) {

    try {
        const { semestre, promotion, groupe, salle, jour, heureDebut, minuteDebut, heureFin, minuteFin, module, typeSession, teacherIds } = req.body;
        const newSession = await prisma.session.create({
            data: {
                semestre,
                promotion,
                groupe,
                salle,
                jour,
                heureDebut,
                minuteDebut,
                heureFin,
                minuteFin,
                module,
                typeSession,
                enseignants: {
                    connect: teacherIds.map(id => ({ id }))
                }
            }
        });
        res.status(201).json(newSession);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: `Failed to create session: ${error.message}` });
    }
}

async function getAllSessions(req, res) {
    try {
        const sessions = await prisma.session.findMany({
            include: {
                enseignants: true,
            },
        });
        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: `Failed to fetch sessions: ${error.message}` });
    }
}

async function getSessionById(req, res) {
    try {
        const { id } = req.params;
        const session = await prisma.session.findUnique({
            where: { id: parseInt(id) },
            include: {
                enseignants: true,
            },
        });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        res.status(200).json(session);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: `Failed to fetch session: ${error.message}` });
    }
}

async function updateSession(req, res) {
    try {
        const { id } = req.params;
        const { semestre, promotion, groupe, salle, jour, heureDebut, minuteDebut, heureFin, minuteFin, module, typeSession, teacherIds } = req.body;
        const updatedSession = await prisma.session.update({
            where: { id: parseInt(id) },
            data: {
                semestre,
                promotion,
                groupe,
                salle,
                jour,
                heureDebut,
                minuteDebut,
                heureFin,
                minuteFin,
                module,
                typeSession,
                enseignants: {
                    set: teacherIds.map(id => ({ id }))
                }
            }
        });
        res.status(200).json(updatedSession);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: `Failed to update session: ${error.message}` });
    }
}
async function deleteSession(req, res) {
    try {
        const { id } = req.params;
        const sessionId = parseInt(id);

        const [deletedSession] = await prisma.$transaction([
            // 1. Delete related SuppHourSession entries
            prisma.suppHourSession.deleteMany({
                where: { sessionId },
            }),

            // 2. Nullify related Absences (you can delete them if preferred)
            prisma.absence.updateMany({
                where: { sessionId },
                data: { sessionId: null },
            }),

            // 3. Disconnect all enseignants from this session
            prisma.session.update({
                where: { id: sessionId },
                data: {
                    enseignants: {
                        set: [], // removes all links in the join table
                    },
                },
            }),

            // 4. Finally delete the session itself
            prisma.session.delete({
                where: { id: sessionId },
            }),
        ]);

        res.status(200).json({ message: 'Session deleted successfully', deletedSession });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: `Failed to delete session: ${error.message}` });
    }
}

async function getSessionByTeacherID(req, res) {
    try {
        const { teacherId } = req.params;
        console.log(req.params);
        console.log(teacherId);
        const id = parseInt(teacherId);

        const sessions = await prisma.session.findMany({
            where: {
                enseignants: {
                    some: {
                        id: id 
                    }
                }
            },
            include: {
                enseignants: true
            }
        });

        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching sessions by teacher ID:', error);
        res.status(500).json({ error: `Failed to fetch sessions by teacher ID: ${error.message}` });
    }
}



async function getSessionByTeacherID(req, res) {
    try {
        const { teacherId } = req.params;
        console.log(req.params);
        console.log(teacherId);
        const id = parseInt(teacherId);

        const sessions = await prisma.session.findMany({
            where: {
                enseignants: {
                    some: {
                        id: id 
                    }
                }
            },
            include: {
                enseignants: true
            }
        });

        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching sessions by teacher ID:', error);
        res.status(500).json({ error: `Failed to fetch sessions by teacher ID: ${error.message}` });
    }
}


module.exports = {
    createSession,
    getAllSessions,
    getSessionById,
    updateSession,
    deleteSession,
    getSessionByTeacherID,
};
