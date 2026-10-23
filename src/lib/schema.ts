export type Unidade = 'mL' | 'gotas' | 'comprimido' | 'cápsula' | 'sachê';
export type Jejum = 'exigido' | 'proibido' | 'nao';

export type Regra =
  | { tipo: 'inicioApos'; item: string }
  | { tipo: 'encerraQuandoInicia'; item: string };

export interface Item {
  id: string;
  ordem: number;
  nome: string;
  tipo: 'farmacia' | 'manipulado' | 'cuidado';
  via: 'oral' | 'sonda' | null;
  dose: { valor: number; exibir: string; unidade: Unidade } | null;
  /** Intervalo entre doses. Em itens condicionais, é o intervalo mínimo. */
  intervaloHoras: number;
  /** Horários fixos do dia ('HH:MM'). null = fora da rotina (condicional ou ainda não iniciado). */
  horarios: string[] | null;
  /** null = "até novas recomendações". */
  duracaoDias: number | null;
  /** Gatilho escrito na receita; itens condicionais não geram horários. */
  condicional: string | null;
  jejum: Jejum;
  /** Linha da receita, copiada literalmente. */
  original: string;
  obs: string[];
  duvidas: string[];
  regras: Regra[];
}

export interface Config {
  /** Primeira dose do tratamento: 'YYYY-MM-DDTHH:MM'. */
  inicio: string | null;
  /** Horários por intervalo ('8', '12', '24'); o de 48 h usa o '24'. */
  ancoras: Record<string, string[]>;
  /** Horários específicos de um remédio (sobrepõem a âncora do intervalo). */
  horariosItem: Record<string, string[]>;
  /** Último dia em que o item ainda é dado, definido pela tutora. */
  fimManual: Record<string, string>;
}

export interface Registro {
  status: 'dado' | 'pulado';
  em: string; // ISO local
}

export interface SosRegistro {
  itemId: string;
  em: string;
}

export interface Slot {
  itemId: string;
  data: string;
  hora: string;
  key: string;
}

export interface Plano {
  itemId: string;
  inicio: string | null;
  fim: string | null;
  slots: Slot[];
  /** true quando os horários ainda não foram escolhidos e as datas são estimadas. */
  estimado: boolean;
  semInicio: boolean;
}
