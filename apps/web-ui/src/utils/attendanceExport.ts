import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface AttendanceRecord {
    date: string;
    status: string;
    remarks?: string;
}

export interface AttendanceSummaryData {
    total: number;
    present: number;
    absent: number;
    late: number;
    halfDay?: number;
    leave?: number;
    percentage: string | number;
}

export interface AttendanceExportMeta {
    studentName: string;
    className?: string;
    sectionName?: string;
    rollNumber?: string;
    schoolName?: string;
    dateRangeLabel: string;
}

const STATUS_LABELS: Record<string, string> = {
    present: 'Present', absent: 'Absent', late: 'Late', half_day: 'Half Day', leave: 'Leave',
};

export const exportAttendancePDF = (records: AttendanceRecord[], summary: AttendanceSummaryData, meta: AttendanceExportMeta) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (meta.schoolName) doc.text(meta.schoolName, 14, 23);
    doc.text('Generated: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 14, 30);
    doc.setTextColor(30, 30, 30);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 40, pageW, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text(meta.studentName, 14, 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const infoLine = [meta.className && ('Class: ' + meta.className), meta.sectionName && ('Section: ' + meta.sectionName), meta.rollNumber && ('Roll No: ' + meta.rollNumber), 'Period: ' + meta.dateRangeLabel].filter(Boolean).join('   |   ');
    doc.text(infoLine, 14, 61);
    const pct = parseFloat(String(summary.percentage));
    const pctColor: [number, number, number] = pct >= 90 ? [22, 163, 74] : pct >= 75 ? [234, 179, 8] : [220, 38, 38];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text('Attendance Summary', 14, 80);
    doc.setFillColor(pctColor[0], pctColor[1], pctColor[2]);
    doc.roundedRect(pageW - 50, 72, 36, 14, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(summary.percentage + '%', pageW - 32, 81, { align: 'center' });
    autoTable(doc, {
        startY: 84,
        head: [['Total Days', 'Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Attendance %']],
        body: [[String(summary.total), String(summary.present), String(summary.absent), String(summary.late), String(summary.halfDay ?? 0), String(summary.leave ?? 0), summary.percentage + '%']],
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { textColor: [30, 30, 30], fontSize: 10, fontStyle: 'bold', halign: 'center' },
        margin: { left: 14, right: 14 },
    });
    const barY: number = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Attendance Rate', 14, barY + 4);
    doc.setFillColor(226, 232, 240);
    doc.rect(14, barY + 6, pageW - 28, 5, 'F');
    doc.setFillColor(pctColor[0], pctColor[1], pctColor[2]);
    doc.rect(14, barY + 6, (pageW - 28) * (Math.min(pct, 100) / 100), 5, 'F');
    const tableStartY = barY + 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text('Day-wise Attendance Detail', 14, tableStartY);
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    autoTable(doc, {
        startY: tableStartY + 4,
        head: [['#', 'Date', 'Day', 'Status', 'Remarks']],
        body: sorted.map((r, i) => {
            const d = new Date(r.date);
            return [String(i + 1), d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), d.toLocaleDateString('en-IN', { weekday: 'long' }), STATUS_LABELS[r.status] || r.status, r.remarks || '-'];
        }),
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { textColor: [30, 30, 30], fontSize: 9 },
        columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 32 }, 2: { cellWidth: 28 }, 3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
    });
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Page ' + i + ' of ' + pageCount + '  |  ' + meta.studentName + ' — Attendance Report — ' + meta.dateRangeLabel, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
    }
    doc.save('Attendance_' + meta.studentName.replace(/\s+/g, '_') + '_' + meta.dateRangeLabel.replace(/\s+/g, '_') + '.pdf');
};

export const exportAttendanceExcel = async (records: AttendanceRecord[], summary: AttendanceSummaryData, meta: AttendanceExportMeta) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SMS System';
    workbook.created = new Date();
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [{ header: 'Field', key: 'field', width: 22 }, { header: 'Value', key: 'value', width: 18 }];
    const headerStyle: Partial<ExcelJS.Style> = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
    ['A1', 'B1'].forEach((cell) => { summarySheet.getCell(cell).style = headerStyle; });
    const infoRows: [string, string | number][] = [['Student Name', meta.studentName], ['Class', meta.className || '-'], ['Section', meta.sectionName || '-'], ['Roll Number', meta.rollNumber || '-'], ['Period', meta.dateRangeLabel], ['School', meta.schoolName || '-'], ['Generated On', new Date().toLocaleDateString('en-IN')], ['', ''], ['Total Days', summary.total], ['Present', summary.present], ['Absent', summary.absent], ['Late', summary.late], ['Half Day', summary.halfDay ?? 0], ['Leave', summary.leave ?? 0], ['Attendance %', summary.percentage + '%']];
    infoRows.forEach(([field, value]) => { summarySheet.addRow({ field, value }); });
    const detailSheet = workbook.addWorksheet('Day-wise Report');
    detailSheet.columns = [{ header: '#', key: 'index', width: 6 }, { header: 'Date', key: 'date', width: 18 }, { header: 'Day', key: 'day', width: 14 }, { header: 'Status', key: 'status', width: 14 }, { header: 'Remarks', key: 'remarks', width: 35 }];
    detailSheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
    const statusColors: Record<string, { bg: string; fg: string }> = { present: { bg: 'FFDCFCE7', fg: 'FF15803D' }, absent: { bg: 'FFFEE2E2', fg: 'FFB91C1C' }, late: { bg: 'FFFEF9C3', fg: 'FF854D0E' }, half_day: { bg: 'FFDBEAFE', fg: 'FF1E40AF' }, leave: { bg: 'FFF1F5F9', fg: 'FF475569' } };
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach((record, i) => {
        const d = new Date(record.date);
        const row = detailSheet.addRow({ index: i + 1, date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), day: d.toLocaleDateString('en-IN', { weekday: 'long' }), status: STATUS_LABELS[record.status] || record.status, remarks: record.remarks || '-' });
        const rowBg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
        row.eachCell((cell) => { cell.style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }, alignment: { vertical: 'middle' } }; });
        const statusCell = row.getCell(4);
        const colors = statusColors[record.status];
        if (colors) { statusCell.style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } }, font: { bold: true, color: { argb: colors.fg } }, alignment: { horizontal: 'center', vertical: 'middle' } }; }
        row.height = 18;
    });
    detailSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sorted.length + 1, column: 5 } };
    detailSheet.views = [{ state: 'frozen', ySplit: 1 }];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Attendance_' + meta.studentName.replace(/\s+/g, '_') + '_' + meta.dateRangeLabel.replace(/\s+/g, '_') + '.xlsx');
};
