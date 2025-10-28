export interface DetalleVenta {
  id_detalle_venta?: number;
  id_venta: number;
  id_tipo_item_venta: number;
  item_id: number;
  plan_pago_cuota_id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  igv: number;
  total: number;
  created_at?: string;
  updated_at?: string;
}

export interface DetalleVentaResponse {
  data: DetalleVenta | DetalleVenta[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
