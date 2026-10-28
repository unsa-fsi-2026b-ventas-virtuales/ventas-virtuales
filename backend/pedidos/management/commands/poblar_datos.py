from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from pedidos.models import Articulo, Cliente, Pedido, PedidoDetalle, PedidoHistorial, EstadoPedido


class Command(BaseCommand):
    help = "Carga datos iniciales de prueba (Clientes, Artículos y Pedido de demostración)"

    def handle(self, *args, **options):
        # 1. Clientes
        clientes = [
            {
                'CliCod': 'CLI-001',
                'DocIdeTip': '6',
                'CliDocNum': '20601234567',
                'CliNom': 'COMERCIAL AREQUIPA S.A.C.',
                'CliCor': 'compras@comercialaqp.pe',
                'CliDirEnt': 'Av. Ejército 710, Yanahuara, Arequipa',
                'CliEstReg': 'A',
            },
            {
                'CliCod': 'CLI-002',
                'DocIdeTip': '1',
                'CliDocNum': '72345678',
                'CliNom': 'JUAN PEREZ QUISPE',
                'CliCor': 'juan.perez@unsa.edu.pe',
                'CliDirEnt': 'Calle Mercaderes 215, Cercado, Arequipa',
                'CliEstReg': 'A',
            },
            {
                'CliCod': 'CLI-003',
                'DocIdeTip': '1',
                'CliDocNum': '40112233',
                'CliNom': 'CLIENTE INACTIVO DEMO',
                'CliCor': 'inactivo@correo.pe',
                'CliDirEnt': 'Av. Venezuela s/n',
                'CliEstReg': 'I',
            },
        ]

        for c in clientes:
            Cliente.objects.update_or_create(CliCod=c['CliCod'], defaults=c)

        # 2. Artículos
        articulos = [
            {
                'ArtCod': 'ART-001',
                'ArtNom': 'Teclado Mecánico Industrial RGB (Ejemplo PDF)',
                'UniMedCod': 'NIU',
                'ArtPreUni': Decimal('50.00'),
                'ArtStkDis': Decimal('25.00'),
                'ArtEstReg': 'A',
            },
            {
                'ArtCod': 'ART-002',
                'ArtNom': 'Monitor IPS 24" Full HD 75Hz',
                'UniMedCod': 'NIU',
                'ArtPreUni': Decimal('450.00'),
                'ArtStkDis': Decimal('10.00'),
                'ArtEstReg': 'A',
            },
            {
                'ArtCod': 'ART-003',
                'ArtNom': 'Mouse Inalámbrico Ergonómico',
                'UniMedCod': 'NIU',
                'ArtPreUni': Decimal('80.00'),
                'ArtStkDis': Decimal('15.00'),
                'ArtEstReg': 'A',
            },
            {
                'ArtCod': 'ART-004',
                'ArtNom': 'Licencia Antivirus Corporativo Anual',
                'UniMedCod': 'ZZ',
                'ArtPreUni': Decimal('120.00'),
                'ArtStkDis': Decimal('50.00'),
                'ArtEstReg': 'A',
            },
        ]

        for a in articulos:
            Articulo.objects.update_or_create(ArtCod=a['ArtCod'], defaults=a)

        # 3. Pedido Inicial de Demostración
        ped_cod = 'PED-2026-0001'
        if not Pedido.objects.filter(PedCod=ped_cod).exists():
            pedido = Pedido.objects.create(
                PedCod=ped_cod,
                PedSolCod='SOL-DEMO-8812',
                CliCod='CLI-001',
                PedFecEmi=timezone.now().date(),
                MonCod='PEN',
                MedCod='TRANSFERENCIA',
                DocTipCod='01',
                PedDirEnt='Av. Ejército 710, Yanahuara, Arequipa',
                PedSubTot=Decimal('100.00'),
                PedIgvImp=Decimal('18.00'),
                PedTotImp=Decimal('118.00'),
                PedEstAct=EstadoPedido.REGISTRADO,
                PedRegIns=timezone.now(),
                PedRegAct='frontend_web',
            )

            PedidoDetalle.objects.create(
                PedDetCod='DET-0001',
                PedCod=pedido,
                ArtCod='ART-001',
                ArtNom='Teclado Mecánico Industrial RGB (Ejemplo PDF)',
                DetCan=Decimal('2.00'),
                DetPreUni=Decimal('50.00'),
                DetSubLin=Decimal('100.00'),
            )

            PedidoHistorial.objects.create(
                HisEstCod='HIS-0001',
                PedCod=pedido,
                HisEstAnt=None,
                HisEstNue=EstadoPedido.REGISTRADO,
                HisEstMot='Alta inicial del pedido virtual (RE_PedAltaAtom)',
                HisRegIns=timezone.now(),
                HisRegAct='frontend_web',
            )

        self.stdout.write(self.style.SUCCESS("Datos maestros de prueba cargados correctamente."))

