// apps/sm-payment-service/services/feePayment.service.js

const StudentFeeAccountRepository = require('../repositories/studentFeeAccount.repository');
const FeePaymentRepository = require('../repositories/feePayment.repository');
const FeeReceiptRepository = require('../repositories/feeReceipt.repository');
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { SchoolModel, StudentSchema, ParentSchema } = require("@sms/shared/models");
const { generateReceiptId } = require('../utils/generateId');
const { generateReceiptNumber } = require('../utils/receiptNumberGenerator');
const { createTransaction } = require('../utils/transactionHelper');

/**
 * FeePayment Service
 * Orchestrates business logics for recording cash/UPI/card payments, recalculating ledger balances,
 * writing journal entries, and executing refunds with void receipts watermarking.
 */
class FeePaymentService {
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
     * Records a fee payment, recalculates ledger balances, and generates the point-in-time receipt
     */
    async recordPayment(schoolId, recordDto, actor) {
        const AccountModel = await StudentFeeAccountRepository.getModel(schoolId);
        const TransactionModel = await FeePaymentRepository.getModel(schoolId);
        const ReceiptModel = await FeeReceiptRepository.getModel(schoolId);

        // 1. Fetch student fee account ledger
        const query = {
            schoolId,
            studentId: recordDto.studentId,
            isDeleted: false
        };
        if (recordDto.accountId) {
            query.assignmentId = recordDto.accountId;
        }

        let account = await AccountModel.findOne(query);
        if (!account && !recordDto.accountId) {
            // Sort by academicYear descending if finding by studentId to get the latest ledger
            account = await AccountModel.findOne({ schoolId, studentId: recordDto.studentId, isDeleted: false }).sort({ academicYear: -1 });
        }

        if (!account) {
            const error = new Error("Fee account ledger not found");
            error.statusCode = 404;
            throw error;
        }

        if (['frozen', 'transferred_out', 'waived'].includes(account.accountStatus)) {
            const error = new Error(`Cannot record payment. Fee account is currently ${account.accountStatus}`);
            error.statusCode = 400;
            throw error;
        }

        // Extra guard: check that there's at least some balance remaining in the breakdown
        const hasOutstandingBalance = account.feeBreakdown.some(item => (item.balanceAmount || 0) > 0);
        if (!hasOutstandingBalance) {
            const error = new Error("Cannot record payment. All fee categories have been fully paid.");
            error.statusCode = 400;
            throw error;
        }

        // 2. Validate payment items limits
        let totalFeeAmount = 0;
        let totalLateFee = 0;
        const validatedItems = [];

        for (const item of recordDto.paymentItems) {
            const ledgerItem = account.feeBreakdown.find(f => f.feeCategoryId === item.feeCategoryId);
            if (!ledgerItem) {
                const error = new Error(`Fee category ${item.feeCategoryId} is not associated with this account`);
                error.statusCode = 400;
                throw error;
            }

            const paid = Number(item.paidAmount);
            if (isNaN(paid) || paid <= 0) {
                const error = new Error("paidAmount must be greater than 0");
                error.statusCode = 400;
                throw error;
            }

            if (paid > ledgerItem.balanceAmount) {
                const error = new Error(`Payment amount of ${paid} exceeds remaining outstanding balance of ${ledgerItem.balanceAmount} for category ${ledgerItem.categoryName}`);
                error.statusCode = 400;
                throw error;
            }

            const lateFee = Number(item.lateFeeAmount) || 0;

            totalFeeAmount += paid;
            totalLateFee += lateFee;

            validatedItems.push({
                feeCategoryId: item.feeCategoryId,
                categoryName: ledgerItem.categoryName,
                installmentNumber: item.installmentNumber || null,
                outstandingAmount: ledgerItem.balanceAmount,
                lateFeeAmount: lateFee,
                amount: paid
            });
        }

        const totalAmountReceived = totalFeeAmount + totalLateFee;

        const performedBy = actor?.userId || 'system';
        const performedByName = actor?.name || actor?.firstName || 'System Admin';
        const performedByRole = actor?.role || 'sch_admin';

        const paymentFields = {
            paymentMode: recordDto.paymentMode,
            paymentDate: recordDto.paymentDate ? new Date(recordDto.paymentDate) : new Date(),
            referenceNumber: recordDto.referenceNumber || '',
            bankName: recordDto.bankName || ''
        };

        const description = `Fee payment of INR ${totalAmountReceived} received via ${recordDto.paymentMode.toUpperCase()}`;

        // 3. Atomically write transaction journal and update ledger
        const transaction = await createTransaction({
            account,
            TransactionModel,
            type: 'payment',
            amount: totalAmountReceived,
            description,
            reason: recordDto.remarks || '',
            affectedItems: validatedItems,
            performedBy,
            performedByName,
            performedByRole,
            paymentFields
        });

        // 4. Generate Legal Fee Receipt
        const receiptNumber = await generateReceiptNumber(schoolId, account.academicYear);
        const receiptId = generateReceiptId();

        // Query school branding snap info
        const superAdminDb = getSchoolDbConnection("SuperAdmin");
        let SchoolInstance;
        try {
            SchoolInstance = superAdminDb.model("School");
        } catch (e) {
            SchoolInstance = superAdminDb.model("School", SchoolModel.schema);
        }
        
        const schoolObj = await SchoolInstance.findOne({ schoolId }).lean();
        const schoolSnapshot = {
            schoolId,
            schoolName: schoolObj?.schoolName || "School System",
            schoolAddress: schoolObj?.schoolAddress || "",
            schoolPhone: schoolObj?.schoolPhone || "",
            schoolEmail: schoolObj?.schoolEmail || "",
            schoolLogo: schoolObj?.schoolLogo || ""
        };

        const studentSnapshot = {
            studentId: account.studentId,
            studentName: account.studentName,
            className: account.className || "",
            sectionName: account.sectionName || "",
            rollNumber: account.rollNumber || ""
        };

        const lineItems = validatedItems.map(item => ({
            description: item.installmentNumber ? `${item.categoryName} (Installment ${item.installmentNumber})` : item.categoryName,
            feeCategoryId: item.feeCategoryId,
            installmentLabel: item.installmentNumber ? `Installment ${item.installmentNumber}` : null,
            feeAmount: item.amount,
            lateFeeAmount: item.lateFeeAmount,
            lineTotal: item.amount + item.lateFeeAmount
        }));

        const receipt = new ReceiptModel({
            receiptId,
            receiptNumber,
            schoolId,
            assignmentId: account.assignmentId || account.accountId || transaction.assignmentId,
            academicYear: account.academicYear,
            paymentId: transaction.paymentId || transaction.transactionId,
            transactionId: transaction.transactionId,
            student: studentSnapshot,
            school: schoolSnapshot,
            paymentDate: paymentFields.paymentDate,
            paymentMode: paymentFields.paymentMode,
            referenceNumber: paymentFields.referenceNumber,
            bankName: paymentFields.bankName,
            lineItems,
            totalFeeAmount,
            totalLateFeeIncluded: totalLateFee,
            totalAmountPaid: totalAmountReceived,
            totalFeesForYear: account.netFees,
            totalPaidToDate: account.totalPaid,
            balanceRemaining: account.totalBalance,
            createdBy: performedBy,
            createdByName: performedByName
        });

        await receipt.save();

        // 5. Link Receipt back to payment transaction log
        transaction.receiptId = receipt.receiptId;
        await transaction.save();

        return transaction;
    }

    /**
     * Lists transaction history records (type = payment)
     */
    async getPayments(schoolId, filters, pagination) {
        const { data, totalRecords } = await FeePaymentRepository.findAll(schoolId, filters, pagination);
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
     * Gets payment details by ID
     */
    async getPaymentById(schoolId, transactionId) {
        const payment = await FeePaymentRepository.findById(schoolId, transactionId);
        if (!payment) {
            const error = new Error('Payment transaction log not found');
            error.statusCode = 404;
            throw error;
        }
        return payment;
    }

    /**
     * Gets student payments with boundary access checks
     */
    async getPaymentsByStudent(schoolId, studentId, requester) {
        if (requester && !['sch_admin', 'principal', 'accountant', 'super_admin', 'admin'].includes(requester.role)) {
            if (requester.role === 'student' && requester.studentId !== studentId) {
                const error = new Error('Unauthorized access');
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
                    const error = new Error('Unauthorized access');
                    error.statusCode = 403;
                    throw error;
                }
            }
        }

        return await FeePaymentRepository.findByStudent(schoolId, studentId);
    }

    /**
     * Reverses a payment by issuing a refund, restoring outstanding balance on ledger
     */
    async issueRefund(schoolId, paymentId, refundDto, actor) {
        const AccountModel = await StudentFeeAccountRepository.getModel(schoolId);
        const TransactionModel = await FeePaymentRepository.getModel(schoolId);
        const ReceiptModel = await FeeReceiptRepository.getModel(schoolId);

        // Find original payment transaction
        const originalTxn = await TransactionModel.findOne({
            schoolId,
            transactionId: paymentId,
            paymentType: "payment",
            isDeleted: false
        });

        if (!originalTxn) {
            const error = new Error("Original payment transaction not found");
            error.statusCode = 404;
            throw error;
        }

        if (originalTxn.status === "refunded") {
            const error = new Error("Transaction has already been fully refunded");
            error.statusCode = 400;
            throw error;
        }

        const account = await AccountModel.findOne({
            schoolId,
            assignmentId: originalTxn.accountId,
            isDeleted: false
        });

        if (!account) {
            const error = new Error("Associated student fee account ledger not found");
            error.statusCode = 404;
            throw error;
        }

        const validatedItems = [];
        let totalRefundSum = 0;

        for (const item of refundDto.affectedItems) {
            const ledgerItem = account.feeBreakdown.find(f => f.feeCategoryId === item.feeCategoryId);
            if (!ledgerItem) {
                const error = new Error(`Fee category ${item.feeCategoryId} is not in ledger breakdown`);
                error.statusCode = 400;
                throw error;
            }

            const itemRefundAmount = Number(item.amount);
            if (isNaN(itemRefundAmount) || itemRefundAmount <= 0) {
                const error = new Error("Refund amount must be positive");
                error.statusCode = 400;
                throw error;
            }

            if (itemRefundAmount > ledgerItem.paidAmount) {
                const error = new Error(`Refund amount of ${itemRefundAmount} exceeds paid amount of ${ledgerItem.paidAmount} for category ${ledgerItem.categoryName}`);
                error.statusCode = 400;
                throw error;
            }

            totalRefundSum += itemRefundAmount;
            validatedItems.push({
                feeCategoryId: item.feeCategoryId,
                categoryName: ledgerItem.categoryName,
                installmentNumber: item.installmentNumber || null,
                amount: itemRefundAmount
            });
        }

        if (totalRefundSum !== Number(refundDto.refundAmount)) {
            const error = new Error("Sum of item refund amounts must match the total refundAmount");
            error.statusCode = 400;
            throw error;
        }

        const performedBy = actor?.userId || 'system';
        const performedByName = actor?.name || actor?.firstName || 'System Admin';
        const performedByRole = actor?.role || 'sch_admin';

        const refundFields = {
            refundMode: refundDto.refundMode,
            refundDate: new Date(),
            refundReferenceNumber: refundDto.refundReferenceNumber || '',
            originalPaymentId: originalTxn.transactionId
        };

        const description = `Refund of INR ${refundDto.refundAmount} issued for payment transaction ${originalTxn.transactionId}`;

        // Create transaction log and adjust ledger
        const refundTxn = await createTransaction({
            account,
            TransactionModel,
            type: 'refund_issued',
            amount: refundDto.refundAmount,
            description,
            reason: refundDto.reason,
            affectedItems: validatedItems,
            performedBy,
            performedByName,
            performedByRole,
            refundFields
        });

        // Update original transaction status
        originalTxn.status = (totalRefundSum >= originalTxn.amount) ? "refunded" : "partially_refunded";
        
        // Save refund details link on the payment log
        originalTxn.refundDetails = {
            refundedAt: new Date(),
            refundedBy: performedBy,
            refundedByName: performedByName,
            refundAmount: totalRefundSum,
            refundMode: refundDto.refundMode,
            refundReferenceNumber: refundDto.refundReferenceNumber || '',
            reason: refundDto.reason,
            refundPaymentId: refundTxn.transactionId
        };

        await originalTxn.save();

        // Void the related receipt
        if (originalTxn.receiptId) {
            const receipt = await ReceiptModel.findOne({ schoolId, receiptId: originalTxn.receiptId });
            if (receipt) {
                receipt.isVoided = true;
                receipt.voidedAt = new Date();
                receipt.voidedBy = performedBy;
                receipt.voidedByName = performedByName;
                receipt.voidReason = refundDto.reason;
                await receipt.save();
            }
        }

        return {
            transactionId: refundTxn.transactionId,
            originalPaymentStatus: originalTxn.status,
            balanceAfter: account.totalBalance
        };
    }
}

module.exports = new FeePaymentService();
