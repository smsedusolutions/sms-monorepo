import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

export interface TransferCertificateData {
    tcNumber: string;
    issuedDate: string;
    // School
    schoolName: string;
    schoolAddress?: string;
    schoolLogoUrl?: string;
    schoolContact?: string;
    schoolEmail?: string;
    affiliationNumber?: string;
    // Student
    studentName: string;
    admissionNumber?: string;
    rollNumber?: string;
    dateOfBirth: string;
    dateOfBirthInWords?: string;
    gender?: string;
    religion?: string;
    caste?: string;
    nationality?: string;
    motherTongue?: string;
    aadharNumber?: string;
    // Academic
    classLastStudied: string;
    sectionName?: string;
    academicYear: string;
    dateOfAdmission: string;
    dateOfLeaving: string;
    reasonForLeaving?: string;
    // Family
    fatherName: string;
    motherName?: string;
    parentContact?: string;
    parentAddress?: string;
    // Records
    conduct?: string;
    totalWorkingDays?: number;
    daysPresent?: number;
    attendancePercentage?: number;
    feesClearance?: 'cleared' | 'pending';
    libraryDues?: 'cleared' | 'pending';
    generalRemarks?: string;
}

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10, backgroundColor: '#fff' },
    header: { alignItems: 'center', marginBottom: 14, borderBottom: '2pt solid #1e3a5f', paddingBottom: 12 },
    logo: { width: 55, height: 55, marginBottom: 6, borderRadius: 4 },
    schoolName: { fontSize: 16, fontWeight: 'bold', color: '#1e3a5f', textAlign: 'center', textTransform: 'uppercase' },
    schoolSub: { fontSize: 8, color: '#475569', textAlign: 'center', marginTop: 2 },
    tcTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a5f', textAlign: 'center', textDecoration: 'underline', marginTop: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    tcMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    tcMetaText: { fontSize: 9, color: '#374151' },
    section: { marginBottom: 10 },
    sectionTitle: { fontSize: 9.5, fontWeight: 'bold', color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '0.5pt solid #93c5fd', paddingBottom: 3, marginBottom: 7 },
    row: { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
    label: { fontSize: 9, color: '#374151', width: 140, fontWeight: 'bold' },
    colon: { fontSize: 9, color: '#374151', width: 10 },
    value: { fontSize: 9, color: '#111827', flex: 1, borderBottom: '0.5pt dotted #cbd5e1', paddingBottom: 1 },
    valueBold: { fontSize: 9, color: '#111827', flex: 1, fontWeight: 'bold', borderBottom: '0.5pt dotted #cbd5e1', paddingBottom: 1 },
    grid: { flexDirection: 'row', gap: 20 },
    halfRow: { flex: 1 },
    conductBadge: { backgroundColor: '#dcfce7', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, border: '0.5pt solid #86efac', alignSelf: 'flex-start' },
    conductText: { fontSize: 9, color: '#166534', fontWeight: 'bold' },
    clearanceBadge: { backgroundColor: '#dcfce7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, border: '0.5pt solid #86efac' },
    pendingBadge: { backgroundColor: '#fee2e2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, border: '0.5pt solid #fca5a5' },
    clearanceText: { fontSize: 8, color: '#166534', fontWeight: 'bold' },
    pendingText: { fontSize: 8, color: '#dc2626', fontWeight: 'bold' },
    certText: { fontSize: 9, color: '#374151', lineHeight: 1.6, marginBottom: 12, textAlign: 'justify' },
    signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
    signatureBlock: { alignItems: 'center', width: 120 },
    signatureLine: { borderTop: '0.5pt solid #374151', width: 100, marginBottom: 4 },
    signatureLabel: { fontSize: 8, color: '#374151', textAlign: 'center' },
    footer: { marginTop: 20, borderTop: '0.5pt solid #cbd5e1', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 7, color: '#94a3b8' },
    watermark: { position: 'absolute', top: '40%', left: '20%', fontSize: 52, color: '#f1f5f9', fontWeight: 'bold', transform: 'rotate(-35deg)', opacity: 0.3 },
    tcNumBox: { border: '1pt solid #1e3a5f', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: '#eff6ff' },
    tcNumText: { fontSize: 9, fontWeight: 'bold', color: '#1e3a5f' },
});

const InfoRow: React.FC<{ label: string; value?: string; bold?: boolean }> = ({ label, value, bold }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.colon}>:</Text>
        <Text style={bold ? styles.valueBold : styles.value}>{value || '—'}</Text>
    </View>
);

export const TransferCertificatePDF: React.FC<{ data: TransferCertificateData }> = ({ data }) => (
    <Document title={`Transfer Certificate - ${data.studentName}`}>
        <Page size="A4" style={styles.page}>
            {/* Watermark */}
            <Text style={styles.watermark}>ORIGINAL</Text>

            {/* School Header */}
            <View style={styles.header}>
                {data.schoolLogoUrl && <Image src={data.schoolLogoUrl} style={styles.logo} />}
                <Text style={styles.schoolName}>{data.schoolName}</Text>
                {data.schoolAddress && <Text style={styles.schoolSub}>{data.schoolAddress}</Text>}
                {(data.schoolContact || data.schoolEmail) && (
                    <Text style={styles.schoolSub}>
                        {[data.schoolContact, data.schoolEmail].filter(Boolean).join('  |  ')}
                    </Text>
                )}
                {data.affiliationNumber && (
                    <Text style={styles.schoolSub}>Affiliation No: {data.affiliationNumber}</Text>
                )}
            </View>

            {/* TC Title */}
            <Text style={styles.tcTitle}>Transfer Certificate</Text>

            {/* TC Meta */}
            <View style={styles.tcMeta}>
                <View style={styles.tcNumBox}>
                    <Text style={styles.tcNumText}>TC No: {data.tcNumber}</Text>
                </View>
                <Text style={styles.tcMetaText}>Date of Issue: {data.issuedDate}</Text>
                <Text style={styles.tcMetaText}>Academic Year: {data.academicYear}</Text>
            </View>

            {/* Certification Paragraph */}
            <Text style={styles.certText}>
                This is to certify that <Text style={{ fontWeight: 'bold' }}>{data.studentName}</Text>, 
                {data.fatherName ? ` S/o or D/o ${data.fatherName},` : ''} bearing Admission No. {data.admissionNumber || '—'}, 
                was a bonafide student of this school. The following particulars are certified as correct based on school records.
            </Text>

            {/* Student Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Student Information</Text>
                <View style={styles.grid}>
                    <View style={styles.halfRow}>
                        <InfoRow label="Student's Full Name" value={data.studentName} bold />
                        <InfoRow label="Father's Name" value={data.fatherName} />
                        <InfoRow label="Mother's Name" value={data.motherName} />
                        <InfoRow label="Date of Birth" value={data.dateOfBirth} />
                        {data.dateOfBirthInWords && (
                            <InfoRow label="D.O.B. (In Words)" value={data.dateOfBirthInWords} />
                        )}
                        <InfoRow label="Gender" value={data.gender} />
                        <InfoRow label="Nationality" value={data.nationality || 'Indian'} />
                    </View>
                    <View style={styles.halfRow}>
                        <InfoRow label="Religion" value={data.religion} />
                        <InfoRow label="Caste / Category" value={data.caste} />
                        <InfoRow label="Mother Tongue" value={data.motherTongue} />
                        <InfoRow label="Admission Number" value={data.admissionNumber} />
                        <InfoRow label="Roll Number" value={data.rollNumber} />
                        {data.aadharNumber && (
                            <InfoRow label="Aadhar Number" value={data.aadharNumber} />
                        )}
                        <InfoRow label="Parent Contact" value={data.parentContact} />
                    </View>
                </View>
            </View>

            {/* Academic Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Academic Information</Text>
                <View style={styles.grid}>
                    <View style={styles.halfRow}>
                        <InfoRow label="Class Last Studied" value={`${data.classLastStudied}${data.sectionName ? ` - ${data.sectionName}` : ''}`} bold />
                        <InfoRow label="Date of Admission" value={data.dateOfAdmission} />
                        <InfoRow label="Date of Leaving" value={data.dateOfLeaving} bold />
                    </View>
                    <View style={styles.halfRow}>
                        <InfoRow label="Reason for Leaving" value={data.reasonForLeaving} />
                        {data.totalWorkingDays !== undefined && (
                            <InfoRow label="Total Working Days" value={String(data.totalWorkingDays)} />
                        )}
                        {data.daysPresent !== undefined && (
                            <InfoRow label="Days Present" value={String(data.daysPresent)} />
                        )}
                        {data.attendancePercentage !== undefined && (
                            <InfoRow label="Attendance %" value={`${data.attendancePercentage}%`} />
                        )}
                    </View>
                </View>
            </View>

            {/* Conduct & Clearance */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Conduct & Clearances</Text>
                <View style={styles.grid}>
                    <View style={styles.halfRow}>
                        <View style={styles.row}>
                            <Text style={styles.label}>General Conduct</Text>
                            <Text style={styles.colon}>:</Text>
                            <View style={styles.conductBadge}>
                                <Text style={styles.conductText}>{data.conduct || 'Good'}</Text>
                            </View>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Fees Clearance</Text>
                            <Text style={styles.colon}>:</Text>
                            <View style={data.feesClearance === 'pending' ? styles.pendingBadge : styles.clearanceBadge}>
                                <Text style={data.feesClearance === 'pending' ? styles.pendingText : styles.clearanceText}>
                                    {data.feesClearance === 'pending' ? 'PENDING' : 'CLEARED'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.halfRow}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Library Dues</Text>
                            <Text style={styles.colon}>:</Text>
                            <View style={data.libraryDues === 'pending' ? styles.pendingBadge : styles.clearanceBadge}>
                                <Text style={data.libraryDues === 'pending' ? styles.pendingText : styles.clearanceText}>
                                    {data.libraryDues === 'pending' ? 'PENDING' : 'CLEARED'}
                                </Text>
                            </View>
                        </View>
                        {data.generalRemarks && (
                            <InfoRow label="General Remarks" value={data.generalRemarks} />
                        )}
                    </View>
                </View>
            </View>

            {/* Signatures */}
            <View style={styles.signaturesRow}>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Class Teacher</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Accounts Dept.</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Vice Principal</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Principal / Head of School</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {data.schoolName} — Official Transfer Certificate
                </Text>
                <Text style={styles.footerText}>
                    TC No: {data.tcNumber} | Issued: {data.issuedDate}
                </Text>
                <Text style={styles.footerText}>
                    *This document is computer generated and does not require a physical signature unless stamped.*
                </Text>
            </View>
        </Page>
    </Document>
);

export default TransferCertificatePDF;
