# Alcance del módulo y consultas al docente

## 1. Descripción
El módulo de Ventas Virtuales gestiona las operaciones comerciales realizadas por canales digitales: los clientes consultan los productos disponibles, seleccionan artículos y registran sus pedidos. Forma parte de la **Tribu Ingresos** y coordina sus operaciones con los módulos de inventario, pagos, distribución y registros contables, **sin reimplementar sus funciones**.

## 2. Alcance funcional propuesto

| Funcionalidad | Descripción |
|---------------|-------------|
| Consulta de productos | Visualizar los artículos disponibles para la venta |
| Carrito de compras | Seleccionar artículos y modificar cantidades |
| Registro de pedidos | Almacenar la información de la compra solicitada |
| Identificación del cliente | Asociar cada pedido con los datos del comprador |
| Cálculo de importes | Calcular subtotales e importe total |
| Consulta de pedidos | Revisar los pedidos registrados |
| Seguimiento del pedido | Consultar el estado de atención de cada pedido |
| Integración | Compartir información con pago, almacén, distribución y contabilidad |

## 3. Producto Mínimo Viable (MVP)
1. Visualización de artículos disponibles.
2. Selección de productos mediante carrito.
3. Registro de pedidos con su detalle.
4. Asociación del pedido con un cliente.
5. Cálculo del importe total.
6. Consulta de pedidos registrados.
7. Coordinación básica con Almacén y módulos relacionados.

**No incluido en el MVP:** pasarelas bancarias reales, promociones avanzadas, sistemas de recomendación y funcionalidades complejas de comercio electrónico.

## 4. Comparación con ERP de referencia

| Aspecto | SAP Business One | Odoo | Nuestra propuesta |
|---------|------------------|------|-------------------|
| Gestión de ventas | Documentos y procesos comerciales | Aplicaciones de ventas | Registrar y consultar pedidos virtuales |
| Catálogo de artículos | Gestión de artículos | Gestión de productos | Consultar artículos del ERP |
| Clientes | Socios de negocio | Contactos y clientes | Usar datos compartidos de clientes |
| Inventario | Integración ventas–inventario | Integración mediante aplicaciones | Consultar disponibilidad con Almacén |
| Pagos | Procesos financieros | Diversos métodos de pago | Coordinar la confirmación del pago |
| Distribución | Procesos de entrega | Pedidos y entregas | Consultar el estado de distribución |

> Comparación orientativa; se complementará con la documentación oficial de cada sistema.

## 5. Consultas al docente

**Sobre el alcance**
- ¿El módulo debe limitarse al registro y seguimiento de pedidos o también completar el proceso de venta?
- ¿Se desarrolla una tienda virtual para clientes o una interfaz interna para registrar pedidos por internet?
- ¿Solo productos físicos o también servicios y software?
- ¿Qué funcionalidades son indispensables para la primera versión?

**Sobre la integración**
- ¿Quién administra la información de clientes y artículos?
- ¿Cómo se coordina la disponibilidad y reserva de productos con Almacén?
- ¿Qué información se entrega a Distribución?
- ¿Qué módulo confirma los pagos y registra en Caja de Ingresos?
- ¿Quién genera los comprobantes y el Registro de Ventas?
- ¿Ventas Físicas y Ventas Virtuales comparten una estructura común?

**Sobre tablas y arquitectura**
- ¿Qué criterio usar para marcar las tablas como X o COMPARTIDO en el Excel?
- ¿Se marcan las tablas SUNAT usadas indirectamente mediante otros módulos?
- ¿Qué registros transaccionales son específicos de Ventas Virtuales?
- ¿Cómo se usan las cuentas del plan de cuentas de la Tribu Financiera?
- ¿Qué mecanismos de intercambio de información se usarán entre módulos?
