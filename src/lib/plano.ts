import { addDays, fmtBR } from './dates';
import { GRUPOS, horariosDoGrupo } from './agenda';
import type { Config, Item, Plano } from './schema';
import { periodo } from './util';

/** Dados do plano impresso, sem nada de desenho (dá para testar sem PDF). */

export interface LinhaRotina {
  item: Item;
  dose: string;
  notas: string;
  periodo: string;
}

export interface BlocoHora {
  hora: string;
  nome: string;
  linhas: LinhaRotina[];
}

export interface LinhaChecklist {
  hora: string;
  item: Item;
  dose: string;
  /** Um valor por dia: true = tem dose nesse dia e horário. */
  dias: boolean[];
}

export interface DadosPlano {
  desde: string;
  dias: string[];
  grupos: { titulo: string; horarios: string[]; remedios: string[] }[];
  rotina: BlocoHora[];
  checklist: LinhaChecklist[];
  sos: { item: Item; dose: string; quando: string; intervalo: string }[];
  datas: { data: string; texto: string }[];
}

const nomePorId = (itens: Item[], id: string) => itens.find((i) => i.id === id)?.nome ?? id;

export function notasDoItem(item: Item, itens: Item[]): string {
  const n: string[] = [];
  if (item.jejum === 'exigido') n.push('Em jejum');
  if (item.jejum === 'proibido') n.push('Com comida');
  if (item.intervaloHoras === 48) n.push('Dia sim, dia não');
  if (item.obs.some((o) => /diluída/i.test(o))) n.push('Não diluir');
  if (item.tipo === 'cuidado') n.push('Soro fisiológico e gaze, com luvas');
  for (const r of item.regras) {
    if (r.tipo === 'inicioApos') n.push(`Só depois de terminar: ${nomePorId(itens, r.item)}`);
    if (r.tipo === 'encerraQuandoInicia') n.push(`Suspender quando começar: ${nomePorId(itens, r.item)}`);
  }
  return n.join('. ');
}

function textoPeriodo(p: Plano): string {
  if (!p.inicio) return '';
  if (p.fim) return p.inicio === p.fim ? fmtBR(p.inicio) : `${fmtBR(p.inicio)} a ${fmtBR(p.fim)}`;
  return `Desde ${fmtBR(p.inicio)}, contínuo`;
}

export function montarDados(
  itens: Item[],
  planos: Record<string, Plano>,
  cfg: Config,
  desde: string,
  nDias: number,
  retorno: string | null,
): DadosPlano {
  const dias = Array.from({ length: nDias }, (_, i) => addDays(desde, i));
  const ate = dias[dias.length - 1];

  const ativos = itens.filter((i) => {
    const p = planos[i.id];
    return !i.condicional && p && !p.estimado && p.slots.length > 0 && (!p.fim || p.fim >= desde);
  });

  const grupos = GRUPOS.map((g) => ({
    titulo: g.titulo,
    horarios: horariosDoGrupo(g.chave, g.n, cfg) ?? [],
    remedios: ativos.filter((i) => String(i.intervaloHoras >= 24 ? 24 : i.intervaloHoras) === g.chave).map((i) => i.nome),
  })).filter((g) => g.remedios.length);

  // Rotina: cada horário do dia com os remédios dele.
  const porHora = new Map<string, LinhaRotina[]>();
  for (const item of ativos) {
    const p = planos[item.id];
    const futuras = p.slots.filter((s) => s.data >= desde);
    const horas = new Set((futuras.length ? futuras : p.slots).map((s) => s.hora));
    for (const h of horas) {
      const l = porHora.get(h) ?? [];
      l.push({ item, dose: item.dose?.exibir ?? '-', notas: notasDoItem(item, itens), periodo: textoPeriodo(p) });
      porHora.set(h, l);
    }
  }
  const ordemJejum = (i: Item) => (i.jejum === 'exigido' ? 0 : 1);
  const rotina = [...porHora.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, linhas]) => ({
      hora,
      nome: periodo(hora).nome,
      linhas: linhas.sort((a, b) => ordemJejum(a.item) - ordemJejum(b.item) || a.item.ordem - b.item.ordem),
    }));

  // Checklist: só o que tem dose dentro dos dias escolhidos.
  const checklist: LinhaChecklist[] = [];
  for (const bloco of rotina) {
    for (const l of bloco.linhas) {
      const tem = new Set(
        planos[l.item.id].slots.filter((s) => s.hora === bloco.hora && s.data >= desde && s.data <= ate).map((s) => s.data),
      );
      if (tem.size) checklist.push({ hora: bloco.hora, item: l.item, dose: l.dose, dias: dias.map((d) => tem.has(d)) });
    }
  }

  const sos = itens.filter((i) => i.condicional).map((item) => ({
    item,
    dose: item.dose?.exibir ?? '-',
    quando: item.condicional!,
    intervalo: item.intervaloHoras >= 24 ? `No máximo 1 vez a cada ${item.intervaloHoras} h` : `Esperar ao menos ${item.intervaloHoras} h entre doses`,
  }));

  const datas: { data: string; texto: string }[] = [];
  if (retorno && retorno >= desde) datas.push({ data: retorno, texto: 'Retorno à clínica e repetição de exames' });
  for (const item of ativos) {
    if (item.tipo === 'cuidado') continue;
    const p = planos[item.id];
    if (item.regras.some((r) => r.tipo === 'inicioApos') && p.inicio && p.inicio >= desde)
      datas.push({ data: p.inicio, texto: `Começa: ${item.nome}` });
    if (p.fim && p.fim >= desde) datas.push({ data: p.fim, texto: `Última dose: ${item.nome}` });
  }
  datas.sort((a, b) => a.data.localeCompare(b.data));

  return { desde, dias, grupos, rotina, checklist, sos, datas };
}
