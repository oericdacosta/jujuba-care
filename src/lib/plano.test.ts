import { describe, expect, it } from 'vitest';
import { resolver } from './agenda';
import { cabecalhoPadrao } from './cabecalho';
import { gerarPdf } from './pdf';
import { montarDados } from './plano';
import { ITENS, RETORNO } from './seed';

const planos = resolver(ITENS, { inicio: null, ancoras: {}, horariosItem: {}, fimManual: {} });
const dados = (desde = '2026-10-21', dias = 7) => montarDados(ITENS, planos, desde, dias, RETORNO);

describe('plano impresso', () => {
  it('rotina usa os horários fixos, do 00:00 ao 23:00', () => {
    expect(dados().rotina.map((b) => b.hora)).toEqual([
      '00:00', '07:00', '08:00', '09:00', '10:00', '15:00', '16:00', '21:00', '22:00', '22:30', '23:00',
    ]);
  });
  it('16:00 e 22:00 juntam os remédios combinados', () => {
    const em = (h: string) => dados().rotina.find((b) => b.hora === h)!.linhas.map((l) => l.item.id);
    expect(em('16:00')).toEqual(['hepvet', 'vitamina-e', 'acetilcisteina', 'basken', 'prednisolona']);
    expect(em('22:00')).toEqual(['ursodesoxicolico', 'nutrifull', 'kalium', 'sonda']);
  });
  it('Sanus marcado como primeiro do dia e em jejum', () => {
    const sanus = dados().rotina.find((b) => b.hora === '07:00')!.linhas[0];
    expect(sanus.item.id).toBe('sanus');
    expect(sanus.notas).toMatch(/Primeiro remédio do dia/);
    expect(sanus.notas).toMatch(/Em jejum/);
  });
  it('checklist começa em 21/10 e respeita os dias da receita', () => {
    const d = dados();
    expect(d.dias[0]).toBe('2026-10-21');
    const linha = (id: string, h: string) => d.checklist.find((l) => l.item.id === id && l.hora === h)!.dias;
    expect(linha('dipirona', '09:00')).toEqual([true, true, true, false, false, false, false]);
    expect(linha('kalium', '22:00')).toEqual([true, false, true, false, true, false, true]);
    expect(linha('ondansetrona', '23:00')).toEqual([true, true, true, true, true, false, false]);
  });
  it('telmisartana fica fora e só o Peg-lax é "se precisar"', () => {
    const d = dados();
    expect(d.fora.map((f) => f.item.id)).toEqual(['telmisartana']);
    expect(d.sos.map((s) => s.item.id)).toEqual(['peglax']);
    expect(d.rotina.flatMap((b) => b.linhas).some((l) => l.item.id === 'telmisartana')).toBe(false);
  });
  it('gera um PDF com rotina e checklist', () => {
    const doc = gerarPdf(dados(), cabecalhoPadrao('22/10/2026'));
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
    expect(doc.output().startsWith('%PDF')).toBe(true);
  });
});
