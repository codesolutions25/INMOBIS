import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontSize: 8,
    fontFamily: 'Helvetica',
    position: 'relative',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottom: '1px solid #000',
    paddingBottom: 3,
    width: '100%',
  },
  logoSection: {
    width: '25%',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 'auto',
    marginBottom: 3,
  },
  titleSection: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 8,
    marginBottom: 2,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
    textDecoration: 'underline',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  infoBlock: {
    width: '48%',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 8,
  },
  infoLabel: {
    width: '40%',
    fontWeight: 'bold',
  },
  infoValue: {
    width: '60%',
  },
  table: {
    width: '100%',
    marginTop: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #d1d5db',
    paddingVertical: 2,
  },
  tableCell: {
    padding: 1,
    fontSize: 7,
    borderRight: '1px solid #000',
    flex: 1,
  },
  tableCellTiny: {
    width: '8%',
    textAlign: 'center',
  },
  tableCellSmall: {
    width: '14%',
    textAlign: 'right',
  },
  tableCellMedium: {
    width: '20%',
  },
  totalSection: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  totalBox: {
    width: '50%',
    border: '1px solid #e5e7eb',
    padding: 3,
    borderRadius: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    fontSize: 8,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 8,
  },
  terms: {
    fontSize: 6,
    textAlign: 'center',
    padding: 3,
    borderTop: '1px solid #e5e7eb',
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    right: 15,
    paddingTop: 5,
    borderTop: '1px solid #e5e7eb',
  },
  emptySpace: {
    borderTop: '1px solid #000',
    width: 150,
    marginBottom: 5,
  },
});

interface ReciboPagoPDFProps {
  pago: {
    id?: string | number;
    nroItem: number;
    montoPagar: number;
    mora: number;
    totalPagar: number;
    concepto?: string;
  };
  cliente: string;
  proyecto: string;
  propiedad: string;
  lote: string;
  montoEntregado: number;
  tipoOperacion: string;
  numeroOperacion: string;
  vuelto?: number;
  empresa?: {
    razonSocial: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email: string;
    logoUrl?: string;
  };
}

export const ReciboPagoPDF = ({
  pago,
  cliente,
  proyecto,
  propiedad,
  lote,
  montoEntregado,
  tipoOperacion,
  numeroOperacion,
  vuelto = 0,
  empresa = {
    razonSocial: 'INMOBILIARIA',
    ruc: 'RUC: 20123456789',
    direccion: 'Av. Principal 123 - Lima',
    telefono: 'Teléfono: (01) 123-4567',
    email: 'Email: contacto@inmobiliaria.com',
    logoUrl: '/logo2.png'
  },
}: ReciboPagoPDFProps) => {
  const fechaPago = new Date();
  
  // Debug logs
 
  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={{ minHeight: '100%', paddingBottom: 60, position: 'relative' }}>
        {/* Header with Logo and Company Info */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {empresa.logoUrl && (
              <Image src={empresa.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.subtitle}>{empresa.ruc}</Text>
          </View>
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>{empresa.razonSocial}</Text>
            <Text style={styles.subtitle}>{empresa.direccion}</Text>
            <Text style={styles.subtitle}>{empresa.telefono}</Text>
            <Text style={styles.subtitle}>{empresa.email}</Text>
          </View>
          
          <View style={styles.logoSection}>
            <Text style={styles.subtitle}>RECIBO DE PAGO</Text>
            <Text style={styles.subtitle}>R001 - {pago.id || '0001'}</Text>
            
          </View>
        </View>

        {/* Receipt Title */}
        <Text style={styles.receiptTitle}>RECIBO DE PAGO</Text>

        {/* Client and Property Info */}
        <View >
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Señor(es):</Text>
              <Text style={styles.infoValue}>{cliente}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección:</Text>
              <Text style={styles.infoValue}>{propiedad || 'No especificado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>RUC/DNI:</Text>
              <Text style={styles.infoValue}>{/* Add DNI/RUC if available */}12345678</Text>
            </View>
          </View>
          
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Proyecto:</Text>
              <Text style={styles.infoValue}>{proyecto}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lote:</Text>
              <Text style={styles.infoValue}>{lote || 'No especificado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de Emisión:</Text>
              <Text style={styles.infoValue}>{formatDate(fechaPago)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Details Table */}
        <View style={[styles.table, { marginTop: 5 }]}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableCellTiny]}>N° Cuota</Text>
            <Text style={[styles.tableCell, styles.tableCellMedium]}>Concepto</Text>
            <Text style={[styles.tableCell, styles.tableCellSmall]}>Saldo Capital</Text>
            <Text style={[styles.tableCell, styles.tableCellSmall]}>Amortización</Text>
            <Text style={[styles.tableCell, styles.tableCellSmall]}>Interés</Text>
            <Text style={[styles.tableCell, styles.tableCellSmall]}>Mora</Text>
            <Text style={[styles.tableCell, styles.tableCellSmall]}>Total a Pagar</Text>
          </View>
          
          {/* Table Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableCellTiny, { textAlign: 'center' }]}>
              {pago.nroItem === 0 ? 'Inicial' : pago.nroItem}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellMedium]}>
              {pago.nroItem === 0 ? 'Cuota Inicial' : `Cuota ${pago.nroItem}`}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellSmall, { textAlign: 'right' }]}>
              {formatCurrency(pago.montoPagar - pago.mora)}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellSmall, { textAlign: 'right' }]}>
              {formatCurrency(pago.montoPagar * 0.7)}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellSmall, { textAlign: 'right' }]}>
              {formatCurrency(pago.montoPagar * 0.3)}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellSmall, { 
              textAlign: 'right',
              color: pago.mora > 0 ? '#dc2626' : 'inherit'
            }]}>
              {pago.mora > 0 ? formatCurrency(pago.mora) : formatCurrency(0)}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellSmall, { 
              textAlign: 'right',
              fontWeight: 'bold'
            }]}>
              {formatCurrency(pago.totalPagar)}
            </Text>
          </View>
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={[styles.totalBox, { textAlign: 'right' }]}>
            <View style={[styles.totalRow, { justifyContent: 'flex-end' }]}>
              <Text style={[styles.totalLabel, { marginRight: 10, fontSize: 10 }]}>TOTAL</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{formatCurrency(pago.totalPagar)}</Text>
            </View>
          </View>
        </View>

          </View>
          
        {/* Fixed Footer with Terms and Conditions */}
        <View style={styles.footer}>
          <Text style={styles.terms}>
            * El presente comprobante de pago se encuentra sujeto a los términos y condiciones establecidos en el contrato de compraventa.
            Cualquier reclamo o consulta deberá realizarse dentro de los 10 días hábiles posteriores a la emisión del presente recibo.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReciboPagoPDF;
