# Flujo de trabajo

## Ramas

| Rama | Propósito | Quién integra |
|------|-----------|---------------|
| `main` | Versión estable y entregable | PR desde `develop`, aprobado por PO / QA |
| `develop` | Integración del sprint | PR desde ramas de trabajo, 1 revisión |
| `feature/<area>-<tema>` | Nueva funcionalidad (`feature/backend-crud-pedidos`) | Autor |
| `fix/<tema>` | Corrección de errores | Autor |
| `docs/<tema>` | Documentación | Autor |

```bash
git checkout develop
git pull
git checkout -b feature/backend-crud-pedidos
# ... trabajo ...
git add .
git commit -m "feat(pedidos): agregar endpoint de registro"
git push -u origin feature/backend-crud-pedidos
# Abrir Pull Request hacia develop en GitHub
```

## Mensajes de commit

Formato: `tipo(ámbito): descripción breve en minúsculas`

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `docs` | Documentación |
| `style` | Formato, sin cambios de lógica |
| `refactor` | Reestructuración sin cambiar comportamiento |
| `test` | Pruebas |
| `chore` | Configuración, dependencias |

## Pull Requests
- Un PR por historia o tarea; título claro y referencia al Issue (`Cierra #12`).
- Completar la plantilla: qué cambia, cómo se probó y evidencia (captura o salida de Postman).
- Al menos **una revisión** aprobada antes de fusionar.
- No subir `.env`, `node_modules/` ni `.venv/`.

## Tablero
*Pendiente → En proceso → En revisión → Terminado*, con responsable y evidencia por tarjeta.

## Definition of Done
Una tarea está **terminada** cuando:
1. Cumple los criterios de aceptación de la historia.
2. Tiene validaciones de datos obligatorios.
3. Tiene al menos una prueba positiva y una negativa.
4. Adjunta evidencia en el PR.
5. Fue revisada por QA y aceptada por el PO.
6. Está fusionada en `develop`.
