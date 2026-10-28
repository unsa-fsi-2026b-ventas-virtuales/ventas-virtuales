from decimal import Decimal
from django.db import models
from django.utils import timezone


class EstadoPedido(models.TextChoices):
    REGISTRADO = 'REGISTRADO', 'Registrado'
    PAGADO = 'PAGADO', 'Pagado'
    RESERVADO = 'RESERVADO', 'Reservado'
    EN_ENVIO = 'EN_ENVIO', 'En Envío'
    ENTREGADO = 'ENTREGADO', 'Entregado'
    ANULADO = 'ANULADO', 'Anulado'


class Cliente(models.Model):
    CliCod = models.CharField(max_length=50, primary_key=True, verbose_name="Código de Cliente")
    DocIdeTip = models.CharField(max_length=2, verbose_name="Tipo de Documento (1: DNI, 6: RUC)")
    CliDocNum = models.CharField(max_length=20, unique=True, verbose_name="Número de Documento")
    CliNom = models.CharField(max_length=255, verbose_name="Nombre / Razón Social")
    CliCor = models.EmailField(max_length=150, verbose_name="Correo Electrónico")
    CliDirEnt = models.TextField(verbose_name="Dirección de Entrega")
    CliEstReg = models.CharField(max_length=1, default='A', verbose_name="Estado de Registro (A/I)")

    class Meta:
        db_table = 'i1m_cliente'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return f"{self.CliCod} - {self.CliNom}"


class Articulo(models.Model):
    ArtCod = models.CharField(max_length=50, primary_key=True, verbose_name="Código de Artículo")
    ArtNom = models.CharField(max_length=255, verbose_name="Nombre del Artículo")
    UniMedCod = models.CharField(max_length=10, default='NIU', verbose_name="Unidad de Medida (SUNAT Tabla 6)")
    ArtPreUni = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Precio Unitario")
    ArtStkDis = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Stock Disponible")
    ArtEstReg = models.CharField(max_length=1, default='A', verbose_name="Estado de Registro (A/I)")

    class Meta:
        db_table = 'i1m_articulo'
        verbose_name = 'Artículo'
        verbose_name_plural = 'Artículos'

    def __str__(self):
        return f"{self.ArtCod} - {self.ArtNom} (Stock: {self.ArtStkDis})"


class Pedido(models.Model):
    PedCod = models.CharField(max_length=50, primary_key=True, verbose_name="Código de Pedido")
    PedSolCod = models.CharField(max_length=100, unique=True, verbose_name="Token de Solicitud (Idempotencia)")
    CliCod = models.CharField(max_length=50, verbose_name="Código de Cliente")
    PedFecEmi = models.DateField(default=timezone.now, verbose_name="Fecha de Emisión")
    MonCod = models.CharField(max_length=5, default='PEN', verbose_name="Moneda (SUNAT Tabla 4)")
    MedCod = models.CharField(max_length=50, verbose_name="Medio de Pago (SUNAT Tabla 1)")
    DocTipCod = models.CharField(max_length=5, verbose_name="Tipo Comprobante (01: Factura, 03: Boleta)")
    PedDirEnt = models.TextField(verbose_name="Dirección de Entrega")
    PedSubTot = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Subtotal")
    PedIgvImp = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Impuesto IGV (18%)")
    PedTotImp = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Total Importe")
    PedEstAct = models.CharField(
        max_length=20,
        choices=EstadoPedido.choices,
        default=EstadoPedido.REGISTRADO,
        verbose_name="Estado Actual"
    )
    PedRegIns = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Registro")
    PedRegAct = models.CharField(max_length=50, default='usuario_web', verbose_name="Actor de Registro")

    class Meta:
        db_table = 'i1t_pedido'
        verbose_name = 'Pedido de Venta Virtual'
        verbose_name_plural = 'Pedidos de Venta Virtual'
        ordering = ['-PedRegIns']

    def __str__(self):
        return f"{self.PedCod} - {self.CliCod} [{self.PedEstAct}]"


class PedidoDetalle(models.Model):
    PedDetCod = models.CharField(max_length=60, primary_key=True, verbose_name="Código de Detalle")
    PedCod = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles', db_column='PedCod')
    ArtCod = models.CharField(max_length=50, verbose_name="Código de Artículo")
    ArtNom = models.CharField(max_length=255, verbose_name="Nombre de Artículo")
    DetCan = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Cantidad")
    DetPreUni = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Precio Unitario")
    DetSubLin = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Subtotal Línea")

    class Meta:
        db_table = 'i1t_pedido_det'
        verbose_name = 'Detalle de Pedido'
        verbose_name_plural = 'Detalles de Pedidos'

    def __str__(self):
        return f"{self.PedDetCod} - {self.ArtNom} ({self.DetCan} uds)"


class PedidoHistorial(models.Model):
    HisEstCod = models.CharField(max_length=60, primary_key=True, verbose_name="Código de Historial")
    PedCod = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='historial', db_column='PedCod')
    HisEstAnt = models.CharField(max_length=20, null=True, blank=True, verbose_name="Estado Anterior")
    HisEstNue = models.CharField(max_length=20, choices=EstadoPedido.choices, verbose_name="Estado Nuevo")
    HisEstMot = models.TextField(verbose_name="Motivo del Cambio")
    HisRegIns = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Registro")
    HisRegAct = models.CharField(max_length=50, default='sistema', verbose_name="Actor de Registro")

    class Meta:
        db_table = 'i1t_pedido_est_his'
        verbose_name = 'Historial de Estado de Pedido'
        verbose_name_plural = 'Historial de Estados de Pedidos'
        ordering = ['HisRegIns']

    def __str__(self):
        return f"{self.HisEstCod} - Pedido {self.PedCod_id}: {self.HisEstAnt} -> {self.HisEstNue}"
