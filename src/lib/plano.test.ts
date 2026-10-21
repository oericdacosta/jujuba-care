import { describe, expect, it } from 'vitest';
import { resolver } from './agenda';
import { cabecalhoPadrao } from './cabecalho';
import { gerarPdf } from './pdf';
import { montarDados } from './plano';
import { ITENS, RETORNO } from './seed';
import type { Config } from './schema';

const cfg: Config = {
  inicio: '2026-10-21T21:00',
  ancoras: { '8': ['06:00', '14:00', '22:00'], '12': ['08:00', '20:00'], '24': ['09:00'] },
  horariosItem: {},
  fimManual: {},
};
const dados = () => montarDados(ITENS, resolver(ITENS, cfg), cfg, '2026-10-22', 7, RETORNO);

describe('plano impresso', () => {
  it('rotina segue os horários de cada grupo, 24 h e 48 h juntos', () => {
    const d = dados();
    expect(d.rotina.map((b) => b.hora)).toEqual(['06:00', '08:00', '09:00', '14:00', '20:00', '22:00']);
    const nove = d.rotina.find((b) => b.hora === '09:00')!.linhas.map((l) => l.item.id);
    expect(nove).toContain('kalium');
    expect(nove).toContain('hepvet');
    expect(nove).not.toContain('dipirona');
  });
  it('checklist marca só os dias com dose (Kalium dia sim, dia não)', () => {
    const k = dados().checklist.find((l) => l.item.id === 'kalium')!;
    // doses em 21, 23, 25, 27/10; a lista começa em 22/10
    expect(k.dias).toEqual([false, true, false, true, false, true, false]);
  });
  it('itens condicionais vão para "se precisar"', () => {
    const d = dados();
    expect(d.sos.map((s) => s.item.id)).toEqual(['ondansetrona', 'peglax', 'simeticona']);
    expect(d.rotina.flatMap((b) => b.linhas).some((l) => l.item.condicional)).toBe(false);
  });
  it('gera um PDF com rotina e checklist', () => {
    const doc = gerarPdf(dados(), cabecalhoPadrao('22/10/2026'));
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
    expect(doc.output().startsWith('%PDF')).toBe(true);
  });
});
