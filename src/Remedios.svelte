<script lang="ts">
  import { horariosDoItem } from './lib/agenda';
  import { fmtBR } from './lib/dates';
  import Dose from './lib/Dose.svelte';
  import PdfCard from './lib/PdfCard.svelte';
  import type { Item } from './lib/schema';
  import { ITENS, ITEM_POR_ID } from './lib/seed';
  import { estado } from './lib/store.svelte';
  import { periodo } from './lib/util';

  let aberto = $state<string | null>(null);

  function situacao(id: string) {
    const item = ITEM_POR_ID[id];
    const p = estado.planos[id];
    if (item.condicional) return { rotulo: 'se precisar', tipo: 'sos' };
    if (!p.inicio) return { rotulo: 'ainda não iniciado', tipo: '' };
    if (p.inicio > estado.hoje) return { rotulo: `começa ${fmtBR(p.inicio)}`, tipo: 'late' };
    if (p.fim && p.fim < estado.hoje) return { rotulo: `encerrado em ${fmtBR(p.fim)}`, tipo: '' };
    if (p.fim) return { rotulo: `até ${fmtBR(p.fim)}`, tipo: 'ok' };
    return { rotulo: '∞ contínuo', tipo: 'ok' };
  }

  /** Rotina fixa: cada horário com os itens dele (só os que ainda estão em uso). */
  const rotina = $derived.by(() => {
    const m = new Map<string, Item[]>();
    for (const item of ITENS) {
      const p = estado.planos[item.id];
      if (!p.slots.length || (p.fim && p.fim < estado.hoje)) continue;
      for (const h of horariosDoItem(item) ?? []) m.set(h, [...(m.get(h) ?? []), item]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  const fixos = ITENS.filter((i) => !i.condicional && i.horarios);
  const fora = ITENS.filter((i) => !i.condicional && !i.horarios);
  const sos = ITENS.filter((i) => i.condicional);

  const frequencia = (h: number) => (h === 48 ? 'a cada 48 h (dia sim, dia não)' : `a cada ${h} h`);
</script>

{#snippet cartao(item: Item)}
  {@const s = situacao(item.id)}
  {@const p = estado.planos[item.id]}
  <article class="card stack">
    <button class="head" aria-expanded={aberto === item.id} onclick={() => (aberto = aberto === item.id ? null : item.id)}>
      <div>
        <h3>{item.ordem}. {item.nome}</h3>
        <p class="muted">
          {frequencia(item.intervaloHoras)} · {item.duracaoDias ? `${item.duracaoDias} dias` : 'até novas recomendações'}
        </p>
      </div>
      <span class="chip {s.tipo}">{s.rotulo}</span>
    </button>

    {#if item.horarios}
      <div class="row wrap">
        {#each item.horarios as h}<span class="chip hora">⏰ {h}</span>{/each}
        {#if item.jejum === 'exigido'}<span class="chip fast">🚫🍽 em jejum</span>{/if}
        {#if item.jejum === 'proibido'}<span class="chip food">🍽 com comida</span>{/if}
      </div>
    {/if}

    {#if item.dose}<Dose dose={item.dose} tamanho="p" />{/if}

    {#if item.duvidas.length}
      <p class="chip risk">⚠ confirmar com a veterinária</p>
    {/if}

    {#if aberto === item.id}
      <div class="stack detalhe">
        <div>
          <p class="muted">Texto da receita</p>
          <p class="original">“{item.original}”</p>
        </div>
        {#each item.obs as o}<p>• {o}</p>{/each}
        {#if item.duvidas.length}
          <div class="banner risk"><span aria-hidden="true">⚠️</span>
            <div class="stack">{#each item.duvidas as d}<p>{d}</p>{/each}</div>
          </div>
        {/if}

        {#if p.inicio}
          {#if estado.config.fimManual[item.id]}
            <button class="btn" onclick={() => delete estado.config.fimManual[item.id]}>Reativar tratamento</button>
          {:else}
            <button class="btn danger" onclick={() => confirm(`Encerrar ${item.nome} hoje? Doses depois de hoje saem da agenda.`) && (estado.config.fimManual[item.id] = estado.hoje)}>
              Encerrar tratamento hoje
            </button>
          {/if}
        {/if}
      </div>
    {/if}
  </article>
{/snippet}

<div class="page">
  <h1>Remédios</h1>
  <p class="muted">Receita de 21/10/2026 com horários fixos. O tratamento conta a partir de 21/10.</p>

  <section class="card stack rotina">
    <h2>⏰ Rotina fixa do dia</h2>
    {#each rotina as [hora, itens] (hora)}
      <div class="linha">
        <strong class="h">{hora}</strong>
        <div>
          <span class="muted">{periodo(hora).nome}</span>
          <p>{itens.map((i) => i.nome).join(', ')}</p>
        </div>
      </div>
    {/each}
  </section>

  <PdfCard />

  <h2>Remédios com horário</h2>
  {#each fixos as item (item.id)}{@render cartao(item)}{/each}

  {#if fora.length}
    <h2>Ainda não iniciados</h2>
    <p class="muted">Fora da rotina e do PDF por enquanto.</p>
    {#each fora as item (item.id)}{@render cartao(item)}{/each}
  {/if}

  <h2>Se precisar</h2>
  <p class="muted">Não têm horário fixo: registre na aba Hoje quando der.</p>
  {#each sos as item (item.id)}{@render cartao(item)}{/each}
</div>

<style>
  .head { all: unset; cursor: pointer; display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; min-height: 48px; }
  .head:focus-visible { outline: 3px solid var(--fast); outline-offset: 4px; }
  .original { font-style: italic; }
  .detalhe { border-top: 1px solid var(--line); padding-top: 10px; }
  .chip.hora { background: var(--mel-soft); color: var(--ink); }
  .rotina { gap: 0; }
  .rotina h2 { margin-bottom: 8px; }
  .linha { display: grid; grid-template-columns: 64px 1fr; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line); }
  .h { font-size: 1.1rem; }
</style>
