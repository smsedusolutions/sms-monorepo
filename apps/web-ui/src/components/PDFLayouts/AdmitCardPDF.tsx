import React from 'react';
import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
} from '@react-pdf/renderer';

// Admit Card PDF styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#fff',
    },
    // Border container
    container: {
        border: '3pt solid #1976D2',
        borderRadius: 5,
        overflow: 'hidden',
    },
    // Header
    header: {
        backgroundColor: '#1976D2',
        padding: 15,
        alignItems: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    schoolLogo: {
        width: 45,
        height: 45,
        marginRight: 12,
        borderRadius: 22,
        backgroundColor: '#fff',
    },
    schoolInfo: {
        alignItems: 'center',
    },
    schoolName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    schoolAddress: {
        fontSize: 9,
        color: '#e3f2fd',
        marginTop: 3,
    },
    admitCardBadge: {
        backgroundColor: '#ff9800',
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 15,
        marginTop: 10,
    },
    admitCardBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Exam title section
    examTitleSection: {
        backgroundColor: '#e3f2fd',
        padding: 10,
        borderBottom: '2pt solid #1976D2',
        alignItems: 'center',
    },
    examName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1565c0',
    },
    academicYear: {
        fontSize: 10,
        color: '#666',
        marginTop: 3,
    },
    // Content
    content: {
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    leftColumn: {
        width: '65%',
    },
    rightColumn: {
        width: '30%',
        alignItems: 'center',
    },
    // Table
    table: {
        marginBottom: 15,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #ddd',
    },
    tableLabel: {
        width: '40%',
        padding: 8,
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        fontSize: 10,
    },
    tableValue: {
        width: '60%',
        padding: 8,
        fontSize: 10,
    },
    // Exam period box
    examPeriodBox: {
        backgroundColor: '#fff3e0',
        padding: 12,
        borderRadius: 5,
        border: '1pt solid #ffcc80',
    },
    examPeriodLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#e65100',
        marginBottom: 4,
    },
    examPeriodValue: {
        fontSize: 11,
        color: '#333',
    },
    // Photo and signature
    photoBox: {
        width: 100,
        height: 120,
        border: '1pt solid #ddd',
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    photo: {
        width: 98,
        height: 118,
        objectFit: 'cover',
    },
    photoPlaceholder: {
        fontSize: 8,
        color: '#999',
    },
    captionText: {
        fontSize: 8,
        color: '#666',
        marginBottom: 12,
    },
    signatureBox: {
        width: 100,
        height: 40,
        border: '1pt solid #ddd',
        marginBottom: 6,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    signature: {
        maxWidth: 98,
        maxHeight: 38,
        objectFit: 'contain',
    },
    // Divider
    divider: {
        borderTop: '1pt solid #1976D2',
        marginVertical: 20,
    },
    // Signature section
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    signatureColumn: {
        width: '30%',
        alignItems: 'center',
    },
    signatureLine: {
        borderTop: '1pt solid #333',
        width: '100%',
        marginTop: 35,
        paddingTop: 5,
    },
    signatureLabel: {
        fontSize: 8,
        color: '#333',
        fontWeight: 'bold',
    },
    // Instructions
    instructionsBox: {
        backgroundColor: '#fafafa',
        padding: 12,
        border: '1pt solid #eee',
        borderRadius: 2,
        marginTop: 15,
    },
    instructionsTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    instructionItem: {
        fontSize: 8,
        color: '#555',
        marginBottom: 4,
        paddingLeft: 8,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 7,
        color: '#999',
    },
    // Schedule table
    scheduleSection: {
        marginTop: 15,
        marginBottom: 10,
    },
    scheduleTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 8,
    },
    scheduleTable: {
        border: '1pt solid #ddd',
    },
    scheduleHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderBottom: '1pt solid #ddd',
    },
    scheduleRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #eee',
    },
    scheduleCell: {
        padding: 6,
        fontSize: 9,
    },
    scheduleCellHeader: {
        padding: 6,
        fontSize: 9,
        fontWeight: 'bold',
    },
    scheduleDate: {
        width: '25%',
    },
    scheduleTime: {
        width: '25%',
    },
    scheduleSubject: {
        width: '30%',
    },
    scheduleSign: {
        width: '20%',
        alignItems: 'center',
    },
    signLine: {
        borderBottom: '0.5pt solid #999',
        width: 50,
        height: 12,
    },
});

export interface ExamScheduleItem {
    date: string;
    startTime: string;
    endTime: string;
    subjectName: string;
}

export interface AdmitCardPDFProps {
    studentName: string;
    fatherName: string;
    fatherNameLabel?: string;
    rollNumber: string;
    studentId: string;
    className: string;
    sectionName: string;
    dob: string;
    schoolName: string;
    schoolAddress: string;
    schoolLogo?: string;
    studentPhoto?: string;
    studentSignature?: string;
    examName: string;
    examType: string;
    examTerm: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    examSchedule?: ExamScheduleItem[];
}

const AdmitCardPDF: React.FC<AdmitCardPDFProps> = ({
    studentName,
    fatherName,
    fatherNameLabel = "Father's Name",
    rollNumber,
    studentId,
    className,
    sectionName,
    dob,
    schoolName,
    schoolAddress,
    schoolLogo,
    studentPhoto,
    studentSignature,
    examName,
    examType,
    examTerm,
    academicYear,
    startDate,
    endDate,
    examSchedule = [],
}) => {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatShortDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            {schoolLogo && (
                                <Image src={schoolLogo} style={styles.schoolLogo} />
                            )}
                            <View style={styles.schoolInfo}>
                                <Text style={styles.schoolName}>{schoolName}</Text>
                                <Text style={styles.schoolAddress}>{schoolAddress}</Text>
                            </View>
                        </View>
                        <View style={styles.admitCardBadge}>
                            <Text style={styles.admitCardBadgeText}>ADMIT CARD</Text>
                        </View>
                    </View>

                    {/* Exam Title */}
                    <View style={styles.examTitleSection}>
                        <Text style={styles.examName}>{examName} - {examType}</Text>
                        <Text style={styles.academicYear}>
                            Academic Year: {academicYear} | {examTerm}
                        </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <View style={styles.row}>
                            {/* Left Column - Student Details */}
                            <View style={styles.leftColumn}>
                                <View style={styles.table}>
                                    <View style={styles.tableRow}>
                                        <Text style={styles.tableLabel}>Student Name</Text>
                                        <Text style={styles.tableValue}>{studentName}</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={styles.tableLabel}>{fatherNameLabel}</Text>
                                        <Text style={styles.tableValue}>{fatherName}</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={styles.tableLabel}>Roll Number</Text>
                                        <Text style={styles.tableValue}>{rollNumber}</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={styles.tableLabel}>Student ID</Text>
                                        <Text style={styles.tableValue}>{studentId}</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={styles.tableLabel}>Class / Section</Text>
                                        <Text style={styles.tableValue}>{className} / {sectionName}</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={styles.tableLabel}>Date of Birth</Text>
                                        <Text style={styles.tableValue}>{dob}</Text>
                                    </View>
                                </View>

                                {/* Exam Period */}
                                <View style={styles.examPeriodBox}>
                                    <Text style={styles.examPeriodLabel}>Examination Period</Text>
                                    <Text style={styles.examPeriodValue}>
                                        {formatDate(startDate)} to {formatDate(endDate)}
                                    </Text>
                                </View>
                            </View>

                            {/* Right Column - Photo & Signature */}
                            <View style={styles.rightColumn}>
                                <View style={styles.photoBox}>
                                    {studentPhoto ? (
                                        <Image src={studentPhoto} style={styles.photo} />
                                    ) : (
                                        <Text style={styles.photoPlaceholder}>Photo</Text>
                                    )}
                                </View>
                                <Text style={styles.captionText}>Photograph of Candidate</Text>

                                <View style={styles.signatureBox}>
                                    {studentSignature ? (
                                        <Image src={studentSignature} style={styles.signature} />
                                    ) : (
                                        <Text style={styles.photoPlaceholder}>Signature</Text>
                                    )}
                                </View>
                                <Text style={styles.captionText}>Signature of Candidate</Text>
                            </View>
                        </View>

                        {/* Exam Schedule Table */}
                        {examSchedule.length > 0 && (
                            <View style={styles.scheduleSection}>
                                <Text style={styles.scheduleTitle}>Exam Schedule</Text>
                                <View style={styles.scheduleTable}>
                                    {/* Header */}
                                    <View style={styles.scheduleHeader}>
                                        <Text style={[styles.scheduleCellHeader, styles.scheduleDate]}>Date</Text>
                                        <Text style={[styles.scheduleCellHeader, styles.scheduleTime]}>Time</Text>
                                        <Text style={[styles.scheduleCellHeader, styles.scheduleSubject]}>Subject</Text>
                                        <Text style={[styles.scheduleCellHeader, styles.scheduleSign]}>Invigilator Sign</Text>
                                    </View>
                                    {/* Rows */}
                                    {examSchedule.map((sch, index) => (
                                        <View style={styles.scheduleRow} key={index}>
                                            <Text style={[styles.scheduleCell, styles.scheduleDate]}>
                                                {formatShortDate(sch.date)}
                                            </Text>
                                            <Text style={[styles.scheduleCell, styles.scheduleTime]}>
                                                {sch.startTime} - {sch.endTime}
                                            </Text>
                                            <Text style={[styles.scheduleCell, styles.scheduleSubject]}>
                                                {sch.subjectName}
                                            </Text>
                                            <View style={[styles.scheduleCell, styles.scheduleSign]}>
                                                <View style={styles.signLine} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Signature Section */}
                        <View style={styles.signatureSection}>
                            <View style={styles.signatureColumn}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Class Teacher's Signature</Text>
                            </View>
                            <View style={styles.signatureColumn}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Candidate's Signature</Text>
                            </View>
                            <View style={styles.signatureColumn}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Principal's Signature</Text>
                            </View>
                        </View>

                        {/* Instructions */}
                        <View style={styles.instructionsBox}>
                            <Text style={styles.instructionsTitle}>Important Instructions:</Text>
                            <Text style={styles.instructionItem}>
                                • Bring this admit card to the examination hall along with a valid ID proof.
                            </Text>
                            <Text style={styles.instructionItem}>
                                • Reach the examination center at least 30 minutes before the scheduled time.
                            </Text>
                            <Text style={styles.instructionItem}>
                                • Electronic devices including mobile phones are strictly prohibited.
                            </Text>
                            <Text style={styles.instructionItem}>
                                • Any attempt to use unfair means will result in disqualification.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Generated by School Management System | Admit Card to be collected by Invigilator
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default AdmitCardPDF;
