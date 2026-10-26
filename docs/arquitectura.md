# Arquitectura

Propuesta de arquitectura del módulo de Ventas Virtuales. Está sujeta a los estándares que se definan para todo el ERP y a los acuerdos con los demás módulos. Los nombres de tablas, campos y reglas siguen el **diccionario de datos** del módulo ([`diccionario-de-datos.xlsx`](diccionario-de-datos.xlsx)).

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
        V["Views / ViewSets<br/>endpoints REST"] --> SE["Serializers<br/>validación (RNF-02, RNF-03)"] --> M["Models (ORM)<br/>Pedido · Detalle · Historial · Ref. externa"]
        I["Clientes de integración<br/>Almacén, Caja, Comprobantes, Distribución"]
        V --> I
    end
    subgraph D["Datos"]
        PG[("PostgreSQL")]
    end
    P --> S -- "REST / JSON" --> A
    M -- "transaction.atomic" --> PG
```

| Capa | Responsabilidad | Tecnología |
|------|-----------------|------------|
| Presentación | Pantallas, estado del carrito (hooks), formularios y tablas | React + Vite + TypeScript + Tailwind CSS |
| Servicios de cliente | Llamadas HTTP y tipado de las respuestas | Axios |
| API | Endpoints, validaciones, reglas de negocio, autorización (RNF-04) | Django REST Framework |
| Integración | Consumo de las APIs de otros módulos según contratos acordados (RNF-05) | DRF / `requests` |
| Datos | Persistencia de los registros propios del módulo | PostgreSQL (ORM de Django con migraciones) |

El backend es la única capa que accede a la base de datos. Los recursos de otros módulos no se copian: solo se guarda su identificador en `I1T_REF_EXTERNA`.

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
    FE->>BE: GET /api/productos/
    BE->>ALM: Consulta artículos y disponibilidad
    ALM-->>BE: Artículos, unidad de medida, stock
    BE-->>FE: Lista de productos
    C->>FE: Agrega productos al carrito
    FE->>FE: Calcula subtotales y total
    C->>FE: Confirma pedido (cliente, dirección, medio de pago, comprobante)
    FE->>BE: POST /api/pedidos/ (con PedSolCod)
    BE->>BE: Valida y registra Pedido + Detalle + Historial en una transacción (estado: REGISTRADO)
    BE-->>FE: Pedido creado
    BE->>CAJ: Referencia del pedido, importe, medio de pago
    CAJ-->>BE: Pago confirmado (estado: PAGADO)
    BE->>ALM: Productos y cantidades del pedido
    ALM-->>BE: Stock reservado (estado: RESERVADO)
    BE->>COM: Datos de la operación confirmada
    COM-->>BE: Comprobante emitido
    BE->>DIS: Pedido y dirección de entrega
    DIS-->>BE: Estado del envío (EN_ENVIO / ENTREGADO)
    C->>FE: Consulta estado del pedido
    FE->>BE: GET /api/pedidos/{id}/
    BE-->>FE: Estado actual e historial
```

> El orden definitivo de pago, reserva, comprobante y despacho se establecerá por acuerdo entre los módulos. Cada respuesta externa se guarda en `I1T_REF_EXTERNA` (`RESERVA_ALM`, `PAGO_CAJA`, `COMPROBANTE`, `ENVIO_DIST`, `ASIENTO_FIN`).

## 4. Estados del pedido

Estados definidos en el diccionario (`PedEstAct`, controlado con CHECK). Cada cambio genera un registro en `I1T_PEDIDO_EST_HIS`.

```mermaid
stateDiagram-v2
    [*] --> REGISTRADO
    REGISTRADO --> PAGADO: Caja confirma pago
    PAGADO --> RESERVADO: Almacén reserva stock
    RESERVADO --> EN_ENVIO: Distribución recoge
    EN_ENVIO --> ENTREGADO
    REGISTRADO --> ANULADO: cancelación (motivo obligatorio)
    PAGADO --> ANULADO: cancelación (motivo obligatorio)
    ENTREGADO --> [*]
    ANULADO --> [*]
```

## 5. Modelo de datos

Registros **propios** del módulo (`I1T_*`): pedido, detalle, historial de estados y referencias externas. Clientes y artículos (`I1M_*`) son compartidos con los módulos Clientes y Almacén. Los catálogos SUNAT (`I1Z_*`) son referenciales. Las claves son códigos de texto estables, no autoincrementales.

```mermaid
erDiagram
    I1Z_TIPO_DOC_IDENTIDAD ||--o{ I1M_CLIENTE : clasifica
    I1Z_UNIDAD_MEDIDA ||--o{ I1M_ARTICULO : mide
    I1M_CLIENTE ||--o{ I1T_PEDIDO : realiza
    I1Z_MONEDA ||--o{ I1T_PEDIDO : expresa
    I1Z_MEDIO_PAGO ||--o{ I1T_PEDIDO : "se paga con"
    I1Z_TIPO_COMPROBANTE ||--o{ I1T_PEDIDO : solicita
    I1T_PEDIDO ||--|{ I1T_PEDIDO_DET : contiene
    I1M_ARTICULO ||--o{ I1T_PEDIDO_DET : "se solicita en"
    I1T_PEDIDO ||--|{ I1T_PEDIDO_EST_HIS : registra
    I1T_PEDIDO ||--o{ I1T_REF_EXTERNA : "se vincula a"

    I1M_CLIENTE {
        varchar64 CliCod PK
        varchar32 DocIdeTip FK "Tabla 2 SUNAT"
        varchar64 CliDocNum "UNIQUE con DocIdeTip"
        varchar200 CliNom
        varchar150 CliCor
        varchar250 CliDirEnt
        char1 CliEstReg "A / I / *"
    }
    I1M_ARTICULO {
        varchar64 ArtCod PK
        varchar200 ArtNom
        varchar16 UniMedCod FK "Tabla 6 SUNAT"
        numeric ArtPreUni "14,2 > 0"
        numeric ArtStkDis "12,2 >= 0"
        char1 ArtEstReg "A / I / *"
    }
    I1T_PEDIDO {
        varchar64 PedCod PK
        varchar64 PedSolCod "UNIQUE, idempotencia"
        varchar64 CliCod FK
        date PedFecEmi
        char3 MonCod FK "PEN"
        varchar32 MedCod FK "Tabla 1 SUNAT"
        varchar32 DocTipCod FK "01 Factura / 03 Boleta"
        varchar250 PedDirEnt
        numeric PedSubTot "14,2"
        numeric PedIgvImp "14,2"
        numeric PedTotImp "SubTot + Igv"
        varchar24 PedEstAct "CHECK estados"
        timestamptz PedRegIns
        varchar128 PedRegAct
    }
    I1T_PEDIDO_DET {
        varchar64 PedDetCod PK
        varchar64 PedCod FK "UNIQUE con ArtCod"
        varchar64 ArtCod FK
        numeric DetCan "12,2 > 0"
        numeric DetPreUni "14,2 congelado"
        numeric DetSubLin "DetCan x DetPreUni"
    }
    I1T_PEDIDO_EST_HIS {
        varchar64 HisEstCod PK
        varchar64 PedCod FK
        varchar24 HisEstAnt
        varchar24 HisEstNue
        varchar500 HisEstMot "obligatorio si ANULADO"
        timestamptz HisRegIns
        varchar128 HisRegAct
    }
    I1T_REF_EXTERNA {
        varchar64 PedCod PK,FK
        varchar32 RefTip PK "RESERVA_ALM / PAGO_CAJA / ..."
        varchar128 RefExt PK "ID del módulo externo"
    }
```

### Restricciones principales (se declaran en `Meta.constraints` y Django las crea en PostgreSQL)

| Regla | Restricción |
|-------|-------------|
| RE_PedAltaIdem | `UNIQUE (PedSolCod)` |
| RE_DetUnicoArt | `UNIQUE (PedCod, ArtCod)` |
| RE_CliIdUni | `UNIQUE (DocIdeTip, CliDocNum)` |
| RE_PedTotCuadre | `CHECK (PedTotImp = PedSubTot + PedIgvImp)` |
| RE_DetSubCalc | `CHECK (DetSubLin = DetCan * DetPreUni)` |
| RE_DetCanPos / RE_ArtStkVal | `CHECK (DetCan > 0)`, `CHECK (ArtStkDis >= 0)` |
| RE_PedEstDom | `CHECK (PedEstAct IN ('REGISTRADO','PAGADO','RESERVADO','EN_ENVIO','ENTREGADO','ANULADO'))` |
| RE_HisAnul | `CHECK (HisEstNue <> 'ANULADO' OR HisEstMot <> '')` |
| RE_PedAltaAtom | Cabecera, detalle e historial inicial en un solo `transaction.atomic` |

Las reglas que dependen de otros módulos (stock en Almacén, Factura con RUC) se validan en el backend dentro de la transacción.

## 6. Tablas comunes (SUNAT)

| Tabla SUNAT | Tabla del módulo | Uso | Tipo de uso |
|-------------|------------------|-----|-------------|
| Tabla 1 · Tipo de medio de pago | `I1Z_MEDIO_PAGO` | Medio de pago del pedido | Directo |
| Tabla 2 · Tipo de documento de identidad | `I1Z_TIPO_DOC_IDENTIDAD` | Identificación del comprador | Directo |
| Tabla 3 · Entidad financiera | — | Bancos cuando corresponda | Vía Caja |
| Tabla 4 · Tipo de moneda | `I1Z_MONEDA` | Moneda del pedido (PEN) | Directo |
| Tabla 5 · Tipo de existencia | — | Consulta indirecta | Vía Almacén |
| Tabla 6 · Código de unidad de medida | `I1Z_UNIDAD_MEDIDA` | Unidad de los artículos | Directo |
| Tabla 10 · Tipo de comprobante | `I1Z_TIPO_COMPROBANTE` | Boleta (03) o Factura (01) solicitada | Directo |
| Tabla 12 · Tipo de operación | — | Por verificar | Pendiente |
| Tabla 13 · Catálogo de existencias | `I1M_ARTICULO` | Catálogo de la tienda virtual | Compartido con Almacén |
| Tabla 17 · Plan de cuentas | — | Integración contable | Vía Tribu Financiera |

## 7. API REST inicial (borrador para el CRUD)

| Método | Endpoint | Descripción | RF |
|--------|----------|-------------|----|
| GET | `/api/productos/` | Lista de artículos disponibles | RF-01, RF-09 |
| GET | `/api/pedidos/` | Lista de pedidos (filtros por estado, fecha, cliente) | RF-07 |
| POST | `/api/pedidos/` | Registra pedido con su detalle; `PedSolCod` evita duplicados | RF-04, RF-05, RF-06 |
| GET | `/api/pedidos/{id}/` | Consulta un pedido y su detalle | RF-07 |
| PUT/PATCH | `/api/pedidos/{id}/` | Actualiza un pedido en estado REGISTRADO | RF-06 |
| DELETE | `/api/pedidos/{id}/` | Anula el pedido (cambio a ANULADO con motivo obligatorio, no borrado físico) | RF-06 |
| GET | `/api/pedidos/{id}/estados/` | Historial de estados | RF-08 |
| POST | `/api/pedidos/{id}/estados/` | Registra un cambio de estado informado por otro módulo | RF-10 |

La documentación de los endpoints se genera con **drf-spectacular** (Swagger UI).

## 8. Decisión de tecnologías

La comparación completa de alternativas está en el documento *Arquitectura del módulo — Comparación de tecnologías y decisión del equipo*.

| Componente | Tecnología |
|------------|------------|
| Base de datos | PostgreSQL |
| Backend | Python + Django REST Framework |
| Acceso a datos | ORM de Django con migraciones (`Meta.db_table` y `db_column` con los nombres del diccionario) |
| Scripts SQL | `01_estructura.sql` generado con `sqlmigrate`; `02_datos_prueba.sql` escrito aparte |
| Documentación de servicios | drf-spectacular (Swagger) |
| Frontend | React + Vite + TypeScript, Tailwind CSS, Axios |
| Pruebas | pytest, pytest-django y Postman |
