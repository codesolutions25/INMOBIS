import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Cuota } from "@/services/apiCuotas";
// Note: This PDF component now relies entirely on props; no local state/effects needed

const styles = StyleSheet.create({
  page: {
    padding: 20,
    paddingBottom: 30,
    fontSize: 8,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1px solid #eee',
    paddingTop: 5,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 3,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    height: 30,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 25,
    alignItems: 'center',
  },
  tableCell: {
    padding: '4px 5px',
    fontSize: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    textAlign: 'center',
    flex: 1,
    minWidth: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 7,
    borderBottom: '1px solid #000',
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rowText: {
    fontSize: 8,
  },
});

interface VentaInfo {
  id_venta: number;
  total: string;
  fecha_emision: string;
  serie: string;
  correlativo: string;
  id_estado_venta: number;
}

interface HistorialPagosPDFProps {
  cuotas: Cuota[];
  lote: string;
  cliente?: string;
  proyecto?: string;
  reserva?: any;
  ventasInfo: Record<number, VentaInfo>;
  moraCalculada: Record<number, MoraCalculada>;
  canceledStatusId: number | null;
  pendingStatusId: number | null;
}

interface MoraCalculada {
  montoMora: number;
  montoTotal: number;
  diasMora: number;
}

export const HistorialPagosPDF = ({ cuotas, lote, cliente = 'Cliente no disponible', proyecto = 'Proyecto no disponible', reserva, ventasInfo, moraCalculada, canceledStatusId, pendingStatusId }: HistorialPagosPDFProps) => {

  const formatCurrency = (value: number | string | undefined) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `S/ ${numValue?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE');
  };

  const getEstadoText = (estado: number | undefined) => {
    if (estado === canceledStatusId) return 'Pagado';
    if (estado === pendingStatusId) return 'Pendiente';
    return 'Pendiente';
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Historial de Pagos</Text>
            <Text style={styles.subtitle}>{cliente}</Text>
            <Text style={styles.subtitle}>Lote: {lote} - Proyecto: {proyecto}</Text>
          </View>
          
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 0.5 }]}>N°</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.2 }]}>Concepto</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Saldo Capital</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Amortización</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 0.8 }]}>Interés</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Monto</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Fecha Pago</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 0.8 }]}>Estado</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 0.8 }]}>Mora</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Total</Text>
            </View>
            
            {/* Table Rows */}
            {cuotas
              .filter(cuota => {
                const idEstado = (cuota as any).id_estado_plan_pago ?? (cuota as any).idEstadoPlanPago;
                return !pendingStatusId || idEstado !== pendingStatusId;
              })
              .sort((a: any, b: any) => (a.numeroCuota || 0) - (b.numeroCuota || 0))
              .map((cuota: any) => (
                <View key={cuota.idCuota} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.5, textAlign: 'center' }]}>{cuota.numeroCuota === 0 ? 'Ini' : cuota.numeroCuota}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'left', paddingLeft: 8 }]}>
                    {cuota.numeroCuota === 0 ? 'Cuota Inicial' : `Cuota ${cuota.numeroCuota}`}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                    {formatCurrency((cuota as any).saldo_capital ?? (cuota as any).saldoCapital ?? 0)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                    {formatCurrency((cuota as any).monto_amortizacion ?? (cuota as any).montoAmortizacion ?? 0)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'right' }]}>
                    {formatCurrency((cuota as any).monto_interes ?? (cuota as any).montoInteres ?? 0)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                    {formatCurrency((cuota as any).monto_total_cuota ?? (cuota as any).montoTotalCuota ?? 0)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                    {ventasInfo[cuota.idCuota]?.fecha_emision
                      ? new Date(ventasInfo[cuota.idCuota].fecha_emision).toLocaleString('es-PE', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, { 
                    flex: 0.8, 
                    color: ventasInfo[cuota.idCuota]?.id_estado_venta === 1 ? '#059669' : '#dc2626',
                    textAlign: 'center'
                  }]}>
                    {ventasInfo[cuota.idCuota]?.id_estado_venta === 1 ? 'Pagado' : 'Pendiente'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'right' }]}>
                    {moraCalculada[cuota.idCuota]?.montoMora ? formatCurrency(moraCalculada[cuota.idCuota].montoMora) : formatCurrency(0)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold', textAlign: 'right' }]}>
                    {moraCalculada[cuota.idCuota]?.montoTotal 
                      ? formatCurrency(moraCalculada[cuota.idCuota].montoTotal) 
                      : formatCurrency((cuota as any).monto_total_cuota ?? (cuota as any).montoTotalCuota ?? 0)}
                  </Text>
                </View>
              ))}
          </View>
        </View>
        
        <View style={styles.footer} fixed>
          <Text>Generado el {new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</Text>
        </View>
      </Page>
    </Document>
  );
};
