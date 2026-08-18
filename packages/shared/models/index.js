// Central export for all shared models
module.exports = {
    // Existing exports ...
    // Add TransportRouteSchema export
    TransportRouteSchema: require('./transport-route.model'),
    VehicleSchema: require('./vehicle.model'),
    DriverSchema: require('./driver.model'),
    // Keep other exports unchanged

    SchoolModel: require('./schools.model'),
    TeacherSchema: require('./teacher.model'),
    StudentSchema: require('./student.model'),
    ParentSchema: require('./parent.model'),
    PrincipalSchema: require('./principal.model'),
    AdminModel: require('./admin.model'),
    UserModel: require('./users.model'),
    MenuModel: require('./menu.model'),
    MenuBackupModel: require('./menuBackup.model'),
    EmailRegistryModel: require('./EmailRegistry.model'),
    PendingSuperAdminModel: require('./pending-super-admin.model'),
    AttendanceCheckinSchema: require('./attendance-checkin.model'),
    AttendancePeriodSchema: require('./attendance-period.model'),
    AttendanceSimpleSchema: require('./attendance-simple.model'),
    ClassSchema: require('./class.model'),
    LeaveRequestSchema: require('./leave-request.model'),
    RequestSchema: require('./request.model'),
    SubjectSchema: require('./subject.model'),
    TeacherAttendanceSchema: require('./teacher-attendance.model'),
    // Timetable Management
    TimetableConfigSchema: require('./timetable-config.model'),
    TimetableEntrySchema: require('./timetable-entry.model'),
    TimetableScheduleSchema: require('./timetable-schedule.model'),
    TimetableAIDraftSchema: require('./timetable-ai-draft.model'),
    SubstituteAssignmentSchema: require('./substitute-assignment.model'),
    RoomSchema: require('./room.model'),
    PeriodSwapSchema: require('./period-swap.model'),

    // Exam Management
    AcademicYearSchema: require('./academic-year.model'),
    ExamTermSchema: require('./exam-term.model'),
    ExamTypeSchema: require('./exam-type.model'),
    GradingSystemSchema: require('./grading-system.model'),
    ExamSchema: require('./exam.model'),
    ExamScheduleSchema: require('./exam-schedule.model'),
    ExamResultSchema: require('./exam-result.model'),
    StudentExamRegistrationSchema: require('./student-exam-registration.model'),

    // Announcements & Notifications
    AnnouncementSchema: require('./announcement.model'),
    NotificationSchema: require('./notification.model'),
    EmailTemplateSchema: require('./EmailTemplate'),

    // Homework
    HomeworkSchema: require('./homework.model'),

    // Backup
    BackupSchema: require('./backup.schema'),

    // Logs
    ActivityLogSchema: require('./activity-log.model'),

    // Role Management
    RoleModel: require('./role.model'),

    // Fee Management
    FeeCategorySchema: require('./fee-category.model'),
    FeeStructureSchema: require('./fee-structure.model'),
    StudentFeeAssignmentSchema: require('./fee-assignment.model'),
    FeePaymentSchema: require('./fee-payment.model'),
    // Alias: feePayment.repository.js imports this as FeeTransactionSchema
    FeeTransactionSchema: require('./fee-payment.model'),
    FeeReceiptSchema: require('./fee-receipt.model').FeeReceiptSchema,
    FeeReceiptCounterSchema: require('./fee-receipt.model').FeeReceiptCounterSchema,
    FeeDiscountSchema: require('./fee-discount.model'),
    StudentDiscountSchema: require('./student-discount.model'),
    PromotionLogSchema: require('./promotion-log.model'),
};
