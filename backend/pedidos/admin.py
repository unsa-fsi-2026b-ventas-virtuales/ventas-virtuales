from django.contrib import admin
from .models import Articulo, Cliente, Pedido, PedidoDetalle, PedidoHistorial


class PedidoDetalleInline(admin.TabularInline):
    model = PedidoDetalle
    extra = 0


class PedidoHistorialInline(admin.TabularInline):
    model = PedidoHistorial
    extra = 0
    readonly_fields = ['HisEstCod', 'HisEstAnt', 'HisEstNue', 'HisEstMot', 'HisRegIns', 'HisRegAct']


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ['PedCod', 'PedSolCod', 'CliCod', 'PedFecEmi', 'PedTotImp', 'PedEstAct', 'PedRegIns']
    list_filter = ['PedEstAct', 'PedFecEmi', 'MedCod', 'DocTipCod']
    search_fields = ['PedCod', 'PedSolCod', 'CliCod', 'PedDirEnt']
    inlines = [PedidoDetalleInline, PedidoHistorialInline]


@admin.register(Articulo)
class ArticuloAdmin(admin.ModelAdmin):
    list_display = ['ArtCod', 'ArtNom', 'UniMedCod', 'ArtPreUni', 'ArtStkDis', 'ArtEstReg']
    search_fields = ['ArtCod', 'ArtNom']
    list_filter = ['ArtEstReg']


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['CliCod', 'DocIdeTip', 'CliDocNum', 'CliNom', 'CliCor', 'CliEstReg']
    search_fields = ['CliCod', 'CliNom', 'CliDocNum']
    list_filter = ['DocIdeTip', 'CliEstReg']
