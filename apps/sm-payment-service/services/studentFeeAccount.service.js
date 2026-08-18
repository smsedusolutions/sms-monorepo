// apps/sm-payment-service/services/studentFeeAccount.service.js

const StudentFeeAccountRepository = require('../repositories/studentFeeAccount.repository');
const FeeStructureRepository = require('../repositories/feeStructure.repository');
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { StudentSchema, ClassSchema, ParentSchema } = require("@sms/shared/models");
const { generateAssignmentId } = require('../utils/generateId');
const { recalculateAccount } = require('../utils/accountHelper');

/**
 * StudentFeeAccount Service
 * Orchestrates creating student running ledgers, checking assignment overrides,
 * class lookups, and applying notes or freezes.
 */
class StudentFeeAccountService {
    /**
     * Resolves student details from user service model dynamically
     */
    async _getStudentModel(schoolId) {
        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        try {
            return schoolDb.model("Student");
        } catch (e) {
            return schoolDb.model("Student", StudentSchema);
        }
    }

    /**
     * Resolves parent model dynamically
     */
    async _getParentModel(schoolId) {
        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        try {
            return schoolDb.model("Parent");
        } catch (e) {
            return schoolDb.model("Parent", ParentSchema);
        }
    }

    /**
     * Resolves class details model dynamically
     */
    async _getClassModel(schoolId) {
        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        try {
            return schoolDb.model("Class");
        } catch (e) {
            return schoolDb.model("Class", ClassSchema);
        }
    }

    /**
     * Assigns fee structures to target students and builds running ledgers
     */
    async assignStructure(schoolId, structureId, assignDto, actor) {
        const structure = await FeeStructureRepository.findById(schoolId, structureId);
        if (!structure) {
            const error = new Error('Fee structure not found');
            error.statusCode = 404;
            throw error;
        }

        if (structure.status !== 'published') {
            const error = new Error('Only published fee structures can be assigned to students');
            error.statusCode = 400;
            throw error;
        }

        const StudentModel = await this._getStudentModel(schoolId);
        const ClassModel = await this._getClassModel(schoolId);

        // Resolve class and section names
        const classes = await ClassModel.find({ schoolId }).lean();
        const getClassName = (cid) => {
            const cls = classes.find(c => c.classId === cid);
            return cls ? cls.name : cid;
        };
        const getSectionName = (cid, sid) => {
            const cls = classes.find(c => c.classId === cid);
            if (!cls || !cls.sections) return sid;
            const sec = cls.sections.find(s => s.sectionId === sid);
            return sec ? sec.name : sid;
        };

        // Helper: resolve class name/labels → actual classIds stored on students.
        // Students store class as classId (e.g. "CLS00001"), not the display name.
        // The fee structure applicableClasses stores labels like "class-8" or "8".
        // Returns only successfully resolved classIds (unrecognised labels are dropped).
        const resolveClassIds = (classLabels) => {
            return classLabels.reduce((acc, label) => {
                const normalized = label.replace(/^class-/i, '').trim().toLowerCase();
                const match = classes.find(c =>
                    (c.name || '').toString().toLowerCase() === normalized ||
                    (c.classId || '').toLowerCase() === normalized
                );
                if (match) acc.push(match.classId);
                return acc;
            }, []);
        };

        // Query active students
        const studentQuery = { schoolId, status: "active" };

        if (assignDto.studentIds && assignDto.studentIds.length > 0) {
            studentQuery.studentId = { $in: assignDto.studentIds };
        } else if (assignDto.classId) {
            const [resolvedId] = resolveClassIds([assignDto.classId]);
            if (!resolvedId) {
                const error = new Error(`Class '${assignDto.classId}' not found in this school's class registry`);
                error.statusCode = 404;
                throw error;
            }
            studentQuery.class = resolvedId;
            if (assignDto.sectionId) {
                studentQuery.section = assignDto.sectionId;
            }
        } else if (structure.applicableClasses && structure.applicableClasses.length > 0) {
            // Default: assign to ALL classes this structure is designed for
            const resolvedIds = resolveClassIds(structure.applicableClasses);
            if (resolvedIds.length === 0) {
                const error = new Error('None of the applicable classes exist in this school\'s class registry');
                error.statusCode = 404;
                throw error;
            }
            studentQuery.class = { $in: resolvedIds };
        } else {
            const error = new Error('Either classId or studentIds must be provided, or structure must have applicableClasses defined');
            error.statusCode = 400;
            throw error;
        }

        const students = await StudentModel.find(studentQuery).lean();
        if (students.length === 0) {
            const error = new Error('No active students found matching target criteria');
            error.statusCode = 404;
            throw error;
        }

        const createdCount = [];
        const skippedCount = [];

        for (const student of students) {
            // Check if ledger already exists
            const existing = await StudentFeeAccountRepository.findByStudentAndYear(
                schoolId,
                student.studentId,
                structure.academicYear
            );

            if (existing) {
                skippedCount.push(student.studentId);
                continue;
            }

            const startYear = Number(structure.academicYear.split("-")[0]);
            
            // Map breakdown items
            const feeBreakdown = structure.feeItems.map((item) => {
                const dueMonth = 4; // default April/May cycle start
                const dueDate = new Date(Date.UTC(startYear, dueMonth, item.dueDayOfMonth || 10));

                return {
                    feeCategoryId: item.feeCategoryId,
                    categoryName: item.categoryName,
                    categoryType: item.categoryType,
                    originalAmount: item.amount,
                    adjustments: 0,
                    discountAmount: 0,
                    waivedAmount: 0,
                    netAmount: item.amount,
                    paidAmount: 0,
                    refundedAmount: 0,
                    lateFeeCharged: 0,
                    balanceAmount: item.amount,
                    dueDate,
                    status: 'unpaid'
                };
            });

            // Map installment schedules
            const installmentSchedule = structure.installmentEnabled
                ? structure.installments.map((inst) => {
                      const totalAmount = Math.round(((structure.totalFeeAmount * inst.percentageOfTotal) / 100) * 100) / 100;
                      return {
                          installmentNumber: inst.installmentNumber,
                          label: inst.label,
                          dueDate: inst.dueDate,
                          totalAmount,
                          paidAmount: 0,
                          balanceAmount: totalAmount,
                          lateFeeApplied: 0,
                          status: 'pending'
                      };
                  })
                : [];

            const totalOriginalFees = structure.totalFeeAmount;

            const accountData = {
                assignmentId: generateAssignmentId(),
                schoolId,
                studentId: student.studentId,
                studentName: `${student.firstName} ${student.lastName}`.trim(),
                classId: student.class,
                className: getClassName(student.class),
                sectionId: student.section || '',
                sectionName: student.section ? getSectionName(student.class, student.section) : '',
                rollNumber: student.rollNumber || '',
                academicYear: structure.academicYear,
                feeStructureId: structure.feeStructureId,
                feeStructureName: structure.name,
                feeBreakdown,
                installmentSchedule,
                totalOriginalFees,
                totalAdjustments: 0,
                totalDiscount: 0,
                totalWaived: 0,
                netFees: totalOriginalFees,
                totalPaid: 0,
                totalRefunded: 0,
                totalLateFee: 0,
                totalBalance: totalOriginalFees,
                accountStatus: 'active',
                isProRata: !!assignDto.isProRata,
                proRataConfig: assignDto.isProRata ? {
                    admissionDate: assignDto.proRataConfig?.admissionDate || new Date(),
                    originalTotalFees: totalOriginalFees,
                    reason: assignDto.proRataConfig?.reason || 'Mid-year admission'
                } : null,
                createdBy: actor?.userId || 'system',
                createdByName: actor?.name || actor?.firstName || 'System Admin'
            };

            const account = await StudentFeeAccountRepository.create(schoolId, accountData);
            createdCount.push(account.assignmentId);
        }

        return {
            createdCount: createdCount.length,
            skippedCount: skippedCount.length,
            skippedStudentIds: skippedCount
        };
    }

    /**
     * Lists running ledgers
     */
    async getAccounts(schoolId, filters, pagination) {
        const { data, totalRecords } = await StudentFeeAccountRepository.findAll(schoolId, filters, pagination);
        return {
            data,
            pagination: {
                totalRecords,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalRecords / pagination.limit),
                limit: pagination.limit
            }
        };
    }

    /**
     * Gets ledger by ID
     */
    async getAccountById(schoolId, accountId) {
        const account = await StudentFeeAccountRepository.findById(schoolId, accountId);
        if (!account) {
            const error = new Error('Fee account ledger not found');
            error.statusCode = 404;
            throw error;
        }
        return account;
    }

    /**
     * Gets student accounts (all years) with security verification checks
     */
    async getAccountsByStudent(schoolId, studentId, requester) {
        // Enforce role guards: Student/Parent boundary
        if (requester && !['sch_admin', 'principal', 'accountant', 'super_admin', 'admin'].includes(requester.role)) {
            if (requester.role === 'student' && requester.studentId !== studentId) {
                const error = new Error('Unauthorized access to another student details');
                error.statusCode = 403;
                throw error;
            }
            if (requester.role === 'parent') {
                const effectiveParentId = requester.parentId || requester.userId;
                let hasAccess = false;

                if (Array.isArray(requester.studentIds) && requester.studentIds.includes(studentId)) {
                    hasAccess = true;
                }

                if (!hasAccess) {
                    const StudentModel = await this._getStudentModel(schoolId);
                    const targetStudent = await StudentModel.findOne({ schoolId, studentId }).lean();
                    if (targetStudent && targetStudent.parentId && (
                        targetStudent.parentId === effectiveParentId ||
                        targetStudent.parentId === requester.parentId ||
                        targetStudent.parentId === requester.userId
                    )) {
                        hasAccess = true;
                    }

                    if (!hasAccess) {
                        const ParentModel = await this._getParentModel(schoolId);
                        const parentDoc = await ParentModel.findOne({
                            $or: [
                                { parentId: effectiveParentId },
                                { userId: requester.userId },
                                { email: requester.email }
                            ].filter(Boolean)
                        }).lean();

                        if (parentDoc && Array.isArray(parentDoc.studentIds) && parentDoc.studentIds.includes(studentId)) {
                            hasAccess = true;
                        } else if (targetStudent && parentDoc && targetStudent.parentId === parentDoc.parentId) {
                            hasAccess = true;
                        }
                    }
                }

                if (!hasAccess) {
                    const error = new Error('Unauthorized access to another student details');
                    error.statusCode = 403;
                    throw error;
                }
            }
        }

        const StudentFeeAssignment = await StudentFeeAccountRepository.getModel(schoolId);
        return await StudentFeeAssignment.find({
            schoolId,
            studentId,
            isDeleted: false
        }).sort({ academicYear: -1 }).lean();
    }

    /**
     * Freezes a student account
     */
    async freezeAccount(schoolId, accountId, actor) {
        const account = await StudentFeeAccountRepository.findById(schoolId, accountId);
        if (!account) {
            const error = new Error('Fee account ledger not found');
            error.statusCode = 404;
            throw error;
        }

        const updateData = {
            accountStatus: 'frozen',
            updatedBy: actor?.userId || 'system',
            updatedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await StudentFeeAccountRepository.update(schoolId, accountId, updateData);
    }

    /**
     * Unfreezes a student account and restores correct status
     */
    async unfreezeAccount(schoolId, accountId, actor) {
        const account = await StudentFeeAccountRepository.findById(schoolId, accountId);
        if (!account) {
            const error = new Error('Fee account ledger not found');
            error.statusCode = 404;
            throw error;
        }

        if (account.accountStatus !== 'frozen') {
            const error = new Error('Account is not currently frozen');
            error.statusCode = 400;
            throw error;
        }

        // Set to active to allow helper to resolve the actual status on save
        account.accountStatus = 'active';
        recalculateAccount(account);

        const updateData = {
            accountStatus: account.accountStatus,
            totalBalance: account.totalBalance,
            updatedBy: actor?.userId || 'system',
            updatedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await StudentFeeAccountRepository.update(schoolId, accountId, updateData);
    }

    /**
     * Marks student as transferred out
     */
    async transferOut(schoolId, accountId, transferDto, actor) {
        const account = await StudentFeeAccountRepository.findById(schoolId, accountId);
        if (!account) {
            const error = new Error('Fee account ledger not found');
            error.statusCode = 404;
            throw error;
        }

        const updateData = {
            accountStatus: 'transferred_out',
            transferredToSchool: transferDto.transferredToSchool || '',
            transferDate: new Date(),
            transferNote: transferDto.reason || '',
            updatedBy: actor?.userId || 'system',
            updatedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await StudentFeeAccountRepository.update(schoolId, accountId, updateData);
    }

    /**
     * Updates ledger admin notes
     */
    async updateAccountNotes(schoolId, accountId, notes, actor) {
        const account = await StudentFeeAccountRepository.findById(schoolId, accountId);
        if (!account) {
            const error = new Error('Fee account ledger not found');
            error.statusCode = 404;
            throw error;
        }

        const updateData = {
            adminNotes: notes ? notes.trim() : '',
            updatedBy: actor?.userId || 'system',
            updatedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await StudentFeeAccountRepository.update(schoolId, accountId, updateData);
    }
}

module.exports = new StudentFeeAccountService();
