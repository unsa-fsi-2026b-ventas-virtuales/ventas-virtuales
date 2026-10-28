import axios from 'axios';
import type { I1M_ARTICULO, I1M_CLIENTE, I1T_PEDIDO, EstadoPedido } from './types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Datos iniciales basados en el Diccionario de Datos y ejemplo de la página 2 y 6 del PDF
export const MOCK_CLIENTES: I1M_CLIENTE[] = [
  {
    CliCod: 'CLI-001',
    DocIdeTip: '6', // RUC
    CliDocNum: '20601234567',
    CliNom: 'COMERCIAL AREQUIPA S.A.C.',
    CliCor: 'compras@comercialaqp.pe',
    CliDirEnt: 'Av. Ejército 710, Yanahuara, Arequipa',
    CliEstReg: 'A',
  },
  {
    CliCod: 'CLI-002',
    DocIdeTip: '1', // DNI
    CliDocNum: '72345678',
    CliNom: 'JUAN PEREZ QUISPE',
    CliCor: 'juan.perez@unsa.edu.pe',
    CliDirEnt: 'Calle Mercaderes 215, Cercado, Arequipa',
    CliEstReg: 'A',
  },
  {
    CliCod: 'CLI-003',
    DocIdeTip: '1',
    CliDocNum: '40112233',
    CliNom: 'CLIENTE INACTIVO DEMO',
    CliCor: 'inactivo@correo.pe',
    CliDirEnt: 'Av. Venezuela s/n',
    CliEstReg: 'I', // Para demostrar regla RE_CliEst
  },
];

export const MOCK_ARTICULOS: I1M_ARTICULO[] = [
  {
    ArtCod: 'ART-001',
    ArtNom: 'Teclado Mecánico Industrial RGB (Ejemplo PDF)',
    UniMedCod: 'NIU',
    ArtPreUni: '50.00', // Ejemplo exacto del PDF pág 2 y 6: 2 uds x 50.00 = 100 + 18 IGV = 118.00
    ArtStkDis: '25.00',
    ArtEstReg: 'A',
  },
  {
    ArtCod: 'ART-002',
    ArtNom: 'Monitor IPS 24" Full HD 75Hz',
    UniMedCod: 'NIU',
    ArtPreUni: '450.00',
    ArtStkDis: '10.00',
    ArtEstReg: 'A',
  },
  {
    ArtCod: 'ART-003',
    ArtNom: 'Mouse Inalámbrico Ergonómico',
    UniMedCod: 'NIU',
    ArtPreUni: '80.00',
    ArtStkDis: '15.00',
    ArtEstReg: 'A',
  },
  {
    ArtCod: 'ART-004',
    ArtNom: 'Licencia Antivirus Corporativo Anual',
    UniMedCod: 'ZZ',
    ArtPreUni: '120.00',
    ArtStkDis: '50.00',
    ArtEstReg: 'A',
  },
];

export const MOCK_PEDIDOS_INICIALES: I1T_PEDIDO[] = [
  {
    PedCod: 'PED-2026-0001',
    PedSolCod: 'SOL-DEMO-8812',
    CliCod: 'CLI-001',
    PedFecEmi: '2026-10-26',
    MonCod: 'PEN',
    MedCod: 'TRANSFERENCIA',
    DocTipCod: '01',
    PedDirEnt: 'Av. Ejército 710, Yanahuara, Arequipa',
    PedSubTot: '100.00',
    PedIgvImp: '18.00',
    PedTotImp: '118.00',
    PedEstAct: 'REGISTRADO',
    PedRegIns: '2026-10-26T10:30:00-05:00',
    PedRegAct: 'frontend_web',
    detalles: [
      {
        PedDetCod: 'DET-0001',
        PedCod: 'PED-2026-0001',
        ArtCod: 'ART-001',
        ArtNom: 'Teclado Mecánico Industrial RGB (Ejemplo PDF)',
        DetCan: '2.00',
        DetPreUni: '50.00',
        DetSubLin: '100.00',
      },
    ],
    historial: [
      {
        HisEstCod: 'HIS-0001',
        PedCod: 'PED-2026-0001',
        HisEstAnt: null,
        HisEstNue: 'REGISTRADO',
        HisEstMot: 'Alta inicial del pedido virtual (RE_PedAltaAtom)',
        HisRegIns: '2026-10-26T10:30:00-05:00',
        HisRegAct: 'frontend_web',
      },
    ],
  },
];