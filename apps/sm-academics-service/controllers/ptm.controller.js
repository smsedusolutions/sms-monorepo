const { getSchoolDbConnection } = require('../configs/db');
const { getSchoolDbName } = require('../utils/schoolDbHelper');
const { PTMSchema } = require('@sms/shared/models');

const getModels = (schoolDbName) => {
    const conn = getSchoolDbConnection(schoolDbName);
    return {
        PTM: conn.models.PTM || conn.model('PTM', PTMSchema),
    };
};

// Generate time slots helper (skipping break timing if specified)
const generateSlots = (startTime, endTime, durationMinutes, breakStartTime, breakEndTime) => {
    const slots = [];
    let [currHour, currMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let breakStartMins = -1;
    let breakEndMins = -1;
    if (breakStartTime && breakEndTime) {
        const [bsh, bsm] = breakStartTime.split(':').map(Number);
        const [beh, bem] = breakEndTime.split(':').map(Number);
        breakStartMins = bsh * 60 + bsm;
        breakEndMins = beh * 60 + bem;
    }

    const endTotal = endHour * 60 + endMin;

    while (currHour * 60 + currMin < endTotal) {
        const currentSlotStartMins = currHour * 60 + currMin;
        const currentSlotEndMins = currentSlotStartMins + durationMinutes;

        if (currentSlotEndMins > endTotal) break;

        // Skip slot if it overlaps with break time
        if (breakStartMins !== -1 && breakEndMins !== -1) {
            if (currentSlotStartMins < breakEndMins && currentSlotEndMins > breakStartMins) {
                // Advance past break
                currHour = Math.floor(breakEndMins / 60);
                currMin = breakEndMins % 60;
                continue;
            }
        }

        const nextMin = currMin + durationMinutes;
        const nextHour = currHour + Math.floor(nextMin / 60);
        const slotEndMin = nextMin % 60;

        const pad = (n) => String(n).padStart(2, '0');
        const timeStr = `${pad(currHour)}:${pad(currMin)} - ${pad(nextHour)}:${pad(slotEndMin)}`;
        slots.push(timeStr);

        currHour = nextHour;
        currMin = slotEndMin;
    }
    return slots;
};

// Compute real-time status of a PTM session based on date and time
const computePTMStatus = (ptm) => {
    if (ptm.status === 'cancelled') return 'cancelled';

    const now = new Date();
    const ptmDate = new Date(ptm.date);

    let endDateTime = new Date(ptmDate);
    if (ptm.endTime && typeof ptm.endTime === 'string' && ptm.endTime.includes(':')) {
        const [eh, em] = ptm.endTime.split(':').map(Number);
        endDateTime.setHours(eh || 0, em || 0, 0, 0);
        if (ptm.startTime && typeof ptm.startTime === 'string' && ptm.startTime.includes(':')) {
            const [sh, sm] = ptm.startTime.split(':').map(Number);
            const startDateTime = new Date(ptmDate);
            startDateTime.setHours(sh || 0, sm || 0, 0, 0);
            if (endDateTime < startDateTime) {
                endDateTime.setDate(endDateTime.getDate() + 1);
            }
        }
    } else {
        endDateTime.setHours(23, 59, 59, 999);
    }

    if (now > endDateTime) {
        return 'completed';
    }

    if (ptm.startTime && typeof ptm.startTime === 'string' && ptm.startTime.includes(':')) {
        const [sh, sm] = ptm.startTime.split(':').map(Number);
        const startDateTime = new Date(ptmDate);
        startDateTime.setHours(sh || 0, sm || 0, 0, 0);
        if (now >= startDateTime && now <= endDateTime) {
            return 'ongoing';
        }
    }

    return 'scheduled';
};

// ==========================================
// 1. CREATE PTM SESSION (Single or Multiple Classes)
// POST /api/academics/school/:schoolId/ptm
// ==========================================
const createPTMSession = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            title,
            date,
            startTime,
            endTime,
            breakStartTime,
            breakEndTime,
            slotDurationMinutes,
            classes,
            classId,
            className,
            teacherId,
            teacherName,
            venue,
            notes,
        } = req.body;

        const dbName = await getSchoolDbName(schoolId);
        const { PTM } = getModels(dbName);

        // If multiple classes / sections are scheduled at once
        if (Array.isArray(classes) && classes.length > 0) {
            const created = [];
            for (const cls of classes) {
                const sectionLabel = cls.sectionName ? ` - Sec ${cls.sectionName}` : '';
                const ptm = new PTM({
                    schoolId,
                    title: `${title} (${cls.className || 'Class'}${sectionLabel})`,
                    date: new Date(date),
                    startTime,
                    endTime,
                    breakStartTime: breakStartTime || null,
                    breakEndTime: breakEndTime || null,
                    slotDurationMinutes: slotDurationMinutes || 10,
                    classId: cls.classId || null,
                    className: cls.className || null,
                    sectionId: cls.sectionId || null,
                    sectionName: cls.sectionName || null,
                    teacherId: cls.teacherId || teacherId || null,
                    teacherName: cls.teacherName || teacherName || null,
                    venue: venue || null,
                    notes: notes || null,
                    bookings: [],
                });
                await ptm.save();
                created.push(ptm);
            }
            return res.status(201).json({
                success: true,
                message: `Created ${created.length} PTM sessions for selected class sections`,
                data: created,
            });
        }

        // Single session creation
        const ptm = new PTM({
            schoolId,
            title,
            date: new Date(date),
            startTime,
            endTime,
            breakStartTime: breakStartTime || null,
            breakEndTime: breakEndTime || null,
            slotDurationMinutes: slotDurationMinutes || 10,
            classId: classId || null,
            className: className || null,
            sectionId: req.body.sectionId || null,
            sectionName: req.body.sectionName || null,
            teacherId: teacherId || null,
            teacherName: teacherName || null,
            venue: venue || null,
            notes: notes || null,
            bookings: [],
        });

        await ptm.save();
        res.status(201).json({ success: true, message: 'PTM session created', data: ptm });
    } catch (error) {
        console.error('Create PTM Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. GET ALL PTM SESSIONS (Admin / List)
// GET /api/academics/school/:schoolId/ptm
// ==========================================
const getAllPTMSessions = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const dbName = await getSchoolDbName(schoolId);
        const { PTM } = getModels(dbName);

        const sessions = await PTM.find({ schoolId }).sort({ date: -1, createdAt: -1 }).lean();
        const enriched = sessions.map(s => ({
            ...s,
            status: computePTMStatus(s),
            bookingsCount: (s.bookings || []).length,
        }));

        // In background: sync completed status for past sessions to DB
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        PTM.updateMany(
            { schoolId, status: 'scheduled', date: { $lt: todayStart } },
            { $set: { status: 'completed' } }
        ).catch(() => {});

        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        console.error('Get PTMs Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 3. GET SESSIONS FOR PARENT
// GET /api/academics/school/:schoolId/ptm/parent/:parentId
// ==========================================
const getPTMForParent = async (req, res) => {
    try {
        const { schoolId, parentId } = req.params;
        const dbName = await getSchoolDbName(schoolId);
        const { PTM } = getModels(dbName);

        const sessions = await PTM.find({ schoolId, status: { $ne: 'cancelled' } }).sort({ date: -1, createdAt: -1 }).lean();
        const myBookings = [];

        sessions.forEach(s => {
            if ((s.bookings || []).some(b => b.parentId === parentId)) {
                myBookings.push(s._id.toString());
            }
        });

        const enriched = sessions.map(s => ({
            ...s,
            status: computePTMStatus(s),
            bookingsCount: (s.bookings || []).length,
        }));

        res.status(200).json({ success: true, data: enriched, myBookings });
    } catch (error) {
        console.error('Get Parent PTM Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 4. GET AVAILABLE SLOTS FOR A SESSION
// GET /api/academics/school/:schoolId/ptm/:sessionId/slots
// ==========================================
const getPTMSlots = async (req, res) => {
    try {
        const { schoolId, sessionId } = req.params;
        const dbName = await getSchoolDbName(schoolId);
        const { PTM } = getModels(dbName);

        const ptm = await PTM.findOne({ schoolId, _id: sessionId }).lean();
        if (!ptm) return res.status(404).json({ success: false, message: 'PTM session not found' });

        const allSlots = generateSlots(
            ptm.startTime,
            ptm.endTime,
            ptm.slotDurationMinutes || 10,
            ptm.breakStartTime,
            ptm.breakEndTime
        );
        const bookedMap = new Map();
        (ptm.bookings || []).forEach(b => bookedMap.set(b.slotTime, b));

        const slots = allSlots.map(time => {
            const booking = bookedMap.get(time);
            return {
                time,
                isBooked: !!booking,
                bookedByParentId: booking?.parentId || null,
            };
        });

        res.status(200).json({ success: true, data: slots });
    } catch (error) {
        console.error('Get PTM Slots Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 5. BOOK A SLOT (Parent)
// POST /api/academics/school/:schoolId/ptm/:sessionId/book
// ==========================================
const bookPTMSlot = async (req, res) => {
    try {
        const { schoolId, sessionId } = req.params;
        const { parentId, parentName, studentId, studentName, slotTime, notes } = req.body;

        const dbName = await getSchoolDbName(schoolId);
        const { PTM } = getModels(dbName);

        const ptm = await PTM.findOne({ schoolId, _id: sessionId });
        if (!ptm) return res.status(404).json({ success: false, message: 'PTM session not found' });

        // Check if slot is already booked
        const isTaken = ptm.bookings.some(b => b.slotTime === slotTime && b.status !== 'cancelled');
        if (isTaken) {
            return res.status(400).json({ success: false, message: 'This time slot is already booked' });
        }

        // Check if parent already booked a slot in this session
        const existingIdx = ptm.bookings.findIndex(b => b.parentId === parentId);
        if (existingIdx !== -1) {
            ptm.bookings[existingIdx].slotTime = slotTime;
            ptm.bookings[existingIdx].notes = notes;
            ptm.bookings[existingIdx].bookedAt = new Date();
        } else {
            ptm.bookings.push({
                parentId,
                parentName,
                studentId,
                studentName,
                slotTime,
                notes,
                status: 'confirmed',
                bookedAt: new Date(),
            });
        }

        await ptm.save();
        res.status(200).json({ success: true, message: 'Slot booked successfully', data: ptm.bookings.find(b => b.parentId === parentId) });
    } catch (error) {
        console.error('Book Slot Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 6. GET SESSIONS FOR TEACHER
// GET /api/academics/school/:schoolId/ptm/teacher/:teacherId
// ==========================================
const getPTMForTeacher = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;
        const dbName = await getSchoolDbName(schoolId);
        const { PTM } = getModels(dbName);

        const sessions = await PTM.find({
            schoolId,
            $or: [{ teacherId }, { teacherId: null }],
        }).sort({ date: -1, createdAt: -1 }).lean();

        const enriched = sessions.map(s => ({
            ...s,
            status: computePTMStatus(s),
            bookingsCount: (s.bookings || []).length,
        }));

        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        console.error('Get Teacher PTM Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 7. UPDATE PTM SESSION (Admin)
// PATCH /api/academics/school/:schoolId/ptm/:sessionId
// ==========================================
const updatePTMSession = async (req, res) => {
    try {
        const { schoolId, sessionId } = req.params;
        const dbName = await getSchoolDbName(schoolId);
        const { PTM } = getModels(dbName);

        const ptm = await PTM.findOne({ schoolId, _id: sessionId });
        if (!ptm) {
            return res.status(404).json({ success: false, message: 'PTM session not found' });
        }

        const {
            title,
            date,
            startTime,
            endTime,
            breakStartTime,
            breakEndTime,
            slotDurationMinutes,
            classId,
            className,
            sectionId,
            sectionName,
            teacherId,
            teacherName,
            venue,
            notes,
            status,
        } = req.body;

        if (title !== undefined) ptm.title = title;
        if (date !== undefined) ptm.date = new Date(date);
        if (startTime !== undefined) ptm.startTime = startTime;
        if (endTime !== undefined) ptm.endTime = endTime;
        if (breakStartTime !== undefined) ptm.breakStartTime = breakStartTime || null;
        if (breakEndTime !== undefined) ptm.breakEndTime = breakEndTime || null;
        if (slotDurationMinutes !== undefined) ptm.slotDurationMinutes = slotDurationMinutes;
        if (classId !== undefined) ptm.classId = classId || null;
        if (className !== undefined) ptm.className = className || null;
        if (sectionId !== undefined) ptm.sectionId = sectionId || null;
        if (sectionName !== undefined) ptm.sectionName = sectionName || null;
        if (teacherId !== undefined) ptm.teacherId = teacherId || null;
        if (teacherName !== undefined) ptm.teacherName = teacherName || null;
        if (venue !== undefined) ptm.venue = venue || null;
        if (notes !== undefined) ptm.notes = notes || null;
        if (status !== undefined) ptm.status = status;

        await ptm.save();

        res.status(200).json({
            success: true,
            message: 'PTM session updated successfully',
            data: ptm,
        });
    } catch (error) {
        console.error('Update PTM Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 8. DELETE PTM SESSION (Admin)
// DELETE /api/academics/school/:schoolId/ptm/:sessionId
// ==========================================
const deletePTMSession = async (req, res) => {
    try {
        const { schoolId, sessionId } = req.params;
        const dbName = await getSchoolDbName(schoolId);
        const { PTM } = getModels(dbName);

        const deleted = await PTM.findOneAndDelete({ schoolId, _id: sessionId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'PTM session not found' });
        }

        res.status(200).json({
            success: true,
            message: 'PTM session deleted successfully',
            data: deleted,
        });
    } catch (error) {
        console.error('Delete PTM Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPTMSession,
    getAllPTMSessions,
    getPTMForParent,
    getPTMSlots,
    bookPTMSlot,
    getPTMForTeacher,
    updatePTMSession,
    deletePTMSession,
};

