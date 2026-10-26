# Arquitectura

Propuesta de arquitectura del módulo de Ventas Virtuales. Está sujeta a los estándares que se definan para todo el ERP y a los acuerdos con los demás módulos.

## 1. Contexto del módulo dentro del ERP

Ventas Virtuales **gestiona el pedido virtual y coordina su atención**; no reimplementa inventario, cobros, comprobantes ni distribución.

```mermaid
flowchart TB
    subgraph TI["Tribu Ingresos"]
        VV["<b>Ventas Virtuales</b><br/>pedidos por canal digital"]
        VF[Ventas Físicas]
        CAJ[Caja de Ingresos]
        COM[Comprobantes]
    end
    ALM[Almacén]
    CLI[Clientes]
    DIS[Distribución]
    FIN[Tribu Financiera]

    ALM -- "artículos, unidades,<br/>disponibilidad" --> VV
    VV -- "productos y cantidades<br/>solicitadas" --> ALM
    CLI -- "datos del comprador" --> VV
    VV -- "pedido, importe,<br/>medio de pago" --> CAJ
    CAJ -- "confirmación de pago" --> VV
    VV -- "operación confirmada" --> COM
    COM -- "tipo y estado<br/>del comprobante" --> VV
    VV -- "pedido y dirección" --> DIS
    DIS -- "estado del envío" --> VV
    VF <-- "criterios comunes,<br/>canal de venta" --> VV
    VV -. "operaciones de venta" .-> FIN
    FIN -. "plan de cuentas" .-> VV
```

## 2. Arquitectura por capas

```mermaid
flowchart TB
    subgraph P["Presentación · frontend/"]
        direction LR
        P1[Catálogo] --- P2[Carrito] --- P3[Registro de pedido] --- P4[Consulta / Seguimiento]
    end
    subgraph S["Servicios de cliente"]
        AX["Axios · cliente HTTP<br/>tipos TypeScript compartidos"]
    end
    subgraph A["API · backend/ (Django REST Framework)"]
        direction LR
        V["Views / ViewSets<br/>endpoints REST"] --> SE["Serializers<br/>validación (RNF-02, RNF-03)"] --> M["Models<br/>Pedido · Detalle · Estado"]
        I["Clientes de integración<br/>Almacén, Caja, Distribución…"]
        V --> I
    end
    subgraph D["Datos"]
        PG[("PostgreSQL")]
    end
    P --> S -- "REST / JSON" --> A
    M --> PG
```

| Capa | Responsabilidad | Tecnología |
|------|-----------------|------------|
| Presentación | Pantallas, estado del carrito (hooks), formularios y tablas | React + Vite + TypeScript + Tailwind CSS |
| Servicios de cliente | Llamadas HTTP y tipado de las respuestas | Axios |
| API | Endpoints, validaciones, reglas de negocio, autorización (RNF-04) | Django REST Framework |
| Integración | Consumo de las APIs de otros módulos según contratos acordados (RNF-05) | DRF / `requests` |
| Datos | Persistencia de los registros propios del módulo | PostgreSQL |

## 3. Flujo del pedido virtual

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant FE as Frontend
    participant BE as API Ventas Virtuales
    participant ALM as Almacén
    participant CAJ as Caja de Ingresos
    participant COM as Comprobantes
    participant DIS as Distribución

    C->>FE: Consulta catálogo
    FE->>BE: GET /productos
    BE->>ALM: Consulta artículos y disponibilidad
    ALM-->>BE: Artículos, unidad de medida, stock
    BE-->>FE: Lista de productos
    C->>FE: Agrega productos al carrito
    FE->>FE: Calcula subtotales y total
    C->>FE: Confirma pedido (cliente, dirección)
    FE->>BE: POST /pedidos
    BE->>BE: Valida datos y registra Pedido + Detalle (estado: REGISTRADO)
    BE-->>FE: Pedido creado
    BE->>CAJ: Referencia del pedido, importe, medio de pago
    CAJ-->>BE: Pago confirmado (estado: PAGADO)
    BE->>COM: Datos de la operación confirmada
    COM-->>BE: Comprobante emitido
    BE->>DIS: Pedido y dirección de entrega
    DIS-->>BE: Estado del envío (EN_DESPACHO / ENTREGADO)
    C->>FE: Consulta estado del pedido
    FE->>BE: GET /pedidos/{id}
    BE-->>FE: Estado actual e historial
```

> El orden definitivo de pago, comprobante y despacho se establecerá por acuerdo entre los módulos.

## 4. Estados del pedido (propuesta)

```mermaid
stateDiagram-v2
    [*] --> REGISTRADO
    REGISTRADO --> PAGADO: Caja confirma pago
    REGISTRADO --> ANULADO: cancelación
    PAGADO --> EN_PREPARACION: Almacén atiende
    EN_PREPARACION --> EN_DESPACHO: Distribución recoge
    EN_DESPACHO --> ENTREGADO
    ENTREGADO --> [*]
    ANULADO --> [*]
```

## 5. Modelo de datos (propuesta)

Registros **propios** del módulo: pedido, detalle y estado. Clientes, artículos y catálogos SUNAT se **referencian** por su identificador, no se duplican.

```mermaid
erDiagram
    PEDIDO_VENTA_VIRTUAL ||--|{ DETALLE_PEDIDO : contiene
    PEDIDO_VENTA_VIRTUAL ||--|{ HISTORIAL_ESTADO_PEDIDO : registra
    ESTADO_PEDIDO ||--o{ HISTORIAL_ESTADO_PEDIDO : clasifica
    CLIENTE ||--o{ PEDIDO_VENTA_VIRTUAL : realiza
    ARTICULO ||--o{ DETALLE_PEDIDO : "se solicita en"

    PEDIDO_VENTA_VIRTUAL {
        int id PK
        string codigo_pedido
        int cliente_id FK "módulo Clientes"
        datetime fecha_pedido
        string direccion_entrega
        string moneda_cod "SUNAT Tabla 4"
        string medio_pago_cod "SUNAT Tabla 1"
        decimal subtotal
        decimal total
        string estado_actual
    }
    DETALLE_PEDIDO {
        int id PK
        int pedido_id FK
        int articulo_id FK "módulo Almacén"
        string unidad_medida_cod "SUNAT Tabla 6"
        decimal cantidad
        decimal precio_unitario
        decimal subtotal
    }
    ESTADO_PEDIDO {
        string codigo PK
        string descripcion
    }
    HISTORIAL_ESTADO_PEDIDO {
        int id PK
        int pedido_id FK
        string estado_codigo FK
        datetime fecha
        string origen "módulo que informa"
    }
    CLIENTE {
        int id PK "externo"
    }
    ARTICULO {
        int id PK "externo"
    }
```

> Los nombres definitivos de tablas y campos los fija el **diccionario de datos** validado por el Product Owner.

## 6. Tablas comunes (SUNAT) identificadas

| Tabla | Uso propuesto | Tipo de uso |
|-------|---------------|-------------|
| Tabla 1 · Tipo de medio de pago | Medio de pago seleccionado | Directo |
| Tabla 2 · Tipo de documento de identidad | Identificación del comprador | Vía Clientes |
| Tabla 3 · Entidad financiera | Bancos cuando corresponda | Vía Caja |
| Tabla 4 · Tipo de moneda | Moneda de la operación | Directo |
| Tabla 5 · Tipo de existencia | Consulta indirecta | Vía Almacén |
| Tabla 6 · Código de unidad de medida | Unidades de los artículos | Directo |
| Tabla 10 · Tipo de comprobante | Relación venta–comprobante | Vía Comprobantes |
| Tabla 12 · Tipo de operación | Por verificar | Pendiente |
| Tabla 13 · Catálogo de existencias | Por coordinar | Vía Almacén |
| Tabla 17 · Plan de cuentas | Integración contable | Vía Tribu Financiera |

## 7. API REST inicial (borrador para el CRUD)

| Método | Endpoint | Descripción | RF |
|--------|----------|-------------|----|
| GET | `/api/productos/` | Lista de artículos disponibles | RF-01, RF-09 |
| GET | `/api/pedidos/` | Lista de pedidos (filtros por estado, fecha, cliente) | RF-07 |
| POST | `/api/pedidos/` | Registra pedido con su detalle | RF-04, RF-05, RF-06 |
| GET | `/api/pedidos/{id}/` | Consulta un pedido y su detalle | RF-07 |
| PUT/PATCH | `/api/pedidos/{id}/` | Actualiza un pedido en estado REGISTRADO | RF-06 |
| DELETE | `/api/pedidos/{id}/` | Anula el pedido (cambio de estado, no borrado físico) | RF-06 |
| GET | `/api/pedidos/{id}/estados/` | Historial de estados | RF-08 |
| POST | `/api/pedidos/{id}/estados/` | Registra un cambio de estado informado por otro módulo | RF-10 |
