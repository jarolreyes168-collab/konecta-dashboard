export interface FormFlowRule {
  id: string;
  campoOrigen: string;
  condicion: 'equals' | 'not_equals' | 'contains' | 'in';
  valorCondicion: any;
  mostrarCampos: string[];
  ocultarCampos: string[];
  requerido: boolean;
}

export interface FormFlowConfig {
  reglas: FormFlowRule[];
  grupos: Record<string, string[]>;
}

export interface FormFlowHistoryEntry {
  versionIndex: number;
  timestamp: string;
  autor: string;
  config: FormFlowConfig;
}
