export type EstadoPedido =
  | 'REGISTRADO'
  | 'PAGADO'
  | 'RESERVADO'
  | 'EN_ENVIO'
  | 'ENTREGADO'
  | 'ANULADO';

export interface I1M_ARTICULO {
  ArtCod: string;
  ArtNom: string;
  UniMedCod: string;
  ArtPreUni: string;
  ArtStkDis: string;
  ArtEstReg: string;
}

export interface I1M_CLIENTE {
  CliCod: string;
  DocIdeTip: string; // '1' DNI, '6' RUC
  CliDocNum: string;
  CliNom: string;
  CliCor: string;
  CliDirEnt: string;
  CliEstReg: string; // 'A' Activo, 'I' Inactivo
}

export interface I1T_PEDIDO_DETALLE {
  PedDetCod?: string;
  PedCod?: string;
  ArtCod: string;
  ArtNom?: string;
  DetCan: string | number;
  DetPreUni: string | number;
  DetSubLin: string | number;
}

export interface I1T_PEDIDO_HISTORIAL {
  HisEstCod?: string;
  PedCod?: string;
  HisEstAnt: string | null;
  HisEstNue: EstadoPedido;
  HisEstMot: string;
  HisRegIns?: string;
  HisRegAct?: string;
}

export interface I1T_PEDIDO {
  PedCod: string;
  PedSolCod?: string;
  CliCod: string;
  PedFecEmi: string;
  MonCod: string;
  MedCod: string;
  DocTipCod: string;
  PedDirEnt: string;
  PedSubTot: string;
  PedIgvImp: string;
  PedTotImp: string;
  PedEstAct: EstadoPedido;
  PedRegIns?: string;
  PedRegAct?: string;
  detalles: I1T_PEDIDO_DETALLE[];
  historial?: I1T_PEDIDO_HISTORIAL[];
}

export interface ItemCarrito {
  articulo: I1M_ARTICULO;
  cantidad: number;
}
