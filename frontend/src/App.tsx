import React, { useState, useEffect } from 'react';
import type {
  I1M_ARTICULO,
  I1M_CLIENTE,
  I1T_PEDIDO,
  ItemCarrito,
  EstadoPedido,
} from './types';
import {
  api,
  MOCK_ARTICULOS,
  MOCK_CLIENTES,
  MOCK_PEDIDOS_INICIALES,
} from './api';

export function App() {
  const [pestana, setPestana] = useState<'catalogo' | 'carrito' | 'pedidos'>('catalogo');
  const [modoConexion, setModoConexion] = useState<'API' | 'LOCAL'>('LOCAL');

  // Estados de datos maestros y transaccionales
  const [articulos, setArticulos] = useState<I1M_ARTICULO[]>(MOCK_ARTICULOS);
  const [clientes] = useState<I1M_CLIENTE[]>(MOCK_CLIENTES);
  const [pedidos, setPedidos] = useState<I1T_PEDIDO[]>(MOCK_PEDIDOS_INICIALES);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Formulario de Registro de Pedido (I1T_PEDIDO)
  const [cliCod, setCliCod] = useState<string>('CLI-001');
  const [medCod, setMedCod] = useState<'TRANSFERENCIA' | 'TARJETA' | 'BILLETERA'>('TRANSFERENCIA');
  const [docTipCod, setDocTipCod] = useState<'01' | '03'>('01');
  const [pedDirEnt, setPedDirEnt] = useState<string>(MOCK_CLIENTES[0].CliDirEnt);
  const [pedSolCod, setPedSolCod] = useState<string>(() => `SOL-${Date.now()}`);

  // Mensajes de feedback y modal de estado
  const [alerta, setAlerta] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<I1T_PEDIDO | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPedido>('PAGADO');
  const [motivoEstado, setMotivoEstado] = useState<string>('');

  // Intentar cargar desde el backend Django al iniciar
  useEffect(() => {
    const cargarDesdeBackend = async () => {
      try {
        const res = await api.get('/pedidos/');
        if (Array.isArray(res.data)) {
          setPedidos(res.data);
          setModoConexion('API');
        }
      } catch {
        // Si el backend de Django no está levantado aún, funciona en modo local sin fallar
        setModoConexion('LOCAL');
      }
    };
    cargarDesdeBackend();
  }, []);

  // Actualizar dirección por defecto al cambiar de cliente
  const handleClienteChange = (nuevoCliCod: string) => {
    setCliCod(nuevoCliCod);
    const cli = clientes.find((c) => c.CliCod === nuevoCliCod);
    if (cli) {
      setPedDirEnt(cli.CliDirEnt);
      // Si el cliente tiene DNI ('1'), sugerir Boleta ('03')
      if (cli.DocIdeTip !== '6') setDocTipCod('03');
    }
  };

  // --- FUNCIONES DEL CARRITO (RE_DetUnicoArt y RE_DetCanPos) ---
  const agregarAlCarrito = (articulo: I1M_ARTICULO) => {
    setAlerta(null);
    const stockMax = parseFloat(articulo.ArtStkDis);
    const existente = carrito.find((item) => item.articulo.ArtCod === articulo.ArtCod);

    if (existente) {
      if (existente.cantidad + 1 > stockMax) {
        setAlerta({
          tipo: 'error',
          msg: `RE_DetCanPos: No puedes superar el stock disponible en Almacén (${stockMax} ${articulo.UniMedCod}).`,
        });
        return;
      }
      setCarrito(
        carrito.map((item) =>
          item.articulo.ArtCod === articulo.ArtCod
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      if (stockMax < 1) {
        setAlerta({ tipo: 'error', msg: 'RE_ArtStock: Artículo sin stock disponible.' });
        return;
      }
      setCarrito([...carrito, { articulo, cantidad: 1 }]);
    }
    setAlerta({ tipo: 'ok', msg: `Se agregó "${articulo.ArtNom}" al carrito.` });
  };

  const cambiarCantidadCarrito = (artCod: string, nuevaCantidad: number) => {
    setAlerta(null);
    const item = carrito.find((i) => i.articulo.ArtCod === artCod);
    if (!item) return;

    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter((i) => i.articulo.ArtCod !== artCod));
      return;
    }

    const stockMax = parseFloat(item.articulo.ArtStkDis);
    if (nuevaCantidad > stockMax) {
      setAlerta({
        tipo: 'error',
        msg: `RE_DetCanPos: La cantidad solicitada (${nuevaCantidad}) supera el stock disponible (${stockMax}).`,
      });
      return;
    }

    setCarrito(
      carrito.map((i) =>
        i.articulo.ArtCod === artCod ? { ...i, cantidad: nuevaCantidad } : i
      )
    );
  };

  // --- CÁLCULOS EXACTOS A 2 DECIMALES (RE_DetSubCalc y RE_PedTotCuadre) ---
  const calcularTotales = () => {
    const subtotalCents = carrito.reduce((acc, item) => {
      const precioCents = Math.round(parseFloat(item.articulo.ArtPreUni) * 100);
      return acc + precioCents * item.cantidad;
    }, 0);

    const igvCents = Math.round(subtotalCents * 0.18);
    const totalCents = subtotalCents + igvCents;

    return {
      PedSubTot: (subtotalCents / 100).toFixed(2),
      PedIgvImp: (igvCents / 100).toFixed(2),
      PedTotImp: (totalCents / 100).toFixed(2),
    };
  };

  const totales = calcularTotales();

  // --- CREATE: REGISTRAR PEDIDO VIRTUAL (POST /api/pedidos/) ---
  const confirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    const clienteActual = clientes.find((c) => c.CliCod === cliCod);
    if (!clienteActual) return;

    // Validación RE_CliEst: cliente activo
    if (clienteActual.CliEstReg !== 'A') {
      setAlerta({
        tipo: 'error',
        msg: 'RE_CliEst: Solo clientes activos (Estado = A) admiten nuevos pedidos virtuales.',
      });
      return;
    }

    // Validación Carrito no vacío
    if (carrito.length === 0) {
      setAlerta({ tipo: 'error', msg: 'El carrito está vacío. Agregue al menos un artículo.' });
      return;
    }

    // Validación RE_PedDirObl: dirección obligatoria
    if (!pedDirEnt.trim()) {
      setAlerta({
        tipo: 'error',
        msg: 'RE_PedDirObl: La dirección de entrega no puede estar vacía para Distribución.',
      });
      return;
    }

    // Validación RE_TipCompRuc: Factura (01) exige RUC (Tipo Doc 6)
    if (docTipCod === '01' && clienteActual.DocIdeTip !== '6') {
      setAlerta({
        tipo: 'error',
        msg: 'RE_TipCompRuc: Si solicita Factura (01), el cliente debe contar con RUC (Tipo Doc = 6).',
      });
      return;
    }

    // Validación RE_PedAltaIdem: Idempotencia por PedSolCod
    const pedidoDuplicado = pedidos.find((p) => p.PedSolCod === pedSolCod);
    if (pedidoDuplicado) {
      setAlerta({
        tipo: 'error',
        msg: `RE_PedAltaIdem: Ya existe el pedido ${pedidoDuplicado.PedCod} con el token ${pedSolCod}. Se evitó duplicar el registro.`,
      });
      return;
    }

    const ahoraISO = new Date().toISOString();
    const fechaCivil = ahoraISO.split('T')[0];
    const nuevoPedCod = `PED-2026-000${pedidos.length + 1}`;

    const nuevoPedido: I1T_PEDIDO = {
      PedCod: nuevoPedCod,
      PedSolCod: pedSolCod,
      CliCod: cliCod,
      PedFecEmi: fechaCivil,
      MonCod: 'PEN',
      MedCod: medCod,
      DocTipCod: docTipCod,
      PedDirEnt: pedDirEnt.trim(),
      PedSubTot: totales.PedSubTot,
      PedIgvImp: totales.PedIgvImp,
      PedTotImp: totales.PedTotImp,
      PedEstAct: 'REGISTRADO',
      PedRegIns: ahoraISO,
      PedRegAct: 'usuario_web',
      detalles: carrito.map((item, idx) => {
        const subLin = (parseFloat(item.articulo.ArtPreUni) * item.cantidad).toFixed(2);
        return {
          PedDetCod: `${nuevoPedCod}-D0${idx + 1}`,
          PedCod: nuevoPedCod,
          ArtCod: item.articulo.ArtCod,
          ArtNom: item.articulo.ArtNom,
          DetCan: item.cantidad.toFixed(2),
          DetPreUni: item.articulo.ArtPreUni,
          DetSubLin: subLin,
        };
      }),
      historial: [
        {
          HisEstCod: `HIS-${Date.now()}`,
          PedCod: nuevoPedCod,
          HisEstAnt: null,
          HisEstNue: 'REGISTRADO',
          HisEstMot: 'Registro inicial del pedido virtual (RE_PedAltaAtom)',
          HisRegIns: ahoraISO,
          HisRegAct: 'usuario_web',
        },
      ],
    };

    try {
      if (modoConexion === 'API') {
        const res = await api.post('/pedidos/', nuevoPedido);
        setPedidos([res.data, ...pedidos]);
      } else {
        // Descontar stock local y guardar pedido
        setArticulos(
          articulos.map((art) => {
            const enCarrito = carrito.find((c) => c.articulo.ArtCod === art.ArtCod);
            if (!enCarrito) return art;
            const nuevoStock = (parseFloat(art.ArtStkDis) - enCarrito.cantidad).toFixed(2);
            return { ...art, ArtStkDis: nuevoStock };
          })
        );
        setPedidos([nuevoPedido, ...pedidos]);
      }

      setCarrito([]);
      setPedSolCod(`SOL-${Date.now()}`);
      setPedidoSeleccionado(nuevoPedido);
      setPestana('pedidos');
      setAlerta({
        tipo: 'ok',
        msg: `Pedido ${nuevoPedCod} registrado con éxito en estado REGISTRADO. Total: S/ ${nuevoPedido.PedTotImp}`,
      });
    } catch (err: any) {
      setAlerta({
        tipo: 'error',
        msg: err.response?.data?.detail || 'Error al registrar el pedido en el servidor.',
      });
    }
  };

  // --- UPDATE / DELETE LÓGICO: CAMBIAR ESTADO (POST /api/pedidos/{id}/estados/) ---
  const actualizarEstadoPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoSeleccionado) return;
    setAlerta(null);

    // Validación RE_HisAnul: Anular exige motivo obligatorio
    if (nuevoEstado === 'ANULADO' && !motivoEstado.trim()) {
      setAlerta({
        tipo: 'error',
        msg: 'RE_HisAnul: La transición al estado ANULADO exige un motivo no vacío.',
      });
      return;
    }

    const ahoraISO = new Date().toISOString();
    const nuevoEvento = {
      HisEstCod: `HIS-${Date.now()}`,
      PedCod: pedidoSeleccionado.PedCod,
      HisEstAnt: pedidoSeleccionado.PedEstAct,
      HisEstNue: nuevoEstado,
      HisEstMot:
        motivoEstado.trim() || `Cambio a ${nuevoEstado} notificado por integración ERP`,
      HisRegIns: ahoraISO,
      HisRegAct:
        nuevoEstado === 'PAGADO'
          ? 'srv_caja_ingresos'
          : nuevoEstado === 'RESERVADO'
          ? 'srv_almacen'
          : nuevoEstado === 'EN_ENVIO' || nuevoEstado === 'ENTREGADO'
          ? 'srv_distribucion'
          : 'admin_ventas',
    };

    try {
      if (modoConexion === 'API') {
        await api.post(`/pedidos/${pedidoSeleccionado.PedCod}/estados/`, {
          HisEstNue: nuevoEstado,
          HisEstMot: nuevoEvento.HisEstMot,
        });
      }

      const pedidoActualizado: I1T_PEDIDO = {
        ...pedidoSeleccionado,
        PedEstAct: nuevoEstado,
        historial: [...pedidoSeleccionado.historial, nuevoEvento],
      };

      setPedidos(
        pedidos.map((p) =>
          p.PedCod === pedidoSeleccionado.PedCod ? pedidoActualizado : p
        )
      );
      setPedidoSeleccionado(pedidoActualizado);
      setMotivoEstado('');
      setAlerta({
        tipo: 'ok',
        msg: `Estado del pedido ${pedidoSeleccionado.PedCod} actualizado a ${nuevoEstado} (Registrado en I1T_PEDIDO_EST_HIS).`,
      });
    } catch {
      setAlerta({ tipo: 'error', msg: 'No se pudo actualizar el estado del pedido.' });
    }
  };

  const colorEstado = (estado: EstadoPedido) => {
    switch (estado) {
      case 'REGISTRADO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PAGADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'RESERVADO':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'EN_ENVIO':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ENTREGADO':
        return 'bg-green-200 text-green-900 border-green-400';
      case 'ANULADO':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Barra superior institucional UNSA */}
      <header className="bg-[#5b141d] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
              UNSA · ERP Ingresos · Tribu Ingresos (Grupo B)
            </span>
            <h1 className="text-2xl font-bold">
              Módulo de Ventas Virtuales (CRUD Pedidos)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded bg-black/30 border border-white/20">
              Modo: {modoConexion === 'API' ? 'Conectado a Django API' : 'Demo Local (Diccionario I1T_*)'}
            </span>
            <nav className="flex bg-black/25 p-1 rounded-lg">
              <button
                onClick={() => setPestana('catalogo')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  pestana === 'catalogo' ? 'bg-white text-[#5b141d]' : 'text-white hover:bg-white/10'
                }`}
              >
                1. Catálogo (I1M_ARTICULO)
              </button>
              <button
                onClick={() => setPestana('carrito')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  pestana === 'carrito' ? 'bg-white text-[#5b141d]' : 'text-white hover:bg-white/10'
                }`}
              >
                2. Carrito / Alta ({carrito.reduce((a, b) => a + b.cantidad, 0)})
              </button>
              <button
                onClick={() => setPestana('pedidos')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  pestana === 'pedidos' ? 'bg-white text-[#5b141d]' : 'text-white hover:bg-white/10'
                }`}
              >
                3. Pedidos y Estados ({pedidos.length})
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Alertas de validación */}
        {alerta && (
          <div
            className={`mb-6 p-4 rounded-lg border flex justify-between items-center ${
              alerta.tipo === 'ok'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <span className="text-sm font-medium">{alerta.msg}</span>
            <button
              onClick={() => setAlerta(null)}
              className="text-xs font-bold uppercase px-2 py-1 rounded hover:bg-black/5"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* VISTA 1: CATÁLOGO DE ARTÍCULOS */}
        {pestana === 'catalogo' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Catálogo de Artículos Disponibles (I1M_ARTICULO)
                </h2>
                <p className="text-sm text-slate-600">
                  Precios exactos NUMERIC(14,2) en PEN y control de stock sincronizado con Almacén.
                </p>
              </div>
              <button
                onClick={() => setPestana('carrito')}
                className="bg-[#5b141d] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#460f16]"
              >
                Ir al Carrito ({carrito.reduce((a, b) => a + b.cantidad, 0)} ítems) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {articulos.map((art) => (
                <div
                  key={art.ArtCod}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {art.ArtCod}
                      </span>
                      <span>Unidad: {art.UniMedCod}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2">
                      {art.ArtNom}
                    </h3>
                    <p className="text-2xl font-extrabold text-[#5b141d] mb-2">
                      S/ {art.ArtPreUni}
                    </p>
                    <p className="text-xs text-slate-600 mb-4">
                      Stock en Almacén (ArtStkDis):{' '}
                      <span className="font-semibold text-slate-900">{art.ArtStkDis}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => agregarAlCarrito(art)}
                    className="w-full bg-slate-900 hover:bg-[#5b141d] text-white font-medium py-2 rounded-lg text-sm transition"
                  >
                    + Agregar al carrito
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 2: CARRITO Y REGISTRO DE PEDIDO (CREATE) */}
        {pestana === 'carrito' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabla de líneas del carrito (I1T_PEDIDO_DET) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold mb-4">
                Detalle del Carrito (Futuro I1T_PEDIDO_DET)
              </h2>

              {carrito.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No hay artículos en el carrito. Ve a la pestaña Catálogo para agregar productos.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2">Código (ArtCod)</th>
                        <th className="py-2">Artículo</th>
                        <th className="py-2 text-right">Precio (DetPreUni)</th>
                        <th className="py-2 text-center">Cantidad (DetCan)</th>
                        <th className="py-2 text-right">Subtotal (DetSubLin)</th>
                        <th className="py-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrito.map(({ articulo, cantidad }) => {
                        const subLin = (parseFloat(articulo.ArtPreUni) * cantidad).toFixed(2);
                        return (
                          <tr key={articulo.ArtCod} className="border-b border-slate-100">
                            <td className="py-3 font-mono text-xs">{articulo.ArtCod}</td>
                            <td className="py-3 font-medium">{articulo.ArtNom}</td>
                            <td className="py-3 text-right">S/ {articulo.ArtPreUni}</td>
                            <td className="py-3 text-center">
                              <div className="inline-flex items-center border rounded-md">
                                <button
                                  type="button"
                                  onClick={() =>
                                    cambiarCantidadCarrito(articulo.ArtCod, cantidad - 1)
                                  }
                                  className="px-2.5 py-1 hover:bg-slate-100"
                                >
                                  -
                                </button>
                                <span className="px-3 font-semibold">{cantidad}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    cambiarCantidadCarrito(articulo.ArtCod, cantidad + 1)
                                  }
                                  className="px-2.5 py-1 hover:bg-slate-100"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3 text-right font-bold">S/ {subLin}</td>
                            <td className="py-3 text-center">
                              <button
                                type="button"
                                onClick={() => cambiarCantidadCarrito(articulo.ArtCod, 0)}
                                className="text-red-600 hover:underline text-xs font-semibold"
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cuadre financiero RE_PedTotCuadre */}
              <div className="mt-6 border-t pt-4 flex flex-col items-end space-y-1 text-sm">
                <div className="flex justify-between w-64">
                  <span className="text-slate-600">Subtotal (PedSubTot):</span>
                  <span className="font-semibold">S/ {totales.PedSubTot}</span>
                </div>
                <div className="flex justify-between w-64">
                  <span className="text-slate-600">IGV 18% (PedIgvImp):</span>
                  <span className="font-semibold">S/ {totales.PedIgvImp}</span>
                </div>
                <div className="flex justify-between w-64 text-lg font-extrabold text-[#5b141d] border-t pt-1">
                  <span>Total (PedTotImp):</span>
                  <span>S/ {totales.PedTotImp}</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Cumple RE_PedTotCuadre: PedTotImp = PedSubTot + PedIgvImp (Moneda: PEN)
                </span>
              </div>
            </div>

            {/* Formulario Cabecera del Pedido (I1T_PEDIDO) */}
            <form
              onSubmit={confirmarPedido}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4"
            >
              <h2 className="text-lg font-bold border-b pb-2">
                Datos de Cabecera (I1T_PEDIDO)
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Cliente Comprador (CliCod)
                </label>
                <select
                  value={cliCod}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {clientes.map((c) => (
                    <option key={c.CliCod} value={c.CliCod}>
                      {c.CliNom} ({c.DocIdeTip === '6' ? 'RUC' : 'DNI'}: {c.CliDocNum}) - Est:{' '}
                      {c.CliEstReg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Comprobante (DocTipCod)
                  </label>
                  <select
                    value={docTipCod}
                    onChange={(e) => setDocTipCod(e.target.value as '01' | '03')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="01">01 - Factura (Exige RUC)</option>
                    <option value="03">03 - Boleta de Venta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Medio Pago (MedCod)
                  </label>
                  <select
                    value={medCod}
                    onChange={(e) =>
                      setMedCod(e.target.value as 'TRANSFERENCIA' | 'TARJETA' | 'BILLETERA')
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                    <option value="TARJETA">TARJETA</option>
                    <option value="BILLETERA">BILLETERA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Dirección de Entrega (PedDirEnt) *
                </label>
                <input
                  type="text"
                  value={pedDirEnt}
                  onChange={(e) => setPedDirEnt(e.target.value)}
                  placeholder="Dirección obligatoria para Distribución"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Token de Idempotencia (PedSolCod - RE_PedAltaIdem)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pedSolCod}
                    onChange={(e) => setPedSolCod(e.target.value)}
                    className="w-full font-mono border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setPedSolCod(`SOL-${Date.now()}`)}
                    className="text-xs bg-slate-200 px-2.5 rounded hover:bg-slate-300"
                  >
                    Nuevo
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#5b141d] hover:bg-[#460f16] text-white font-bold py-2.5 rounded-lg text-sm transition shadow"
              >
                Confirmar y Registrar Pedido (POST /api/pedidos/)
              </button>
            </form>
          </div>
        )}

        {/* VISTA 3: LISTADO, SEGUIMIENTO Y CAMBIO DE ESTADO (READ / UPDATE / ANULAR) */}
        {pestana === 'pedidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabla de Pedidos Registrados */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold mb-4">
                Pedidos Virtuales Registrados (I1T_PEDIDO)
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2">Código (PedCod)</th>
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Comprobante</th>
                      <th className="py-2 text-right">Total (PEN)</th>
                      <th className="py-2 text-center">Estado (PedEstAct)</th>
                      <th className="py-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((ped) => {
                      const cli = clientes.find((c) => c.CliCod === ped.CliCod);
                      return (
                        <tr
                          key={ped.PedCod}
                          className={`border-b border-slate-100 hover:bg-slate-50 ${
                            pedidoSeleccionado?.PedCod === ped.PedCod ? 'bg-amber-50/60' : ''
                          }`}
                        >
                          <td className="py-3 font-mono font-bold text-xs">{ped.PedCod}</td>
                          <td className="py-3">
                            <div className="font-medium">{cli?.CliNom || ped.CliCod}</div>
                            <div className="text-xs text-slate-400">Token: {ped.PedSolCod}</div>
                          </td>
                          <td className="py-3 text-xs">
                            {ped.DocTipCod === '01' ? '01 - Factura' : '03 - Boleta'} ({ped.MedCod})
                          </td>
                          <td className="py-3 text-right font-bold">S/ {ped.PedTotImp}</td>
                          <td className="py-3 text-center">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colorEstado(
                                ped.PedEstAct
                              )}`}
                            >
                              {ped.PedEstAct}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => setPedidoSeleccionado(ped)}
                              className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-[#5b141d]"
                            >
                              Ver / Cambiar Estado
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel de Detalle e Historial de Estados (I1T_PEDIDO_EST_HIS) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {!pedidoSeleccionado ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Selecciona un pedido de la tabla para inspeccionar sus líneas (`I1T_PEDIDO_DET`),
                  su historial (`I1T_PEDIDO_EST_HIS`) o actualizar su estado.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="border-b pb-3 flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-400 font-mono">
                        {pedidoSeleccionado.PedSolCod}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        Pedido {pedidoSeleccionado.PedCod}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Entrega: {pedidoSeleccionado.PedDirEnt}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colorEstado(
                        pedidoSeleccionado.PedEstAct
                      )}`}
                    >
                      {pedidoSeleccionado.PedEstAct}
                    </span>
                  </div>

                  {/* Líneas del pedido */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                      Líneas del Pedido (I1T_PEDIDO_DET)
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
                      {pedidoSeleccionado.detalles.map((d) => (
                        <div key={d.ArtCod} className="flex justify-between">
                          <span>
                            {d.DetCan} x {d.ArtNom || d.ArtCod} (S/ {d.DetPreUni})
                          </span>
                          <span className="font-bold">S/ {d.DetSubLin}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                        <span>
                          Subtotal: S/ {pedidoSeleccionado.PedSubTot} + IGV: S/{' '}
                          {pedidoSeleccionado.PedIgvImp}
                        </span>
                        <span>Total: S/ {pedidoSeleccionado.PedTotImp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Formulario para transición de estado (Update / Anular) */}
                  <form onSubmit={actualizarEstadoPedido} className="border-t pt-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500">
                      Actualizar Estado (POST /api/pedidos/{'{id}'}/estados/)
                    </h4>
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value as EstadoPedido)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="PAGADO">PAGADO (Caja de Ingresos)</option>
                      <option value="RESERVADO">RESERVADO (Almacén)</option>
                      <option value="EN_ENVIO">EN_ENVIO (Distribución)</option>
                      <option value="ENTREGADO">ENTREGADO (Distribución)</option>
                      <option value="ANULADO">ANULADO (Exige motivo - RE_HisAnul)</option>
                    </select>

                    <input
                      type="text"
                      value={motivoEstado}
                      onChange={(e) => setMotivoEstado(e.target.value)}
                      placeholder={
                        nuevoEstado === 'ANULADO'
                          ? 'Motivo de anulación OBLIGATORIO (RE_HisAnul)*'
                          : 'Observación o referencia externa (opcional)'
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-[#5b141d] text-white font-semibold py-2 rounded-lg text-xs transition"
                    >
                      Registrar Cambio de Estado
                    </button>
                  </form>

                  {/* Historial de Auditoría I1T_PEDIDO_EST_HIS */}
                  <div className="border-t pt-4">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                      Trazabilidad de Estados (I1T_PEDIDO_EST_HIS)
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pedidoSeleccionado.historial.map((h) => (
                        <div
                          key={h.HisEstCod}
                          className="text-xs bg-slate-50 border border-slate-200 rounded p-2"
                        >
                          <div className="flex justify-between font-bold">
                            <span>
                              {h.HisEstAnt ? `${h.HisEstAnt} → ` : ''}
                              {h.HisEstNue}
                            </span>
                            <span className="text-slate-400 font-mono">{h.HisRegAct}</span>
                          </div>
                          <div className="text-slate-600 mt-0.5">{h.HisEstMot}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;