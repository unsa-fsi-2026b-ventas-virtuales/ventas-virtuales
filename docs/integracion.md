# Integración y dependencias con otros módulos

Ventas Virtuales gestiona el pedido virtual y coordina su atención dentro del ERP. Los registros de ventas, caja, comprobantes e inventario pertenecen a sus módulos responsables.

## 1. Matriz de dependencias

| Módulo / responsable | Información que necesitamos | Información que proporcionamos |
|----------------------|-----------------------------|--------------------------------|
| Ventas Físicas | Criterios comunes para registrar ventas y diferenciar canales | Identificación de pedidos del canal virtual |
| Almacén | Artículos, unidades de medida y disponibilidad (`I1M_ARTICULO`) | Productos y cantidades solicitadas |
| Distribución | Cobertura de entrega y estado del envío | Pedido, dirección y datos para la entrega |
| Clientes | Identificación y datos del comprador (`I1M_CLIENTE`) | Referencia del cliente que realiza el pedido |
| Caja de Ingresos | Confirmación del pago | Referencia del pedido, importe y medio de pago |
| Comprobantes | Tipo y estado del comprobante | Datos de la operación confirmada y tipo solicitado (Boleta / Factura) |
| Tribu Financiera | Plan de cuentas y criterios contables | Información de las operaciones de venta |

## 2. Registros propios del módulo

| Tabla | Registro | Responsabilidad |
|-------|----------|-----------------|
| `I1T_PEDIDO` | Pedido virtual | Datos generales del pedido, importes y estado actual |
| `I1T_PEDIDO_DET` | Detalle de pedido | Artículos, cantidades y precios congelados |
| `I1T_PEDIDO_EST_HIS` | Historial de estado | Trazabilidad de cada cambio de estado |
| `I1T_REF_EXTERNA` | Referencia externa | IDs de los recursos de otros módulos vinculados al pedido |

## 3. Cómo se registra la integración

- La comunicación entre módulos es por **API REST con JSON** (regla RE_RefIntegra).
- Ventas Virtuales **no copia** tablas de otros módulos: guarda el identificador del recurso externo en `I1T_REF_EXTERNA` con su tipo:

| `RefTip` | Módulo | Qué se guarda en `RefExt` |
|----------|--------|---------------------------|
| `RESERVA_ALM` | Almacén | ID de la reserva de stock |
| `PAGO_CAJA` | Caja de Ingresos | ID del pago confirmado |
| `COMPROBANTE` | Comprobantes | ID del comprobante emitido |
| `ENVIO_DIST` | Distribución | ID del envío |
| `ASIENTO_FIN` | Tribu Financiera | ID del asiento contable |

- Los cambios de estado informados por otro módulo entran por `POST /api/pedidos/{id}/estados/` y quedan en `I1T_PEDIDO_EST_HIS` con el actor que los informó (`HisRegAct`).

## 4. Acuerdos pendientes

- [ ] Qué módulo mantiene los datos de clientes y artículos.
- [ ] Cómo se consulta la disponibilidad de productos.
- [ ] Quién registra y confirma los pagos.
- [ ] Quién genera los comprobantes y el Registro de Ventas.
- [ ] Qué información recibe Distribución.
- [x] Formato de intercambio: API REST con JSON; referencias en `I1T_REF_EXTERNA`.
- [ ] Identificadores comunes entre módulos (formato de `CliCod`, `ArtCod` y de los IDs externos).
- [x] Tablas SUNAT que usa directamente el módulo: Tablas 1, 2, 4, 6 y 10 (ver [`arquitectura.md`](arquitectura.md) §6).

Los acuerdos se registran en `docs/actas/` y, una vez cerrados, se reflejan en [`arquitectura.md`](arquitectura.md).
