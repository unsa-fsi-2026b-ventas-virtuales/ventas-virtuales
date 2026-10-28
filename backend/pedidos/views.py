from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Articulo, Cliente, Pedido, PedidoHistorial, EstadoPedido
from .serializers import (
    ArticuloSerializer,
    ClienteSerializer,
    PedidoSerializer,
    PedidoHistorialSerializer,
    CambioEstadoSerializer,
)


class ArticuloViewSet(viewsets.ModelViewSet):
    queryset = Articulo.objects.all()
    serializer_class = ArticuloSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all().prefetch_related('detalles', 'historial')
    serializer_class = PedidoSerializer

    @action(detail=True, methods=['post', 'get'], url_path='estados')
    def estados(self, request, pk=None):
        pedido = self.get_object()

        if request.method == 'GET':
            historial = pedido.historial.all()
            serializer = PedidoHistorialSerializer(historial, many=True)
            return Response(serializer.data)

        # POST: Cambio de estado / Trazabilidad
        serializer = CambioEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nuevo_estado = serializer.validated_data['HisEstNue']
        motivo = serializer.validated_data.get('HisEstMot', '').strip()

        # Validación RE_HisAnul: anulación exige motivo
        if nuevo_estado == EstadoPedido.ANULADO and not motivo:
            return Response(
                {"error": "RE_HisAnul: La anulación exige registrar un motivo obligatorio."},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = pedido.PedEstAct
        pedido.PedEstAct = nuevo_estado
        pedido.save(update_fields=['PedEstAct'])

        # Determinar actor según módulo de origen
        actor = 'admin_ventas'
        if nuevo_estado == EstadoPedido.PAGADO:
            actor = 'srv_caja'
        elif nuevo_estado == EstadoPedido.RESERVADO:
            actor = 'srv_almacen'
        elif nuevo_estado in [EstadoPedido.EN_ENVIO, EstadoPedido.ENTREGADO]:
            actor = 'srv_distribucion'

        historial_entry = PedidoHistorial.objects.create(
            HisEstCod=f"HIS-{timezone.now().strftime('%Y%m%d%H%M%S')}-{pedido.PedCod}",
            PedCod=pedido,
            HisEstAnt=estado_anterior,
            HisEstNue=nuevo_estado,
            HisEstMot=motivo or f"Transición a {nuevo_estado}",
            HisRegIns=timezone.now(),
            HisRegAct=actor,
        )

        return Response({
            "mensaje": f"Estado del pedido {pedido.PedCod} actualizado a {nuevo_estado}.",
            "PedCod": pedido.PedCod,
            "PedEstAct": pedido.PedEstAct,
            "historial": PedidoHistorialSerializer(historial_entry).data
        }, status=status.HTTP_200_OK)
