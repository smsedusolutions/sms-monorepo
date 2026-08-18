// apps/sm-payment-service/services/feeReceipt.service.js

const FeeReceiptRepository = require('../repositories/feeReceipt.repository');
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { StudentSchema, ParentSchema } = require("@sms/shared/models");
const { generateReceiptPDF } = require('../utils/pdfGenerator');

/**
 * FeeReceipt Service
 * Orchestrates lookup parameters matching, security boundaries validation, 
 * and pipes PDFKit rendering streams directly to network outputs.
 */
class FeeReceiptService {
    /**
     * Resolves student model dynamically
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
     * Asserts query requester belongs to the matching student ID boundary
     */
    async _assertRequesterAccess(schoolId, studentId, requester) {
        if (!requester) return;

        // School Admin, Accountant, Principal, Admin
        if (['sch_admin', 'principal', 'accountant', 'super_admin', 'admin'].includes(requester.role)) {
            return;
        }

        if (requester.role === 'student') {
            if (requester.studentId && requester.studentId !== studentId) {
                const error = new Error('Unauthorized access to receipt details');
                error.statusCode = 403;
                throw error;
            }
            return;
        }

        if (requester.role === 'parent') {
            const effectiveParentId = requester.parentId || requester.userId;

            // 1. Direct match from JWT token studentIds
            if (Array.isArray(requester.studentIds) && requester.studentIds.includes(studentId)) {
                return;
            }

            // 2. Direct match on Student's parentId
            const StudentModel = await this._getStudentModel(schoolId);
            const targetStudent = await StudentModel.findOne({ schoolId, studentId }).lean();
            if (targetStudent && targetStudent.parentId && (
                targetStudent.parentId === effectiveParentId ||
                targetStudent.parentId === requester.parentId ||
                targetStudent.parentId === requester.userId
            )) {
                return;
            }

            // 3. Match from Parent document in DB
            const ParentModel = await this._getParentModel(schoolId);
            const parentDoc = await ParentModel.findOne({
                $or: [
                    { parentId: effectiveParentId },
                    { userId: requester.userId },
                    { email: requester.email }
                ].filter(Boolean)
            }).lean();

            if (parentDoc && Array.isArray(parentDoc.studentIds) && parentDoc.studentIds.includes(studentId)) {
                return;
            }

            // If target student found and parent document exists, permit access
            if (targetStudent && parentDoc && targetStudent.parentId === parentDoc.parentId) {
                return;
            }

            const error = new Error('Unauthorized access to child receipt details');
            error.statusCode = 403;
            throw error;
        }
    }

    /**
     * Retrieves receipt metadata JSON
     */
    async getReceiptById(schoolId, receiptId, requester) {
        const receipt = await FeeReceiptRepository.findById(schoolId, receiptId);
        if (!receipt) {
            const error = new Error('Receipt not found');
            error.statusCode = 404;
            throw error;
        }

        await this._assertRequesterAccess(schoolId, receipt.student.studentId, requester);
        return receipt;
    }

    /**
     * Renders point-in-time receipt PDF streams
     */
    async getReceiptPDFStream(schoolId, receiptId, requester, responseStream) {
        const receipt = await FeeReceiptRepository.findById(schoolId, receiptId);
        if (!receipt) {
            const error = new Error('Receipt not found');
            error.statusCode = 404;
            throw error;
        }

        await this._assertRequesterAccess(schoolId, receipt.student.studentId, requester);

        // Render PDF directly into response stream
        generateReceiptPDF(receipt, responseStream);
    }

    /**
     * List all receipts for a student
     */
    async getStudentReceipts(schoolId, studentId, requester) {
        await this._assertRequesterAccess(schoolId, studentId, requester);
        return await FeeReceiptRepository.findByStudent(schoolId, studentId);
    }
}

module.exports = new FeeReceiptService();
