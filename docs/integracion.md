# Integración y dependencias con otros módulos

Ventas Virtuales gestiona el pedido virtual y coordina su atención dentro del ERP. Los registros de ventas, caja, comprobantes e inventario pertenecen a sus módulos responsables.

## 1. Matriz de dependencias

| Módulo / responsable | Información que necesitamos | Información que proporcionamos |
|----------------------|-----------------------------|--------------------------------|
| Ventas Físicas | Criterios comunes para registrar ventas y diferenciar canales | Identificación de pedidos del canal virtual |
| Almacén | Artículos, unidades de medida y disponibilidad | Productos y cantidades solicitadas |
| Distribución | Cobertura de entrega y estado del envío | Pedido, dirección y datos para la entrega |
| Clientes | Identificación y datos del comprador | Referencia del cliente que realiza el pedido |
| Caja de Ingresos | Confirmación del pago | Referencia del pedido, importe y medio de pago |
| Comprobantes | Tipo y estado del comprobante | Datos de la operación confirmada |
| Tribu Financiera | Plan de cuentas y criterios contables | Información de las operaciones de venta |

## 2. Registros propios del módulo

| Registro propuesto | Responsabilidad |
|--------------------|-----------------|
| Pedido de venta virtual | Datos generales del pedido |
| Detalle de pedido | Artículos, cantidades y precios |
| Estado del pedido | Seguimiento de la operación |

## 3. Acuerdos pendientes

- [ ] Qué módulo mantiene los datos de clientes y artículos.
- [ ] Cómo se consulta la disponibilidad de productos.
- [ ] Quién registra y confirma los pagos.
- [ ] Quién genera los comprobantes y el Registro de Ventas.
- [ ] Qué información recibe Distribución.
- [ ] Formato de intercambio e identificadores comunes entre módulos.
- [ ] Tablas SUNAT que usa directamente el módulo.

Los acuerdos se registran en `docs/actas/` y, una vez cerrados, se reflejan en [`arquitectura.md`](arquitectura.md).
