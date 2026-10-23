<script lang="ts">
  import { diffDays, fmtDiaSemana } from './lib/dates';
  import { INICIO_TRATAMENTO, ITENS, RETORNO } from './lib/seed';
  import { estado } from './lib/store.svelte';

  interface Marco { data: string; texto: string; tipo: 'ini' | 'fim' | 'vet' }

  const marcos = $derived.by(() => {
    const m: Marco[] = [{ data: RETORNO, texto: 'Retorno à clínica e repetição de exames', tipo: 'vet' }];
    for (const i of ITENS) {
      const p = estado.planos[i.id];
      if (i.condicional || i.tipo === 'cuidado' || !p.inicio) continue;
      if (i.regras.some((r) => r.tipo === 'inicioApos')) m.push({ data: p.inicio, texto: `Começa: ${i.nome}`, tipo: 'ini' });
      if (p.fim) m.push({ data: p.fim, texto: `Última dose: ${i.nome}`, tipo: 'fim' });
    }
    return m.sort((a, b) => a.data.localeCompare(b.data));
  });

  const tratamentos = $derived(
    ITENS.filter((i) => !i.condicional && i.tipo !== 'cuidado' && estado.planos[i.id].inicio).map((i) => ({
      item: i, plano: estado.planos[i.id],
    })),
  );
  const inicioGeral = INICIO_TRATAMENTO.slice(0, 10);
  const fimGeral = $derived(
    tratamentos.reduce((max, t) => Math.max(max, t.plano.fim ? diffDays(inicioGeral, t.plano.fim) : 30), 30) + 1,
  );
  const pos = (data: string) => `${(Math.max(0, diffDays(inicioGeral, data)) / fimGeral) * 100}%`;
  const largura = (a: string, b: string | null) =>
    `${(((b ? diffDays(a, b) : fimGeral - diffDays(inicioGeral, a)) + 1) / fimGeral) * 100}%`;
</script>

<div class="page">
  <h1>Agenda</h1>
  <p class="muted">Barras mostram cada tratamento; a linha vertical é hoje.</p>

  <section class="card stack">
    <h2>Linha do tempo</h2>
    <div class="gantt">
      {#each tratamentos as t (t.item.id)}
        <div class="lin">
          <span class="nome">{t.item.nome}</span>
          <div class="trilho">
            <i class="barra" style="left:{pos(t.plano.inicio!)}; width:{largura(t.plano.inicio!, t.plano.fim)}" class:cont={!t.plano.fim}></i>
            <i class="hoje" style="left:{pos(estado.hoje)}"></i>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="card stack">
    <h2>Datas importantes</h2>
    {#each marcos as m}
      <div class="row marco" class:passado={m.data < estado.hoje}>
        <span class="chip {m.tipo === 'vet' ? 'risk' : m.tipo === 'ini' ? 'food' : 'ok'}">{fmtDiaSemana(m.data)}</span>
        <span>{m.texto}</span>
      </div>
    {/each}
  </section>
</div>

<style>
  .gantt { display: grid; gap: 8px; }
  .lin { display: grid; gap: 2px; }
  .nome { font-size: 0.82rem; }
  .trilho { position: relative; height: 12px; background: var(--line); border-radius: 99px; overflow: hidden; }
  .barra { position: absolute; top: 0; bottom: 0; background: var(--mel); border-radius: 99px; }
  .barra.cont { background: repeating-linear-gradient(90deg, var(--mel) 0 10px, transparent 10px 16px); }
  .hoje { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--ink); }
  .marco { align-items: flex-start; }
  .marco .chip { white-space: nowrap; flex-shrink: 0; }
  .passado { opacity: 0.55; }
</style>
