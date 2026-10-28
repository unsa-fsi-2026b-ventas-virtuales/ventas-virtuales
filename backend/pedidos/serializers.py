from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import Articulo, Cliente, Pedido, PedidoDetalle, PedidoHistorial, EstadoPedido


class ArticuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articulo
        fields = ['ArtCod', 'ArtNom', 'UniMedCod', 'ArtPreUni', 'ArtStkDis', 'ArtEstReg']


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['CliCod', 'DocIdeTip', 'CliDocNum', 'CliNom', 'CliCor', 'CliDirEnt', 'CliEstReg']


class PedidoDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoDetalle
        fields = ['PedDetCod', 'PedCod', 'ArtCod', 'ArtNom', 'DetCan', 'DetPreUni', 'DetSubLin']
        extra_kwargs = {
            'PedCod': {'read_only': True}
        }


class PedidoHistorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoHistorial
        fields = ['HisEstCod', 'PedCod', 'HisEstAnt', 'HisEstNue', 'HisEstMot', 'HisRegIns', 'HisRegAct']
        extra_kwargs = {
            'PedCod': {'read_only': True}
        }


class PedidoSerializer(serializers.ModelSerializer):
    detalles = PedidoDetalleSerializer(many=True, required=False)
    historial = PedidoHistorialSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'PedCod',
            'PedSolCod',
            'CliCod',
            'PedFecEmi',
            'MonCod',
            'MedCod',
            'DocTipCod',
            'PedDirEnt',
            'PedSubTot',
            'PedIgvImp',
            'PedTotImp',
            'PedEstAct',
            'PedRegIns',
            'PedRegAct',
            'detalles',
            'historial',
        ]

    def validate_PedSolCod(self, value):
        if self.instance is None and Pedido.objects.filter(PedSolCod=value).exists():
            raise serializers.ValidationError(
                f"RE_PedAltaIdem: Ya existe un pedido con el token {value}."
            )
        return value

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])
        
        with transaction.atomic():
            pedido = Pedido.objects.create(**validated_data)

            # Crear líneas de detalle (I1T_PEDIDO_DET) y actualizar stock en Almacén
            for idx, det in enumerate(detalles_data):
                det_cod = det.get('PedDetCod') or f"{pedido.PedCod}-D{idx+1:02d}"
                PedidoDetalle.objects.create(
                    PedDetCod=det_cod,
                    PedCod=pedido,
                    ArtCod=det['ArtCod'],
                    ArtNom=det['ArtNom'],
                    DetCan=det['DetCan'],
                    DetPreUni=det['DetPreUni'],
                    DetSubLin=det['DetSubLin'],
                )

                # Descuento de stock en artículo si existe
                try:
                    articulo = Articulo.objects.get(ArtCod=det['ArtCod'])
                    articulo.ArtStkDis = max(Decimal('0.00'), articulo.ArtStkDis - Decimal(str(det['DetCan'])))
                    articulo.save()
                except Articulo.DoesNotExist:
                    pass

            # Registro atómico inicial en el historial de estados (RE_PedAltaAtom)
            PedidoHistorial.objects.create(
                HisEstCod=f"HIS-{timezone.now().strftime('%Y%m%d%H%M%S')}-{pedido.PedCod}",
                PedCod=pedido,
                HisEstAnt=None,
                HisEstNue=EstadoPedido.REGISTRADO,
                HisEstMot="Registro inicial del pedido virtual (RE_PedAltaAtom)",
                HisRegIns=pedido.PedRegIns or timezone.now(),
                HisRegAct=pedido.PedRegAct or 'frontend_web',
            )

        return pedido


class CambioEstadoSerializer(serializers.Serializer):
    HisEstNue = serializers.ChoiceField(choices=EstadoPedido.choices)
    HisEstMot = serializers.CharField(required=False, allow_blank=True, default='')

