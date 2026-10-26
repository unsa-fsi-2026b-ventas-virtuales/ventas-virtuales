# Backend – Django REST Framework

Requisitos: Python 3.10+ y PostgreSQL.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install django djangorestframework psycopg[binary] django-cors-headers python-dotenv
pip freeze > requirements.txt
django-admin startproject config .
python manage.py startapp pedidos
```

Las credenciales de la base de datos van en `backend/.env` (no se sube al repositorio).

Entidades iniciales propuestas: **Pedido de venta virtual**, **Detalle de pedido**, **Estado del pedido**
(nombres definitivos según el diccionario de datos validado por el PO).
