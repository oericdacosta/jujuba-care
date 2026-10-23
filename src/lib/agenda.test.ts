import { describe, expect, it } from 'vitest';
import { agendaDoDia, resolver, totalDeDoses } from './agenda';
import { gerarIcs } from './ics';
import { ITENS, ITEM_POR_ID } from './seed';
import type { Config, Item } from './schema';

const cfg = (extra: Partial<Config> = {}): Config => ({
  inicio: null, ancoras: {}, horariosItem: {}, fimManual: {}, ...extra,
});

const item = (id: string, intervaloHoras: number, duracaoDias: number | null, horarios: string[] | null, extra: Partial<Item> = {}): Item => ({
  id, ordem: 1, nome: id, tipo: 'farmacia', via: 'oral', dose: null, horarios,
  intervaloHoras, duracaoDias, condicional: null, jejum: 'nao', original: '', obs: [], duvidas: [], regras: [],
  ...extra,
});

describe('contagem de doses', () => {
  it('12h por 3 dias dá 6 doses', () => {
    const p = resolver([item('a', 12, 3, ['09:00', '21:00'])], cfg(), '2026-10-21T00:00').a;
    expect(p.slots).toHaveLength(6);
    expect(p.inicio).toBe('2026-10-21');
    expect(p.fim).toBe('2026-10-23');
  });
  it('48h por 10 dias dá 5 doses em dias alternados', () => {
    const p = resolver([item('a', 48, 10, ['22:00'])], cfg(), '2026-10-21T00:00').a;
    expect(p.slots.map((s) => s.data)).toEqual(['2026-10-21', '2026-10-23', '2026-10-25', '2026-10-27', '2026-10-29']);
  });
  it('dias da receita valem mesmo com menos horários por dia', () => {
    // 5 dias com 2 horários = 10 doses
    expect(totalDeDoses(item('a', 8, 5, ['15:00', '23:00']))).toBe(10);
  });
  it('início no meio do dia descarta horários anteriores', () => {
    const p = resolver([item('a', 12, 1, ['09:00', '21:00'])], cfg(), '2026-10-21T15:00').a;
    expect(p.slots.map((s) => `${s.data} ${s.hora}`)).toEqual(['2026-10-21 21:00', '2026-10-22 09:00']);
  });
  it('vira mês e ano sem erro de data', () => {
    const p = resolver([item('a', 24, 3, ['07:00'])], cfg(), '2026-12-30T00:00').a;
    expect(p.slots.map((s) => s.data)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
  });
  it('contínuo não tem fim; condicional e sem horário não geram doses', () => {
    const planos = resolver([
      item('a', 24, null, ['07:00']),
      item('b', 8, 5, ['08:00'], { condicional: 'se náusea' }),
      item('c', 24, 30, null),
    ], cfg(), '2026-10-21T00:00');
    expect(planos.a.fim).toBeNull();
    expect(planos.a.slots.length).toBeGreaterThan(30);
    expect(planos.b.slots).toHaveLength(0);
    expect(planos.c.slots).toHaveLength(0);
  });
});

describe('receita da Jujuba com horários fixos', () => {
  const planos = resolver(ITENS, cfg());
  const dia = (data: string) => agendaDoDia(data, ITENS, planos, {});
  const horasDe = (id: string) => [...new Set(planos[id].slots.map((s) => s.hora))];

  it('horários combinados', () => {
    expect(horasDe('acetilcisteina')).toEqual(['00:00', '08:00', '16:00']);
    expect(horasDe('sanus')).toEqual(['07:00']);
    for (const id of ['dipirona', 'amoxicilina', 'vetnidazol', 'revimax']) expect(horasDe(id)).toEqual(['09:00', '21:00']);
    expect(horasDe('ondansetrona')).toEqual(['15:00', '23:00']);
    for (const id of ['hepvet', 'vitamina-e', 'basken', 'prednisolona']) expect(horasDe(id)).toEqual(['16:00']);
    for (const id of ['ursodesoxicolico', 'nutrifull', 'kalium']) expect(horasDe(id)).toEqual(['22:00']);
    expect(horasDe('simeticona')).toEqual(['22:30']);
    expect(horasDe('sonda')).toEqual(['10:00', '22:00']);
  });
  it('Sanus é o primeiro remédio do dia depois do de 00:00', () => {
    const remedios = dia('2026-10-22').filter((d) => d.item.tipo !== 'cuidado');
    expect(remedios[0].item.id).toBe('acetilcisteina');
    expect(remedios[0].slot.hora).toBe('00:00');
    expect(remedios[1].item.id).toBe('sanus');
  });
  it('tratamento conta a partir de 21/10', () => {
    expect(planos.dipirona.inicio).toBe('2026-10-21');
    expect(planos.dipirona.fim).toBe('2026-10-23');
    expect(planos.acetilcisteina.slots).toHaveLength(21);
    expect(planos.acetilcisteina.fim).toBe('2026-10-27');
    expect(planos.ondansetrona.slots).toHaveLength(10);
    expect(planos.ondansetrona.fim).toBe('2026-10-25');
    expect(planos.prednisolona.fim).toBe('2026-10-27');
    expect(planos.basken.fim).toBe('2026-10-25');
  });
  it('telmisartana fica fora da rotina e o Kalium segue os 10 dias', () => {
    expect(planos.telmisartana.slots).toHaveLength(0);
    expect(planos.kalium.slots.map((s) => s.data)).toEqual(['2026-10-21', '2026-10-23', '2026-10-25', '2026-10-27', '2026-10-29']);
  });
  it('Peg-lax continua "se precisar"', () => {
    expect(ITEM_POR_ID.peglax.condicional).toBeTruthy();
    expect(planos.peglax.slots).toHaveLength(0);
  });
  it('encerrar a prednisolona antes não quebra nada', () => {
    const p = resolver(ITENS, cfg({ fimManual: { prednisolona: '2026-10-24' } }));
    expect(p.prednisolona.fim).toBe('2026-10-24');
  });
  it('ciclo de dependências lança erro', () => {
    const a = item('a', 24, 3, ['07:00'], { regras: [{ tipo: 'inicioApos', item: 'b' }] });
    const b = item('b', 24, 3, ['07:00'], { regras: [{ tipo: 'inicioApos', item: 'a' }] });
    expect(() => resolver([a, b], cfg())).toThrow(/Ciclo/);
  });
});

describe('agenda do dia', () => {
  it('une os itens, ordena por horário e reflete o registro', () => {
    const itens = [item('a', 12, 3, ['08:00', '20:00']), item('b', 24, 3, ['08:00'])];
    const planos = resolver(itens, cfg(), '2026-10-21T00:00');
    const doses = { 'a|2026-10-21T08:00': { status: 'dado' as const, em: '2026-10-21T08:05' } };
    expect(agendaDoDia('2026-10-21', itens, planos, doses).map((d) => `${d.slot.hora}:${d.item.id}:${d.estado}`)).toEqual([
      '08:00:a:feito', '08:00:b:pendente', '20:00:a:pendente',
    ]);
  });
});

describe('exportação .ics', () => {
  it('agrupa por horário e tem um alarme por evento', () => {
    const itens = [item('a', 12, 3, ['08:00', '20:00']), item('b', 24, 3, ['08:00'])];
    const ics = gerarIcs(itens, resolver(itens, cfg(), '2026-10-21T00:00'), '2026-10-21');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(6);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(6);
    expect(ics).toContain('UID:2026-10-21T0800@jujuba-care');
  });
});
