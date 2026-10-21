import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData, type RowInput } from 'jspdf-autotable';
import { fmtBR, fmtDiaSemana } from './dates';
import type { DadosPlano } from './plano';

/** Paleta do app, ajustada para papel (tons claros imprimem bem também em P&B). */
type RGB = [number, number, number];
const C: Record<string, RGB> = {
  mel: [242, 176, 30],
  melSoft: [253, 240, 204],
  creme: [251, 246, 236],
  ink: [27, 24, 20],
  muted: [107, 99, 88],
  line: [226, 216, 198],
  fast: [47, 93, 138],
  fastSoft: [223, 233, 245],
  risk: [180, 35, 24],
  cinza: [240, 237, 231],
};

const M = 14; // margem (mm)

export interface Cabecalho {
  paciente: string;
  especie: string;
  peso: string;
  receita: string;
  clinica: string;
  telefones: string[];
  orientacoes: string[];
  liquidos: string;
  geradoEm: string;
}

function faixa(doc: jsPDF, titulo: string, sub: string, cab: Cabecalho) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.mel);
  doc.rect(0, 0, w, 30, 'F');
  // "pata" decorativa
  doc.setFillColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.25 }));
  const px = w - 30, py = 17;
  doc.circle(px, py + 3, 5, 'F');
  doc.circle(px - 6, py - 3, 2.2, 'F');
  doc.circle(px - 2, py - 6.5, 2.2, 'F');
  doc.circle(px + 2.5, py - 6.5, 2.2, 'F');
  doc.circle(px + 6.5, py - 3, 2.2, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setTextColor(...C.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setCharSpace(0.6);
  doc.text('JUJUBA CARE', M, 9);
  doc.setCharSpace(0);
  doc.setFontSize(19);
  doc.text(titulo, M, 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(sub, M, 25);
  doc.setFontSize(8);
  doc.text(`Gerado em ${cab.geradoEm}`, w - M, 9, { align: 'right' });
}

function tituloSecao(doc: jsPDF, y: number, texto: string, dica?: string): number {
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = M + 4;
  }
  doc.setFillColor(...C.mel);
  doc.roundedRect(M, y - 4.2, 1.6, 5.6, 0.8, 0.8, 'F');
  doc.setTextColor(...C.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(texto, M + 4, y);
  const larg = doc.getTextWidth(texto);
  if (dica) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.muted);
    doc.text(dica, M + 4 + larg + 3, y);
  }
  return y + 4;
}

function caixa(doc: jsPDF, x: number, y: number, w: number, h: number, rotulo: string, linhas: string[], fill: RGB) {
  doc.setFillColor(...fill);
  doc.setDrawColor(...C.line);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.setCharSpace(0.4);
  doc.text(rotulo.toUpperCase(), x + 4, y + 5.5);
  doc.setCharSpace(0);
  doc.setTextColor(...C.ink);
  linhas.forEach((l, i) => {
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
    doc.setFontSize(i === 0 ? 11.5 : 8.5);
    doc.text(l, x + 4, y + 11.5 + i * 4.6, { maxWidth: w - 8 });
  });
}

const fimTabela = (doc: jsPDF) => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

const baseTabela = {
  margin: { left: M, right: M, top: M + 4 },
  styles: { font: 'helvetica', fontSize: 9, textColor: C.ink, lineColor: C.line, lineWidth: 0.2, cellPadding: 2.2, valign: 'middle' as const },
  headStyles: { fillColor: C.ink, textColor: [255, 255, 255] as RGB, fontStyle: 'bold' as const, fontSize: 8.5 },
};

function paginaRotina(doc: jsPDF, d: DadosPlano, cab: Cabecalho) {
  faixa(doc, `Plano de medicação da ${cab.paciente}`, `${cab.especie} · ${cab.peso} · ${cab.receita} · ${cab.clinica}`, cab);
  const largura = doc.internal.pageSize.getWidth() - 2 * M;

  // Resumo
  let y = 36;
  const bw = (largura - 8) / 3;
  const retorno = d.datas.find((x) => x.texto.startsWith('Retorno'));
  caixa(doc, M, y, bw, 21, 'Retorno', retorno ? [fmtDiaSemana(retorno.data), 'Repetir exames'] : ['-'], C.melSoft);
  caixa(doc, M + bw + 4, y, bw, 21, `Clínica ${cab.clinica}`, cab.telefones, C.creme);
  caixa(doc, M + 2 * (bw + 4), y, bw, 21, 'Líquidos', [cab.liquidos, 'por dia, em média'], C.fastSoft);
  y += 30;

  // Horários de cada grupo
  y = tituloSecao(doc, y, 'Horários por grupo', 'todos os remédios do grupo são dados juntos');
  const gw = (largura - 4 * (d.grupos.length - 1)) / d.grupos.length;
  d.grupos.forEach((g, i) => {
    const x = M + i * (gw + 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...C.mel);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, gw, 15, 2.5, 2.5, 'FD');
    doc.setLineWidth(0.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(g.titulo, x + 4, y + 5.2);
    doc.setTextColor(...C.ink);
    doc.setFontSize(13);
    doc.text(g.horarios.join('  ·  '), x + 4, y + 11.8);
  });
  y += 23;

  // Rotina do dia
  y = tituloSecao(doc, y, 'Rotina do dia', 'em ordem de horário');
  const corpo: RowInput[] = [];
  const blocoRotina: number[] = [];
  d.rotina.forEach((b, k) => {
    b.linhas.forEach((l, i) => {
      blocoRotina.push(k);
      corpo.push([
        ...(i === 0
          ? [{ content: `${b.hora}\n${b.nome}`, rowSpan: b.linhas.length, styles: { fontStyle: 'bold' as const, fontSize: 10.5, halign: 'center' as const } }]
          : []),
        l.item.nome, l.dose, l.notas, l.periodo,
      ]);
    });
  });
  autoTable(doc, {
    ...baseTabela,
    startY: y,
    theme: 'grid',
    head: [['Hora', 'Remédio', 'Dose', 'Cuidados', 'Período']],
    body: corpo,
    rowPageBreak: 'avoid',
    styles: { ...baseTabela.styles, cellPadding: 1.9 },
    columnStyles: {
      0: { cellWidth: 19 },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 29 },
      3: { cellWidth: 'auto', textColor: C.fast },
      4: { cellWidth: 31, textColor: C.muted, fontSize: 8 },
    },
    didParseCell: (h: CellHookData) => {
      if (h.section === 'body' && blocoRotina[h.row.index] % 2 === 0) h.cell.styles.fillColor = C.creme;
      if (h.section === 'body' && h.column.index === 0) h.cell.styles.fillColor = C.melSoft;
    },
  });
  y = fimTabela(doc) + 10;

  if (d.sos.length) {
    y = tituloSecao(doc, y, 'Se precisar', 'sem horário fixo, só quando houver o sinal');
    autoTable(doc, {
      ...baseTabela,
      startY: y,
      head: [['Remédio', 'Dose', 'Quando dar', 'Intervalo']],
      body: d.sos.map((s) => [s.item.nome, s.dose, s.quando, s.intervalo]),
      columnStyles: { 0: { cellWidth: 52, fontStyle: 'bold' }, 1: { cellWidth: 30 }, 3: { cellWidth: 42, textColor: C.muted, fontSize: 8.5 } },
    });
    y = fimTabela(doc) + 10;
  }

  if (d.datas.length) {
    y = tituloSecao(doc, y, 'Datas importantes');
    autoTable(doc, {
      ...baseTabela,
      startY: y,
      showHead: false,
      styles: { ...baseTabela.styles, cellPadding: 1.5, fontSize: 8.5 },
      body: d.datas.map((x) => [fmtDiaSemana(x.data), x.texto]),
      columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' } },
      didParseCell: (h: CellHookData) => {
        if (h.section === 'body' && String(h.row.raw && (h.row.raw as string[])[1]).startsWith('Retorno')) h.cell.styles.fillColor = C.melSoft;
      },
    });
    y = fimTabela(doc) + 10;
  }

  y = tituloSecao(doc, y, 'Orientações da receita');
  autoTable(doc, {
    ...baseTabela,
    startY: y,
    theme: 'plain',
    showHead: false,
    body: cab.orientacoes.map((o) => [`•  ${o}`]),
    styles: { ...baseTabela.styles, lineWidth: 0, cellPadding: { top: 1, bottom: 1, left: 2, right: 2 } },
  });
}

function paginaChecklist(doc: jsPDF, d: DadosPlano, cab: Cabecalho) {
  doc.addPage('a4', 'landscape');
  const ate = d.dias[d.dias.length - 1];
  faixa(doc, 'Checklist de doses', `${fmtBR(d.desde)} a ${fmtBR(ate)} · marque um X em cada dose dada · "-" = não tem dose nesse dia`, cab);

  const head = [['Hora', 'Remédio', 'Dose', ...d.dias.map((x) => fmtDiaSemana(x).replace(', ', '\n'))]];
  // agrupa por hora (rowSpan) e alterna o fundo de cada bloco de horário
  const linhas = d.checklist;
  const blocoDe: number[] = [];
  let bloco = -1;
  const body: RowInput[] = linhas.map((l, i) => {
    const novo = i === 0 || linhas[i - 1].hora !== l.hora;
    if (novo) bloco++;
    blocoDe.push(bloco);
    const span = novo ? linhas.filter((x) => x.hora === l.hora).length : 0;
    const row: RowInput = [
      ...(novo ? [{ content: l.hora, rowSpan: span, styles: { fontStyle: 'bold' as const, fontSize: 11, halign: 'center' as const } }] : []),
      l.item.nome,
      l.dose,
      ...l.dias.map((tem) => (tem ? '' : '-')),
    ];
    return row;
  });

  const largura = doc.internal.pageSize.getWidth() - 2 * M;
  const fixas = 16 + 58 + 30;
  const colDia = (largura - fixas) / d.dias.length;
  const colunaDia = (h: CellHookData) => h.column.index >= 3;

  autoTable(doc, {
    ...baseTabela,
    startY: 36,
    head,
    body,
    rowPageBreak: 'avoid',
    styles: { ...baseTabela.styles, fontSize: 8.5, minCellHeight: 8.5 },
    headStyles: { ...baseTabela.headStyles, halign: 'center', fontSize: 7.5 },
    columnStyles: Object.fromEntries([
      [0, { cellWidth: 16 }],
      [1, { cellWidth: 58, fontStyle: 'bold' }],
      [2, { cellWidth: 30, textColor: C.muted }],
      ...d.dias.map((_, i) => [i + 3, { cellWidth: colDia, halign: 'center' }]),
    ]),
    didParseCell: (h: CellHookData) => {
      if (h.section !== 'body') return;
      const i = h.row.index;
      if (blocoDe[i] % 2 === 1) h.cell.styles.fillColor = C.creme;
      if (colunaDia(h) && h.cell.raw === '-') {
        h.cell.styles.fillColor = C.cinza;
        h.cell.styles.textColor = [190, 182, 170];
      }
    },
    didDrawCell: (h: CellHookData) => {
      if (h.section !== 'body' || !colunaDia(h) || h.cell.raw !== '') return;
      const s = 4.6;
      doc.setDrawColor(...C.ink);
      doc.setLineWidth(0.35);
      doc.roundedRect(h.cell.x + (h.cell.width - s) / 2, h.cell.y + (h.cell.height - s) / 2, s, s, 0.8, 0.8, 'S');
      doc.setLineWidth(0.2);
    },
  });

  // espaço para anotações
  let y = fimTabela(doc) + 8;
  const alto = doc.internal.pageSize.getHeight();
  if (y > alto - 40) {
    doc.addPage('a4', 'landscape');
    y = M + 4;
  }
  y = tituloSecao(doc, y, 'Anotações', 'vômito, apetite, fezes, xixi, dúvidas para a veterinária');
  doc.setDrawColor(...C.line);
  for (let ly = y + 6; ly < alto - 14; ly += 7.5) doc.line(M, ly, M + largura, ly);
}

function rodapes(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text('Este plano só organiza o que está na receita e não substitui a orientação da veterinária.', M, h - 7);
    doc.text(`Página ${p} de ${total}`, w - M, h - 7, { align: 'right' });
  }
}

export function gerarPdf(d: DadosPlano, cab: Cabecalho): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.setProperties({ title: `Plano de medicação da ${cab.paciente}`, author: 'Jujuba Care' });
  paginaRotina(doc, d, cab);
  if (d.checklist.length) paginaChecklist(doc, d, cab);
  rodapes(doc);
  return doc;
}
