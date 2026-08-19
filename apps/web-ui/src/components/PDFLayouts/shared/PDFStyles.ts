import { StyleSheet } from '@react-pdf/renderer';

// Shared PDF styles
export const pdfStyles = StyleSheet.create({
    // Page
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#1976D2',
    },
    headerLeft: {
        flexDirection: 'column',
    },
    logo: {
        width: 50,
        height: 50,
        marginBottom: 5,
    },
    schoolName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    reportTitle: {
        fontSize: 14,
        marginTop: 5,
        color: '#333',
    },
    headerRight: {
        textAlign: 'right',
    },
    dateText: {
        fontSize: 10,
        color: '#666',
    },

    // Table
    table: {
        display: 'flex',
        width: '100%',
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1976D2',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tableHeaderCell: {
        padding: 8,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    tableCell: {
        padding: 6,
        fontSize: 9,
        textAlign: 'center',
    },

    // Status chips
    statusPresent: {
        backgroundColor: '#4CAF50',
        color: '#fff',
        padding: 4,
        borderRadius: 2,
        fontSize: 8,
    },
    statusAbsent: {
        backgroundColor: '#F44336',
        color: '#fff',
        padding: 4,
        borderRadius: 2,
        fontSize: 8,
    },
    statusLate: {
        backgroundColor: '#FF9800',
        color: '#fff',
        padding: 4,
        borderRadius: 2,
        fontSize: 8,
    },
    statusLeave: {
        backgroundColor: '#9E9E9E',
        color: '#fff',
        padding: 4,
        borderRadius: 2,
        fontSize: 8,
    },

    // Summary section
    summary: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 5,
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryLabel: {
        fontSize: 10,
        color: '#666',
    },
    summaryValue: {
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: '#999',
    },
    pageNumber: {
        fontSize: 8,
        color: '#999',
    },
});

// Color helpers
export const getStatusStyle = (status: string) => {
    switch (status) {
        case 'present':
            return pdfStyles.statusPresent;
        case 'absent':
            return pdfStyles.statusAbsent;
        case 'late':
            return pdfStyles.statusLate;
        case 'leave':
        case 'half_day':
            return pdfStyles.statusLeave;
        default:
            return pdfStyles.statusPresent;
    }
};
