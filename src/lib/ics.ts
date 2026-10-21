import { addDays, pad } from './dates';
import type { Item, Plano } from './schema';

const stamp = (data: string, hora: string) => `${data.replaceAll('-', '')}T${hora.replace(':', '')}00`;
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function fimEvento(data: string, hora: string, minutos = 10): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  if (total >= 24 * 60) return stamp(addDays(data, 1), `${pad(Math.floor((total - 1440) / 60))}:${pad((total - 1440) % 60)}`);
  return stamp(data, `${pad(Math.floor(total / 60))}:${pad(total % 60)}`);
}

/**
 * Um evento por horário (não por remédio), com alarme 5 min antes.
 * Horários "flutuantes" (sem fuso): o calendário usa o fuso do aparelho.
 * Só inclui doses de `dias` dias a partir de `desde`, para o arquivo não ficar enorme.
 */
export function gerarIcs(itens: Item[], planos: Record<string, Plano>, desde: string, dias = 14): string {
  const limite = addDays(desde, dias);
  const porHorario = new Map<string, { data: string; hora: string; itens: Item[] }>();
  for (const item of itens) {
    const plano = planos[item.id];
    if (!plano || plano.estimado) continue;
    for (const s of plano.slots) {
      if (s.data < desde || s.data > limite) continue;
      const k = `${s.data}T${s.hora}`;
      const g = porHorario.get(k) ?? { data: s.data, hora: s.hora, itens: [] };
      g.itens.push(item);
      porHorario.set(k, g);
    }
  }
  const agora = new Date();
  const dtstamp = `${agora.getUTCFullYear()}${pad(agora.getUTCMonth() + 1)}${pad(agora.getUTCDate())}T${pad(agora.getUTCHours())}${pad(agora.getUTCMinutes())}00Z`;
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Jujuba Care//PT-BR//', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Jujuba'];
  for (const g of [...porHorario.values()].sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`))) {
    const resumo = g.itens.map((i) => (i.dose ? `${i.nome} ${i.dose.exibir}` : i.nome));
    linhas.push(
      'BEGIN:VEVENT',
      `UID:${g.data}T${g.hora.replace(':', '')}@jujuba-care`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${stamp(g.data, g.hora)}`,
      `DTEND:${fimEvento(g.data, g.hora)}`,
      `SUMMARY:${esc(`Jujuba: ${g.itens.length} ${g.itens.length === 1 ? 'item' : 'itens'}`)}`,
      `DESCRIPTION:${esc(resumo.join('\n'))}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Jujuba', 'TRIGGER:-PT5M', 'END:VALARM',
      'END:VEVENT',
    );
  }
  linhas.push('END:VCALENDAR');
  return linhas.join('\r\n') + '\r\n';
}

export function baixar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

