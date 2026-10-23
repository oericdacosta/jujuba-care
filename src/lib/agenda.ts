import { addDays, diffDays } from './dates';
import type { Config, Item, Plano, Registro, Slot } from './schema';
import { INICIO_TRATAMENTO } from './seed';

const HORIZONTE_DIAS = 60;

/** Horários fixos do remédio, em ordem do dia; null se está fora da rotina. */
export function horariosDoItem(item: Item): string[] | null {
  return item.horarios && item.horarios.length ? [...item.horarios].sort() : null;
}

/** Total de doses de um tratamento com prazo: dias × doses por dia (no de 48 h, metade dos dias). */
export function totalDeDoses(item: Item): number {
  if (item.duracaoDias == null || !item.horarios) return Infinity;
  return Math.round(item.duracaoDias * item.horarios.length * Math.min(1, 24 / item.intervaloHoras));
}

export function slotKey(itemId: string, data: string, hora: string): string {
  return `${itemId}|${data}T${hora}`;
}

export function resolver(itens: Item[], cfg: Config, inicio: string = INICIO_TRATAMENTO): Record<string, Plano> {
  const porId = new Map(itens.map((i) => [i.id, i]));
  const out: Record<string, Plano> = {};
  const pilha = new Set<string>();

  const vazio = (itemId: string): Plano => ({
    itemId, inicio: null, fim: null, slots: [], estimado: false, semInicio: false,
  });

  function obter(id: string): Plano {
    if (out[id]) return out[id];
    if (pilha.has(id)) throw new Error(`Ciclo de dependências em "${id}"`);
    const item = porId.get(id);
    if (!item) throw new Error(`Item desconhecido: "${id}"`);
    pilha.add(id);
    out[id] = calcular(item);
    pilha.delete(id);
    return out[id];
  }

  function calcular(item: Item): Plano {
    const horarios = horariosDoItem(item);
    if (item.condicional || !horarios) return vazio(item.id);

    let inicioData = inicio.slice(0, 10);
    let aPartirDe: string | null = inicio;
    const dep = item.regras.find((r) => r.tipo === 'inicioApos');
    if (dep) {
      const fimDep = obter(dep.item).fim;
      if (!fimDep) return vazio(item.id);
      inicioData = addDays(fimDep, 1);
      aPartirDe = null;
    }

    // Só encerra quando o outro remédio de fato está na rotina.
    const encerra = item.regras.find((r) => r.tipo === 'encerraQuandoInicia');
    const limite = encerra ? obter(encerra.item).inicio : null;

    const total = totalDeDoses(item);
    const dataMax = item.duracaoDias == null
      ? addDays(inicio.slice(0, 10), HORIZONTE_DIAS)
      : addDays(inicioData, item.duracaoDias + 2);
    const fimManual = cfg.fimManual[item.id];

    const slots: Slot[] = [];
    for (let d = 0; slots.length < total; d++) {
      const data = addDays(inicioData, d);
      if (data > dataMax) break;
      if (limite && data >= limite) break;
      if (fimManual && data > fimManual) break;
      if (item.intervaloHoras === 48 && d % 2 === 1) continue;
      for (const hora of horarios) {
        if (aPartirDe && `${data}T${hora}` < aPartirDe) continue;
        if (slots.length >= total) break;
        slots.push({ itemId: item.id, data, hora, key: slotKey(item.id, data, hora) });
      }
    }

    const ultimo = slots[slots.length - 1];
    const terminaSozinho = item.duracaoDias != null || Boolean(fimManual) || Boolean(limite);
    return {
      itemId: item.id,
      inicio: slots[0]?.data ?? null,
      fim: terminaSozinho && ultimo ? ultimo.data : null,
      slots,
      estimado: false,
      semInicio: false,
    };
  }

  for (const item of itens) obter(item.id);
  return out;
}

export type Estado = 'feito' | 'pulado' | 'pendente';

export interface DoseDoDia {
  slot: Slot;
  item: Item;
  estado: Estado;
  registro?: Registro;
}

export function agendaDoDia(
  data: string,
  itens: Item[],
  planos: Record<string, Plano>,
  doses: Record<string, Registro>,
): DoseDoDia[] {
  const out: DoseDoDia[] = [];
  for (const item of itens) {
    const plano = planos[item.id];
    if (!plano) continue;
    for (const slot of plano.slots) {
      if (slot.data !== data) continue;
      const registro = doses[slot.key];
      out.push({
        slot, item, registro,
        estado: registro ? (registro.status === 'dado' ? 'feito' : 'pulado') : 'pendente',
      });
    }
  }
  return out.sort((a, b) => a.slot.hora.localeCompare(b.slot.hora) || a.item.ordem - b.item.ordem);
}

/** "Dia N de Y" do item na data, ou null se fora do período. */
export function diaDoTratamento(item: Item, plano: Plano, data: string): { n: number; de: number | null } | null {
  if (!plano.inicio || data < plano.inicio) return null;
  if (plano.fim && data > plano.fim) return null;
  const n = diffDays(plano.inicio, data) + 1;
  const de = plano.fim ? diffDays(plano.inicio, plano.fim) + 1 : null;
  return { n, de };
}
