import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SubjectResultRow {
    subjectName: string;
    subjectCode?: string;
    marksObtainedTheory?: number;
    marksObtainedPractical?: number;
    totalMarks: number;
    maxMarks?: number;
    grade?: string;
    gradePoints?: number;
    remarks?: string;
    status?: 'present' | 'absent' | 'exempted';
}

export interface ReportCardExportData {
    schoolName?: string;
    schoolAddress?: string;
    schoolLogoUrl?: string;
    studentName: string;
    rollNumber?: string;
    admissionNumber?: string;
    className: string;
    sectionName?: string;
    academicYear?: string;
    examName: string;
    termName?: string;
    results: SubjectResultRow[];
    overallPercentage?: number;
    overallGrade?: string;
    overallStatus?: 'PASSED' | 'FAILED' | 'PROMOTED';
    classRank?: number;
    totalStudentsInClass?: number;
    attendancePercentage?: number;
    teacherRemarks?: string;
}

export const exportReportCardPDF = (data: ReportCardExportData) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── Header Banner ──────────────────────────────────────────────────────────
    doc.setFillColor(30, 58, 138); // Deep Royal Blue
    doc.rect(0, 0, pageW, 40, 'F');

    // School Name & Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const schoolTitle = data.schoolName || 'ACADEMIC INSTITUTION';
    doc.text(schoolTitle.toUpperCase(), pageW / 2, 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(224, 231, 255);
    if (data.schoolAddress) {
        doc.text(data.schoolAddress, pageW / 2, 23, { align: 'center' });
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(253, 224, 71); // Gold accent
    doc.text(`OFFICIAL STUDENT PROGRESS REPORT — ${data.examName.toUpperCase()}`, pageW / 2, 32, { align: 'center' });

    // ── Student Bio Information Box ────────────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, 45, pageW - 24, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    const col1X = 16;
    const col2X = 75;
    const col3X = 140;

    // Line 1
    doc.text('Student Name:', col1X, 53);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(data.studentName, col1X + 26, 53);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Roll No:', col2X, 53);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.rollNumber || '—', col2X + 16, 53);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Admission No:', col3X, 53);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.admissionNumber || '—', col3X + 26, 53);

    // Line 2
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Class & Sec:', col1X, 63);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const classDisplay = data.sectionName ? `${data.className} - ${data.sectionName}` : data.className;
    doc.text(classDisplay, col1X + 24, 63);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Academic Year:', col2X, 63);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.academicYear || '2025-2026', col2X + 28, 63);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Term:', col3X, 63);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.termName || 'Term 1', col3X + 12, 63);

    // Line 3 (Class Rank / Attendance if available)
    if (data.classRank) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Class Rank:', col1X, 72);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); // Green
        const rankStr = data.totalStudentsInClass ? `${data.classRank} of ${data.totalStudentsInClass}` : `${data.classRank}`;
        doc.text(rankStr, col1X + 22, 72);
    }

    if (data.attendancePercentage !== undefined) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Attendance:', col2X, 72);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${data.attendancePercentage}%`, col2X + 22, 72);
    }

    // ── Table of Marks ─────────────────────────────────────────────────────────
    const tableBody = data.results.map((r, idx) => {
        const isAbsent = r.status === 'absent';
        const max = r.maxMarks || 100;
        const marksStr = isAbsent ? 'ABSENT' : String(r.totalMarks);
        const theoryStr = r.marksObtainedTheory !== undefined ? String(r.marksObtainedTheory) : '—';
        const practicalStr = r.marksObtainedPractical !== undefined ? String(r.marksObtainedPractical) : '—';

        return [
            String(idx + 1),
            r.subjectName + (r.subjectCode ? ` (${r.subjectCode})` : ''),
            theoryStr,
            practicalStr,
            String(max),
            marksStr,
            r.grade || '—',
            r.gradePoints !== undefined ? String(r.gradePoints) : '—',
            r.remarks || ''
        ];
    });

    // Calculate totals
    const grandTotal = data.results.reduce((sum, r) => sum + (r.status === 'absent' ? 0 : r.totalMarks), 0);
    const maxGrandTotal = data.results.reduce((sum, r) => sum + (r.maxMarks || 100), 0);
    const pct = maxGrandTotal > 0 ? ((grandTotal / maxGrandTotal) * 100).toFixed(1) : '0.0';

    // Summary row
    tableBody.push([
        '',
        'GRAND TOTAL',
        '—',
        '—',
        String(maxGrandTotal),
        String(grandTotal),
        data.overallGrade || (parseFloat(pct) >= 90 ? 'A1' : parseFloat(pct) >= 80 ? 'A2' : parseFloat(pct) >= 70 ? 'B1' : parseFloat(pct) >= 60 ? 'B2' : parseFloat(pct) >= 50 ? 'C1' : parseFloat(pct) >= 35 ? 'D' : 'F'),
        '—',
        `Percentage: ${pct}%`
    ]);

    autoTable(doc, {
        startY: 82,
        head: [['#', 'Subject', 'Theory', 'Practical', 'Max', 'Marks', 'Grade', 'Points', 'Remarks']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 58, 138],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'center',
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
            valign: 'middle',
        },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 45 },
            2: { cellWidth: 16, halign: 'center' },
            3: { cellWidth: 16, halign: 'center' },
            4: { cellWidth: 14, halign: 'center' },
            5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
            6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
            7: { cellWidth: 14, halign: 'center' },
            8: { cellWidth: 'auto' },
        },
        didParseCell: (hookData) => {
            // Style the summary total row
            if (hookData.row.index === tableBody.length - 1) {
                hookData.cell.styles.fontStyle = 'bold';
                hookData.cell.styles.fillColor = [241, 245, 249];
                hookData.cell.styles.textColor = [30, 58, 138];
            }
        },
        margin: { left: 12, right: 12 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // ── Performance Overview Cards ─────────────────────────────────────────────
    const cardW = (pageW - 24 - 12) / 3;
    const cardH = 20;

    // Card 1: Total Marks & Percentage
    doc.setFillColor(238, 242, 255); // Indigo light
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(12, finalY, cardW, cardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(79, 70, 229);
    doc.text('TOTAL PERCENTAGE', 12 + cardW / 2, finalY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text(`${pct}% (${grandTotal}/${maxGrandTotal})`, 12 + cardW / 2, finalY + 15, { align: 'center' });

    // Card 2: Overall Grade
    const overallGrade = data.overallGrade || (parseFloat(pct) >= 90 ? 'A1' : parseFloat(pct) >= 80 ? 'A2' : parseFloat(pct) >= 70 ? 'B1' : parseFloat(pct) >= 60 ? 'B2' : parseFloat(pct) >= 50 ? 'C1' : parseFloat(pct) >= 35 ? 'D' : 'F');
    doc.setFillColor(240, 253, 244); // Green light
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(12 + cardW + 6, finalY, cardW, cardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text('OVERALL GRADE', 12 + cardW + 6 + cardW / 2, finalY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(21, 128, 61);
    doc.text(overallGrade, 12 + cardW + 6 + cardW / 2, finalY + 15, { align: 'center' });

    // Card 3: Final Result Status
    const isPass = parseFloat(pct) >= 35 && !data.results.some(r => (r.grade || '').toUpperCase() === 'F');
    if (isPass) {
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(167, 243, 208);
    } else {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
    }
    doc.roundedRect(12 + (cardW + 6) * 2, finalY, cardW, cardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    if (isPass) {
        doc.setTextColor(6, 95, 70);
    } else {
        doc.setTextColor(153, 27, 27);
    }
    doc.text('EXAM RESULT', 12 + (cardW + 6) * 2 + cardW / 2, finalY + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    if (isPass) {
        doc.setTextColor(5, 150, 105);
    } else {
        doc.setTextColor(220, 38, 38);
    }
    doc.text(isPass ? (parseFloat(pct) >= 75 ? 'PASSED (DISTINCTION)' : 'PASSED') : 'NEEDS IMPROVEMENT', 12 + (cardW + 6) * 2 + cardW / 2, finalY + 15, { align: 'center' });

    // ── Grading Legend ─────────────────────────────────────────────────────────
    const legendY = finalY + cardH + 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Grading Scale: A1 (91-100%) | A2 (81-90%) | B1 (71-80%) | B2 (61-70%) | C1 (51-60%) | C2 (41-50%) | D (35-40%) | F (Below 35%)', 12, legendY);

    // ── Signatures & Footer ───────────────────────────────────────────────────
    const sigY = pageH - 26;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, sigY, 55, sigY);
    doc.line(pageW / 2 - 20, sigY, pageW / 2 + 20, sigY);
    doc.line(pageW - 55, sigY, pageW - 14, sigY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Class Teacher', 34, sigY + 5, { align: 'center' });
    doc.text('Exam Coordinator', pageW / 2, sigY + 5, { align: 'center' });
    doc.text('Principal / Headmaster', pageW - 34, sigY + 5, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const dateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(`Generated securely via School Management System on ${dateStr}`, pageW / 2, pageH - 8, { align: 'center' });

    // Save File
    const sanitizedStudent = (data.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedExam = (data.examName || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Report_Card_${sanitizedStudent}_${sanitizedExam}.pdf`);
};
