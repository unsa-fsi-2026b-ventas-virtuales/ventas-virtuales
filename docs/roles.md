# Roles e indicaciones del equipo

El equipo se organiza con **Scrum**. Cada rol tiene responsabilidades, entregables y un punto de partida en el repositorio. Las decisiones de alcance las valida el Product Owner; ninguna tarea se considera terminada sin cumplir la [Definition of Done](flujo-de-trabajo.md#definition-of-done).

| Rol | Integrante | Carpeta / artefacto principal |
|-----|------------|-------------------------------|
| [Product Owner](#product-owner) | Ponce Llerena Renato Xavier | Product Backlog, `docs/alcance.md`, `docs/requisitos.md` |
| [Scrum Master](#scrum-master) | Mayta Quispe Paola Adamari | Tablero (GitHub Projects), actas |
| [DevOps y Arquitectura](#devops-y-arquitectura) | Bedregal Coaguila Karla Miluska | `docs/arquitectura.md`, configuración del repo |
| [Backend](#backend) | Llaique Chullunquia Jack Franco | `backend/` |
| [Frontend](#frontend) | Chavez Cuno Deivick Paul Eddi | `frontend/` |
| [QA](#qa) | Soria Soncco Rodolfo | Casos de prueba, colección Postman |
| [BI](#bi) | Huaynacho Mango Jerry Anderson | Indicadores, administración del repositorio |
| [Patrones de diseño / Referencia ERP](#patrones-de-diseño--referencia-erp) | Quispe Mamani Jose Gabriel | `docs/alcance.md` (comparación ERP) |

---

## Product Owner
**Ponce Llerena Renato Xavier**

**Responsabilidades**
- Definir y comunicar la visión del módulo.
- Mantener y priorizar el Product Backlog (historias de usuario HU-xx).
- Validar el alcance del MVP con el docente.
- Revisar y aprobar el diccionario de datos.
- Aceptar o rechazar los incrementos al final de cada sprint.

**Indicaciones**
- Registra cada historia como *Issue* con la plantilla "Historia de usuario" y asígnale prioridad.
- Escribe criterios de aceptación verificables (lo que QA probará).
- Revisa los Pull Requests hacia `main` desde el punto de vista funcional.

**Entregables:** backlog priorizado, alcance validado, diccionario de datos aprobado.

---

## Scrum Master
**Mayta Quispe Paola Adamari**

**Responsabilidades**
- Facilitar la planificación, el seguimiento y la revisión del sprint.
- Mantener el tablero: *Pendiente → En proceso → En revisión → Terminado*.
- Registrar actas, acuerdos, decisiones e impedimentos.
- Coordinar con los Scrum Masters / representantes de otros módulos.

**Indicaciones**
- Verifica que cada tarjeta del tablero tenga responsable y evidencia.
- Guarda las actas en `docs/actas/AAAA-MM-DD.md`.
- Escala al docente las dudas que bloqueen al equipo (ver `docs/alcance.md`, sección de consultas).
- No sustituye la aprobación del PO.

**Entregables:** tablero actualizado, actas, registro de bloqueos.

---

## DevOps y Arquitectura
**Bedregal Coaguila Karla Miluska**

**Responsabilidades**
- Mantener la estructura del monorepo y los entornos (desarrollo, base de datos).
- Definir la estrategia de integración con los demás módulos del ERP.
- Completar el diccionario de datos junto con Backend.
- Investigar los requisitos multiempresa.

**Indicaciones**
- Mantén actualizado `docs/arquitectura.md` cuando cambie una decisión.
- Documenta las variables de entorno en `backend/.env.example` (nunca subas `.env`).
- Revisa el diccionario de datos del otro equipo para identificar tablas compartidas y evitar duplicados.
- Propón, cuando corresponda, `docker-compose` para PostgreSQL y una GitHub Action básica de verificación.

**Entregables:** diccionario de datos, diagrama de arquitectura, guía de entornos.

---

## Backend
**Llaique Chullunquia Jack Franco**

**Responsabilidades**
- Implementar los modelos de Pedido, Detalle de pedido y Estado del pedido.
- Construir el CRUD de pedidos en Django REST Framework.
- Definir los contratos de intercambio (endpoints y JSON) con otros módulos.
- Aplicar validaciones de datos obligatorios y consistencia (RNF-02, RNF-03).

**Indicaciones**
- Trabaja en `backend/` con ramas `feature/backend-<tema>`.
- Sigue el borrador de endpoints de `docs/arquitectura.md` §7.
- Mantén `requirements.txt` actualizado y documenta los endpoints (Postman o DRF browsable API).
- Coordina con Frontend los tipos de datos antes de cambiar una respuesta.

**Entregables:** CRUD de pedidos funcionando, colección de endpoints, migraciones.

---

## Frontend
**Chavez Cuno Deivick Paul Eddi**

**Responsabilidades**
- Diseñar los prototipos en Figma (catálogo, carrito, registro y consulta de pedidos).
- Implementar las pantallas en React + Vite + TypeScript con Tailwind CSS.
- Consumir la API del backend con Axios.

**Indicaciones**
- Trabaja en `frontend/` con ramas `feature/frontend-<tema>`.
- Organiza el código en `src/components`, `src/pages`, `src/services` (Axios) y `src/types`.
- Mantén la interfaz simple y comprensible (RNF-01); valida formularios antes de enviar.
- Enlaza el prototipo de Figma en el Pull Request correspondiente.

**Entregables:** prototipos, pantallas del MVP conectadas a la API.

---

## QA
**Soria Soncco Rodolfo**

**Responsabilidades**
- Preparar casos de prueba de pedido, stock, totales, validaciones y cambios de estado.
- Ejecutar pruebas positivas y negativas de cada historia.
- Identificar riesgos y dependencias técnicas junto con DevOps.

**Indicaciones**
- Registra los casos en `docs/pruebas/` (ID, precondición, pasos, resultado esperado, resultado obtenido).
- Mantén una colección de Postman para los endpoints del CRUD.
- Revisa los Pull Requests: sin evidencia de prueba, no se aprueba.
- Reporta defectos como *Issues* con la plantilla "Reporte de error".

**Entregables:** plan y casos de prueba, evidencias, reporte de defectos.

---

## BI
**Huaynacho Mango Jerry Anderson**

**Responsabilidades**
- Definir los indicadores básicos de pedidos y ventas virtuales, sin duplicar información contable.
- Identificar los datos que el modelo debe registrar para poder calcular esos indicadores.
- Administrar el repositorio y la organización en GitHub (accesos, protección de ramas).

**Indicaciones**
- Documenta los indicadores en `docs/indicadores.md` (nombre, fórmula, fuente, frecuencia).
- Indicadores sugeridos: pedidos por día, ticket promedio, pedidos por estado, tasa de anulación, tiempo promedio hasta entrega, productos más solicitados.
- Valida con Backend que el modelo de datos contenga los campos necesarios.

**Entregables:** catálogo de indicadores, repositorio configurado.

---

## Patrones de diseño / Referencia ERP
**Quispe Mamani Jose Gabriel**

**Responsabilidades**
- Investigar los patrones de diseño aplicables al módulo (p. ej. Repository, Service Layer, State para los estados del pedido).
- Comparar los flujos de ventas virtuales de Odoo y SAP Business One con la propuesta del equipo.

**Indicaciones**
- Amplía la comparación de `docs/alcance.md` con referencias a la documentación oficial.
- Propón en un Pull Request de documentación cómo aplicar cada patrón en el backend.

**Entregables:** comparación ERP documentada, propuesta de patrones.

---

## Subgrupos de trabajo inmediato

| Subgrupo | Integrantes | Entrega inicial |
|----------|-------------|-----------------|
| Producto e investigación | Renato, José Gabriel, Jerry | Alcance, comparación ERP, indicadores y consultas al docente |
| Experiencia y diseño | Deivick, Jack | Prototipo de flujo y propuesta de entidades / transacciones |
| Integración y calidad | Karla, Rodolfo | Dependencias técnicas, riesgos y casos de prueba |
| Coordinación transversal | Paola | Tablero, actas, bloqueos y consolidación |
