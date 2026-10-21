import { describe, expect, it } from 'vitest';
import { agendaDoDia, espacar, horariosAutomaticos, horariosDoItem, resolver } from './agenda';
import { ITENS } from './seed';
import type { Config, Item } from './schema';

const cfg = (extra: Partial<Config> = {}): Config => ({
  inicio: '2026-10-21T06:00',
  ancoras: { '8': ['06:00', '14:00', '22:00'], '12': ['08:00', '20:00'], '24': ['08:00'] },
  horariosItem: {},
  fimManual: {},
  ...extra,
});

const item = (id: string, intervaloHoras: number, duracaoDias: number | null, extra: Partial<Item> = {}): Item => ({
  id, ordem: 1, nome: id, tipo: 'farmacia', via: 'oral', dose: null,
  intervaloHoras, duracaoDias, condicional: null, jejum: 'nao', original: '', obs: [], duvidas: [], regras: [],
  ...extra,
});

describe('contagem de doses', () => {
  it('12h por 3 dias dá 6 doses', () => {
    const p = resolver([item('a', 12, 3)], cfg()).a;
    expect(p.slots).toHaveLength(6);
    expect(p.inicio).toBe('2026-10-21');
    expect(p.fim).toBe('2026-10-23');
  });
  it('8h por 7 dias dá 21 doses', () => {
    expect(resolver([item('a', 8, 7)], cfg()).a.slots).toHaveLength(21);
  });
  it('48h por 10 dias dá 5 doses em dias alternados', () => {
    const p = resolver([item('a', 48, 10)], cfg()).a;
    expect(p.slots.map((s) => s.data)).toEqual(['2026-10-21', '2026-10-23', '2026-10-25', '2026-10-27', '2026-10-29']);
  });
  it('início no meio do dia descarta horários anteriores', () => {
    const p = resolver([item('a', 12, 1)], cfg({ inicio: '2026-10-21T15:00' })).a;
    expect(p.slots.map((s) => `${s.data} ${s.hora}`)).toEqual(['2026-10-21 20:00', '2026-10-22 08:00']);
  });
  it('vira mês e ano sem erro de data', () => {
    const p = resolver([item('a', 24, 3)], cfg({ inicio: '2026-12-30T07:00' })).a;
    expect(p.slots.map((s) => s.data)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
  });
});

describe('contínuos e condicionais', () => {
  it('contínuo respeita o horizonte e não tem fim', () => {
    const p = resolver([item('a', 24, null)], cfg()).a;
    expect(p.fim).toBeNull();
    expect(p.slots.length).toBeGreaterThan(30);
  });
  it('condicional não gera horários', () => {
    expect(resolver([item('a', 8, 5, { condicional: 'se náusea' })], cfg()).a.slots).toHaveLength(0);
  });
});

describe('sem horários escolhidos', () => {
  it('deriva os horários da primeira dose', () => {
    const c = cfg({ ancoras: {}, inicio: '2026-10-21T06:30' });
    expect(horariosAutomaticos(c.inicio, 3)).toEqual(['06:30', '14:30', '22:30']);
    expect(horariosAutomaticos(c.inicio, 2)).toEqual(['06:30', '18:30']);
    expect(horariosAutomaticos('2026-10-21T22:00', 3)).toEqual(['06:00', '14:00', '22:00']);
    const planos = resolver([item('a', 12, 7)], c);
    expect(planos.a.estimado).toBe(false);
    expect(planos.a.slots[0].hora).toBe('06:30');
    expect(planos.a.slots[1].hora).toBe('18:30');
  });
  it('sem início não calcula nada', () => {
    expect(resolver([item('a', 24, 7)], cfg({ inicio: null })).a.semInicio).toBe(true);
  });
});

describe('receita da Jujuba', () => {
  const planos = resolver(ITENS, cfg());
  it('prednisolona termina em 27/10 e a telmisartana começa em 28/10', () => {
    expect(planos.prednisolona.fim).toBe('2026-10-27');
    expect(planos.telmisartana.inicio).toBe('2026-10-28');
  });
  it('kalium é cortado quando a telmisartana começa', () => {
    expect(planos.kalium.slots.map((s) => s.data)).toEqual(['2026-10-21', '2026-10-23', '2026-10-25', '2026-10-27']);
    expect(planos.kalium.fim).toBe('2026-10-27');
  });
  it('encerrar a prednisolona antes adianta a telmisartana', () => {
    const p = resolver(ITENS, cfg({ fimManual: { prednisolona: '2026-10-24' } }));
    expect(p.telmisartana.inicio).toBe('2026-10-25');
    expect(p.kalium.fim).toBe('2026-10-23');
  });
  it('ciclo de dependências lança erro', () => {
    const a = item('a', 24, 3, { regras: [{ tipo: 'inicioApos', item: 'b' }] });
    const b = item('b', 24, 3, { regras: [{ tipo: 'inicioApos', item: 'a' }] });
    expect(() => resolver([a, b], cfg())).toThrow(/Ciclo/);
  });
});

describe('agenda do dia', () => {
  it('une os itens, ordena por horário e reflete o registro', () => {
    const itens = [item('a', 12, 3), item('b', 24, 3)];
    const c = cfg();
    const planos = resolver(itens, c);
    const doses = { 'a|2026-10-21T08:00': { status: 'dado' as const, em: '2026-10-21T08:05' } };
    const dia = agendaDoDia('2026-10-21', itens, planos, doses);
    expect(dia.map((d) => `${d.slot.hora}:${d.item.id}:${d.estado}`)).toEqual([
      '08:00:a:feito', '08:00:b:pendente', '20:00:a:pendente',
    ]);
  });
});

import { gerarIcs } from './ics';

describe('exportação .ics', () => {
  it('agrupa por horário e tem um alarme por evento', () => {
    const itens = [item('a', 12, 3), item('b', 24, 3)];
    const planos = resolver(itens, cfg());
    const ics = gerarIcs(itens, planos, '2026-10-21');
    // a: 6 slots (08:00/20:00 x 3 dias), b: 3 slots às 08:00 -> 6 horários distintos
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(6);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(6);
    expect(ics).toContain('UID:2026-10-21T0800@jujuba-care');
  });
});

describe('horários por grupo', () => {
  it('espaça a partir do primeiro horário', () => {
    expect(espacar('07:00', 3)).toEqual(['07:00', '15:00', '23:00']);
    expect(espacar('09:30', 2)).toEqual(['09:30', '21:30']);
    expect(espacar('20:00', 3)).toEqual(['04:00', '12:00', '20:00']);
  });
  it('24 h e 48 h usam o mesmo horário do grupo; horário próprio tem prioridade', () => {
    const c = cfg({ ancoras: { '24': ['10:00'] }, horariosItem: { sanus: ['07:00'] } });
    const por = (id: string) => horariosDoItem(ITENS.find((i) => i.id === id)!, c);
    expect(por('hepvet')).toEqual(['10:00']);
    expect(por('kalium')).toEqual(['10:00']);
    expect(por('sanus')).toEqual(['07:00']);
  });
});
