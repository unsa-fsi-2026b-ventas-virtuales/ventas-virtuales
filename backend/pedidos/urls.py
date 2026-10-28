from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PedidoViewSet, ArticuloViewSet, ClienteViewSet

router = DefaultRouter()
router.register(r'pedidos', PedidoViewSet, basename='pedido')
router.register(r'articulos', ArticuloViewSet, basename='articulo')
router.register(r'productos', ArticuloViewSet, basename='producto')
router.register(r'clientes', ClienteViewSet, basename='cliente')

urlpatterns = [
    path('', include(router.urls)),
]

