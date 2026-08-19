const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
    chapterNumber: { type: Number },
    title: { type: String, required: true },
    description: { type: String, default: null },
    estimatedHours: { type: Number, default: 4 },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending',
    },
    completedAt: { type: Date, default: null },
    completedByTeacherId: { type: String, default: null },
}, { _id: true });

const SyllabusSchema = new mongoose.Schema({
    schoolId: { type: String, required: true, index: true },
    classId: { type: String, required: true, index: true },
    className: { type: String, default: null },
    subjectId: { type: String, required: true, index: true },
    subjectName: { type: String, default: null },
    teacherId: { type: String, default: null },
    academicYearId: { type: String, default: null },
    chapters: [ChapterSchema],
}, {
    timestamps: true,
});

SyllabusSchema.index({ schoolId: 1, classId: 1, subjectId: 1 });

module.exports = SyllabusSchema;
