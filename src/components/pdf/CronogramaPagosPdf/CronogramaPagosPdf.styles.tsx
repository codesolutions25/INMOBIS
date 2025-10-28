import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottom: '1px solid #000'
    },
    logo: {
        width: 113,
        height: 40,
        marginRight: 15
    },
    companyInfo: {
        textAlign: 'right',
        marginLeft: 'auto',
        maxWidth: '60%'
    },
    companyName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2
    },
    companyDetails: {
        fontSize: 8,
        marginBottom: 1,
        color: '#4B5563'
    },
    header: {
        marginBottom: 10,
        paddingBottom: 5
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5
    },
    section: {
        marginBottom: 10,
        border: '1px solid #E5E7EB',
        borderRadius: 4,
        padding: 5
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        backgroundColor: '#F3F4F6',
        padding: 3,
        marginBottom: 5
    },
    row: {
        flexDirection: 'row',
        borderBottom: '1px solid #E5E7EB',
        padding: '3px 0'
    },
    cell: {
        flex: 1,
        padding: '2px 5px',
        fontSize: 9
    },
    headerCell: {
        flex: 1,
        padding: '3px 5px',
        fontWeight: 'bold',
        backgroundColor: '#F9FAFB',
        fontSize: 9
    },
    label: {
        fontWeight: 'bold'
    },
    textRight: {
        textAlign: 'right'
    },
    textCenter: {
        textAlign: 'center'
    },
    textBold: {
        fontWeight: 'bold'
    },
    totalRow: {
        borderTop: '1px solid #000',
        marginTop: 5,
        paddingTop: 5
    }
});