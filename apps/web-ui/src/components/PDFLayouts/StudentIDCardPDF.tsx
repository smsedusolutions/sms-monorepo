import React from 'react';
import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
} from '@react-pdf/renderer';

export interface StudentIDCardData {
    studentName: string;
    studentId: string;
    rollNumber?: string;
    admissionNumber?: string;
    className: string;
    sectionName?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    parentName?: string;
    parentContact?: string;
    photoUrl?: string;
    schoolName: string;
    schoolAddress?: string;
    schoolLogoUrl?: string;
    schoolContact?: string;
    academicYear?: string;
    validUntil?: string;
}

const BLUE = '#1e3a5f';
const ACCENT = '#f59e0b';
const BG = '#f0f4f8';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
    page: { padding: 20, backgroundColor: BG, fontFamily: 'Helvetica' },
    cardRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
    card: { flex: 1, backgroundColor: WHITE, borderRadius: 2, overflow: 'hidden', border: '1.5pt solid #1e3a5f' },
    cardHeader: { backgroundColor: BLUE, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
    logo: { width: 28, height: 28, borderRadius: 2, backgroundColor: WHITE },
    headerTextBlock: { flex: 1 },
    schoolName: { color: WHITE, fontSize: 8, fontWeight: 'bold' },
    schoolSub: { color: '#93c5fd', fontSize: 6, marginTop: 1 },
    idBadge: { backgroundColor: ACCENT, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 },
    idBadgeText: { color: WHITE, fontSize: 6, fontWeight: 'bold' },
    cardBody: { flexDirection: 'row', padding: 9, gap: 9 },
    photoContainer: { width: 58, height: 70, borderRadius: 2, border: '1.5pt solid #2563eb', backgroundColor: BG, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    photo: { width: 58, height: 70, objectFit: 'cover' },
    photoPlaceholder: { fontSize: 6, color: '#94a3b8', textAlign: 'center' },
    infoBlock: { flex: 1, gap: 3 },
    studentName: { fontSize: 9, fontWeight: 'bold', color: BLUE, marginBottom: 2 },
    infoRow: { flexDirection: 'row', gap: 3, alignItems: 'center' },
    label: { fontSize: 6.5, color: '#64748b', fontWeight: 'bold', width: 48 },
    value: { fontSize: 6.5, color: '#1e293b', flex: 1 },
    divider: { borderBottom: '0.5pt solid #e2e8f0', marginVertical: 3 },
    bloodGroupBadge: { backgroundColor: '#fee2e2', borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1, border: '0.5pt solid #fca5a5' },
    bloodGroupText: { color: '#dc2626', fontSize: 6.5, fontWeight: 'bold' },
    signatureLine: { borderTop: '0.5pt solid #94a3b8', marginTop: 4, paddingTop: 3 },
    signatureText: { fontSize: 6, color: '#94a3b8', textAlign: 'center' },
    emergencyStrip: { backgroundColor: '#fef3c7', paddingHorizontal: 9, paddingVertical: 3, flexDirection: 'row', gap: 4, alignItems: 'center' },
    emergencyLabel: { fontSize: 5.5, fontWeight: 'bold', color: '#92400e' },
    emergencyValue: { fontSize: 6, color: '#78350f', fontWeight: 'bold' },
    cardFooter: { backgroundColor: BLUE, paddingVertical: 4, paddingHorizontal: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerText: { color: '#93c5fd', fontSize: 6 },
    footerAccent: { color: ACCENT, fontSize: 6, fontWeight: 'bold' },
});

const IDCard: React.FC<{ student: StudentIDCardData }> = ({ student }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            {student.schoolLogoUrl ? (
                <Image src={student.schoolLogoUrl} style={styles.logo} />
            ) : (
                <View style={[styles.logo, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 9, color: BLUE }}>S</Text>
                </View>
            )}
            <View style={styles.headerTextBlock}>
                <Text style={styles.schoolName}>{student.schoolName}</Text>
                {student.schoolAddress && <Text style={styles.schoolSub}>{student.schoolAddress}</Text>}
            </View>
            <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>STUDENT ID</Text>
            </View>
        </View>

        <View style={styles.cardBody}>
            <View style={styles.photoContainer}>
                {student.photoUrl ? (
                    <Image src={student.photoUrl} style={styles.photo} />
                ) : (
                    <Text style={styles.photoPlaceholder}>Photo{'\n'}Here</Text>
                )}
            </View>

            <View style={styles.infoBlock}>
                <Text style={styles.studentName}>{student.studentName}</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Class:</Text>
                    <Text style={styles.value}>{student.className}{student.sectionName ? ` - ${student.sectionName}` : ''}</Text>
                    {student.bloodGroup && (
                        <View style={styles.bloodGroupBadge}>
                            <Text style={styles.bloodGroupText}>{student.bloodGroup}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Roll No:</Text>
                    <Text style={styles.value}>{student.rollNumber || '—'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Adm No:</Text>
                    <Text style={styles.value}>{student.admissionNumber || student.studentId}</Text>
                </View>
                {student.dateOfBirth && (
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>DOB:</Text>
                        <Text style={styles.value}>{student.dateOfBirth}</Text>
                    </View>
                )}
                <View style={styles.divider} />
                <View style={styles.signatureLine}>
                    <Text style={styles.signatureText}>Principal / Authorised Signatory</Text>
                </View>
            </View>
        </View>

        {(student.parentContact || student.parentName) && (
            <View style={styles.emergencyStrip}>
                <Text style={styles.emergencyLabel}>EMERGENCY CONTACT:</Text>
                {student.parentContact && <Text style={styles.emergencyValue}>{student.parentContact}</Text>}
                {student.parentName && <Text style={styles.emergencyValue}> ({student.parentName})</Text>}
            </View>
        )}

        <View style={styles.cardFooter}>
            <Text style={styles.footerText}>{student.academicYear || 'Academic Year'}</Text>
            <Text style={styles.footerText}>
                Valid Until: <Text style={styles.footerAccent}>{student.validUntil || 'Mar 2027'}</Text>
            </Text>
            {student.schoolContact && <Text style={styles.footerText}>{student.schoolContact}</Text>}
        </View>
    </View>
);

export interface StudentIDCardPDFProps {
    students: StudentIDCardData[];
}

export const StudentIDCardPDF: React.FC<StudentIDCardPDFProps> = ({ students }) => {
    const rows: [StudentIDCardData, StudentIDCardData | null][] = [];
    for (let i = 0; i < students.length; i += 2) {
        rows.push([students[i], students[i + 1] || null]);
    }
    return (
        <Document title="Student ID Cards">
            <Page size="A4" style={styles.page}>
                {rows.map((pair, rowIdx) => (
                    <View key={rowIdx} style={styles.cardRow}>
                        <IDCard student={pair[0]} />
                        {pair[1] ? <IDCard student={pair[1]} /> : <View style={{ flex: 1 }} />}
                    </View>
                ))}
            </Page>
        </Document>
    );
};

export default StudentIDCardPDF;
