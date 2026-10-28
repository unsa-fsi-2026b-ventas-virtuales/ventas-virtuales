# Backend – Django REST Framework

Módulo de API REST para el sistema de **Ventas Virtuales** de la Tribu Ingresos (ERP Académico · UNSA).

---

## 🚀 Guía de Ejecución (2 Terminales)

Para levantar el sistema completo y conectar el Frontend con el Backend, abre **dos terminales**:

### 🟢 Terminal 1: Iniciar la API Backend (Django)
```powershell
# Desde la raíz del proyecto o con la ruta directa:
cd "c:\Users\Asus\Documents\CARPETA DONDE CLONO\ventas-virtuales\backend"
python manage.py runserver 8000
```
> 📍 **Servicio API:** `http://localhost:8000/api/`  
> 📍 **Panel Admin Django:** `http://localhost:8000/admin/`

---

### 🔵 Terminal 2: Iniciar la Aplicación Frontend (React + Vite)
```powershell
# Desde la raíz del proyecto o con la ruta directa:
cd "c:\Users\Asus\Documents\CARPETA DONDE CLONO\ventas-virtuales\frontend"
npm run dev
```
> 📍 **Aplicación Web:** `http://localhost:5173/`  
> *(Al conectarse al puerto 8000, el indicador superior del frontend pasará automáticamente a `MODO: API`)*.

---

## ⚙️ Puesta en Marcha Inicial (Instalación y Migraciones)

Requisitos: Python 3.10+ y Node.js 20+.

```powershell
# 1. Ingresar a la carpeta del backend
cd backend

# 2. (Opcional) Crear y activar entorno virtual
python -m venv .venv
.venv\Scripts\activate        # Linux/Mac: source .venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Generar y aplicar migraciones de base de datos
python manage.py makemigrations pedidos
python manage.py migrate

# 5. Cargar datos maestros de prueba (Artículos, Clientes y Pedido inicial del PDF)
python manage.py poblar_datos
```

---

## 📌 Endpoints Principales de la API REST

| Método | Endpoint | Descripción | Regla / Estándar |
|:---:|---|---|---|
| **GET** | `/api/pedidos/` | Listado de pedidos con líneas de detalle e historial | RF-07 |
| **POST** | `/api/pedidos/` | Registro atómico de pedido y descuento de stock | `RE_PedAltaAtom`, `RE_PedAltaIdem` |
| **GET** | `/api/pedidos/{id}/` | Consulta de un pedido en particular | RF-07 |
| **POST** | `/api/pedidos/{id}/estados/` | Registro de cambio de estado y trazabilidad | `RE_HisAnul`, RF-10 |
| **GET** | `/api/pedidos/{id}/estados/` | Historial de auditoría de estados del pedido | RF-08 |
| **GET** | `/api/articulos/` | Catálogo de artículos y stock en almacén | RF-01, RF-09 |
| **GET** | `/api/clientes/` | Maestro de clientes y validación de estado activo | `RE_CliEst` |
