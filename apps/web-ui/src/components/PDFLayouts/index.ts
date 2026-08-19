// PDF Layout Components
export { default as AttendanceReportPDF } from './AttendanceReportPDF';
export { default as AdmitCardPDF } from './AdmitCardPDF';
export type { AdmitCardPDFProps } from './AdmitCardPDF';
export { StudentIDCardPDF } from './StudentIDCardPDF';
export type { StudentIDCardData, StudentIDCardPDFProps } from './StudentIDCardPDF';
export { TransferCertificatePDF } from './TransferCertificatePDF';
export type { TransferCertificateData } from './TransferCertificatePDF';

// Shared Components
export { default as PDFHeader } from './shared/PDFHeader';
export { default as PDFFooter, PageNumber } from './shared/PDFFooter';
export { pdfStyles, getStatusStyle } from './shared/PDFStyles';
