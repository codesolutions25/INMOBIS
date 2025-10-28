import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { styles } from './CronogramaPagosPdf.styles';
import { formatNumber, formatCurrency } from '@/utils/decimalUtils';
import { PlanPago } from '../../../modules/atencioncliente/components/planPagoConfig';
import { Proyecto } from '@/types/proyectos';
import { Propiedad } from '@/types/propiedades';
import { Persona } from '@/types/persona';

interface CuotaCalculada {
  numero: number;
  fechaVencimiento: Date;
  saldoCapital: number;
  amortizacion: number;
  interes: number;
  montoCuota: number;
  dias: number;
}

interface CronogramaPagosPdfProps {
  planPago: PlanPago;
  cliente?: Persona;
  clienteNombre?: string;
  proyecto: Proyecto | null;
  propiedad: Propiedad | null;
  precioBase: number;
  codigoContrato: string;
  cuotas: CuotaCalculada[];
  montoTotal: number;
}

export const CronogramaPagosPdf: React.FC<CronogramaPagosPdfProps> = ({
  planPago,
  cliente,
  clienteNombre,
  proyecto,
  propiedad,
  precioBase,
  codigoContrato,
  cuotas,
  montoTotal
}) => {
  // Generar nombre completo del cliente
  const obtenerNombreCompleto = () => {
    if (cliente) {
      const { nombre, apellidoPaterno, apellidoMaterno } = cliente;
      return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
    }
    return clienteNombre || 'Cliente no especificado';
  };

  // Obtener fecha actual formateada
  const fechaEmision = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Obtener frecuencia de pago
  const obtenerFrecuenciaPago = () => {
    return planPago.frecuencia || 'Mensual';
  };

  return (
    <Document>
        <Page size="A4" style={styles.page}>
            
            <View style={styles.header}>
                <Text style={styles.title}>CRONOGRAMA DE PAGOS</Text>
            </View>

            {/* Información del contrato */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>INFORMACIÓN DEL CONTRATO</Text>
                <View style={styles.row}>
                    <Text style={[styles.cell, { flex: 2 }]}>
                        <Text style={styles.label}>Nombre del Cliente:</Text> {obtenerNombreCompleto()}
                    </Text>
                    <Text style={[styles.cell, { flex: 1 }]}>
                        <Text style={styles.label}>Código del Contrato:</Text> {codigoContrato}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={[styles.cell, { flex: 2 }]}>
                        <Text style={styles.label}>Frecuencia de Pago:</Text> {obtenerFrecuenciaPago()}
                    </Text>
                    <Text style={[styles.cell, { flex: 1 }]}>
                        <Text style={styles.label}>Fecha de Emisión:</Text> {fechaEmision}
                    </Text>
                </View>
            </View>

            {/* Proyecto y Propiedad */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DETALLES DEL PROYECTO Y PROPIEDAD</Text>
                <View style={styles.row}>
                    <Text style={[styles.cell, { flex: 2 }]}>
                        <Text style={styles.label}>Proyecto:</Text> {proyecto?.nombre || 'No especificado'}
                    </Text>
                    <Text style={[styles.cell, { flex: 1 }]}>
                        <Text style={styles.label}>Propiedad:</Text> {propiedad?.nombre || propiedad?.descripcion || 'No especificada'}
                    </Text>
                </View>
            </View>

            {/* Información Financiera */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>INFORMACIÓN FINANCIERA</Text>
                <View style={styles.row}>
                    <Text style={styles.cell}>
                        <Text style={styles.label}>Precio Base:</Text> S/ {precioBase.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.cell}>
                        <Text style={styles.label}>Valor Mínimo:</Text> S/ {(planPago.valorMinimo || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.cell}>
                        <Text style={styles.label}>Interés Anual:</Text> {planPago.interes || 0}%
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.cell}>
                        <Text style={styles.label}>Monto Total:</Text> S/ {montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.cell}>
                        <Text style={styles.label}>Número de Cuotas:</Text> {planPago.numeroCuota}
                    </Text>
                    <Text style={styles.cell}>
                        <Text style={styles.label}>Plan de Pago:</Text> {planPago.planPago}
                    </Text>
                </View>
            </View>

            {/* Cronograma */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>CRONOGRAMA DE CUOTAS</Text>

                <View style={[styles.row, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.headerCell, { flex: 0.6 }]}>N°</Text>
                    <Text style={[styles.headerCell, { flex: 1.2 }]}>Fecha Vencimiento</Text>
                    <Text style={[styles.headerCell, styles.textRight, { flex: 1.3 }]}>Saldo Capital (S/)</Text>
                    <Text style={[styles.headerCell, styles.textRight, { flex: 1.3 }]}>Amortización (S/)</Text>
                    <Text style={[styles.headerCell, styles.textRight, { flex: 1.1 }]}>Interés (S/)</Text>
                    <Text style={[styles.headerCell, styles.textRight, { flex: 1.3 }]}>Monto Cuota (S/)</Text>
                    <Text style={[styles.headerCell, styles.textCenter, { flex: 0.6 }]}>Días</Text>
                </View>

                {cuotas.map((cuota, index) => (
                    <View key={index} style={styles.row}>
                        <Text style={[styles.cell, styles.textCenter, { flex: 0.6 }]}>
                            {cuota.numero.toString().padStart(3, '0')}
                        </Text>
                        <Text style={[styles.cell, styles.textCenter, { flex: 1.2 }]}>
                            {cuota.fechaVencimiento.toLocaleDateString('es-PE')}
                        </Text>
                        <Text style={[styles.cell, styles.textRight, { flex: 1.3 }]}>
                            {cuota.saldoCapital.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.cell, styles.textRight, { flex: 1.3 }]}>
                            {cuota.amortizacion.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.cell, styles.textRight, { flex: 1.1 }]}>
                            {cuota.interes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.cell, styles.textRight, styles.textBold, { flex: 1.3 }]}>
                            {cuota.montoCuota.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.cell, styles.textCenter, { flex: 0.6 }]}>
                            {cuota.dias}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#6B7280' }}>
                <Text>Documento generado el {new Date().toLocaleDateString('es-PE')}</Text>
            </View>
        </Page>
    </Document>
  );
};
