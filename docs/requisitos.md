# Requisitos

Requisitos preliminares, sujetos a validación del Product Owner y del docente.

## Requisitos funcionales

| Código | Requisito |
|--------|-----------|
| RF-01 | El sistema permitirá consultar los artículos disponibles para la venta |
| RF-02 | El sistema permitirá seleccionar artículos y cantidades |
| RF-03 | El sistema permitirá agregar y retirar productos del carrito |
| RF-04 | El sistema permitirá asociar un cliente al pedido |
| RF-05 | El sistema calculará el subtotal y el importe total |
| RF-06 | El sistema permitirá registrar un pedido virtual |
| RF-07 | El sistema permitirá consultar los pedidos registrados |
| RF-08 | El sistema permitirá visualizar el estado de un pedido |
| RF-09 | El sistema consultará la disponibilidad de artículos mediante la integración acordada con Almacén |
| RF-10 | El sistema compartirá los datos necesarios con los módulos relacionados, según los acuerdos establecidos |

## Requisitos no funcionales

| Código | Requisito |
|--------|-----------|
| RNF-01 | La interfaz deberá ser sencilla y comprensible para los usuarios |
| RNF-02 | El sistema deberá validar los datos obligatorios antes de registrar un pedido |
| RNF-03 | El módulo deberá evitar registros incompletos o inconsistentes |
| RNF-04 | El sistema deberá utilizar mecanismos de acceso y autorización acordes con la arquitectura del ERP |
| RNF-05 | El módulo deberá respetar los identificadores y estructuras de datos definidos conjuntamente |
| RNF-06 | El código deberá organizarse de manera que facilite su mantenimiento y futuras integraciones |

## Historias de usuario (Product Backlog inicial)

| Código | Historia de usuario | Prioridad | RF |
|--------|---------------------|-----------|----|
| HU-01 | Como **cliente**, quiero visualizar los productos disponibles para conocer qué artículos puedo comprar | Alta | RF-01 |
| HU-02 | Como **cliente**, quiero agregar productos al carrito para preparar mi pedido | Alta | RF-02, RF-03, RF-05 |
| HU-03 | Como **cliente**, quiero registrar mi pedido para solicitar la compra de los artículos seleccionados | Alta | RF-04, RF-06 |
| HU-04 | Como **personal de ventas**, quiero consultar los pedidos registrados para realizar su seguimiento | Alta | RF-07 |
| HU-05 | Como **cliente**, quiero conocer el estado de mi pedido para saber cómo avanza su atención | Media | RF-08 |
| HU-06 | Como **personal de ventas**, quiero consultar la disponibilidad de artículos para evitar pedidos que no puedan atenderse | Alta | RF-09 |
| HU-07 | Como **personal de ventas**, quiero consultar la confirmación del pago para conocer si el pedido puede continuar su procesamiento | Media | RF-10 |

## Relación funcionalidad – tecnología

| Funcionalidad | Tecnología que la apoya |
|---------------|-------------------------|
| Consulta de productos | React + Axios consumiendo la API de artículos |
| Carrito de compras | Estado de React (componentes y hooks) |
| Registro y consulta de pedidos | Formularios y tablas (Tailwind CSS) + CRUD en Django REST Framework |
| Seguimiento del pedido | Vista de estados conectada a la API |
| Integración con otros módulos | API REST con identificadores y estructuras comunes (RNF-05) |
