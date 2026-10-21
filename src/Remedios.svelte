<script lang="ts">
  import { chaveGrupo, dosesPorDia, GRUPOS, horariosDoItem } from './lib/agenda';
  import type { Item } from './lib/schema';
  import GrupoHorarios from './lib/GrupoHorarios.svelte';
  import PdfCard from './lib/PdfCard.svelte';
  import { fmtBR } from './lib/dates';
  import Dose from './lib/Dose.svelte';
  import Horarios from './lib/Horarios.svelte';
  import { ITENS, ITEM_POR_ID } from './lib/seed';
  import { estado } from './lib/store.svelte';

  let aberto = $state<string | null>(null);

  function situacao(id: string) {
    const item = ITEM_POR_ID[id];
    const p = estado.planos[id];
    if (item.condicional) return { rotulo: 'se precisar', tipo: 'sos' };
    if (!p.inicio) return { rotulo: p.semInicio ? 'sem data de início' : 'aguardando', tipo: '' };
    const pref = p.estimado ? '≈ ' : '';
    if (p.inicio > estado.hoje) {
      const bloq = item.regras.some((r) => r.tipo === 'inicioApos');
      return { rotulo: `${bloq ? '🔒 ' : ''}começa ${pref}${fmtBR(p.inicio)}`, tipo: 'late' };
    }
    if (p.fim && p.fim < estado.hoje) return { rotulo: `encerrado em ${fmtBR(p.fim)}`, tipo: '' };
    if (p.fim) return { rotulo: `até ${pref}${fmtBR(p.fim)}`, tipo: 'ok' };
    return { rotulo: '∞ contínuo', tipo: 'ok' };
  }

  function mudarHorarios(id: string, v: string[]) {
    if (v.every((x) => !x)) delete estado.config.horariosItem[id];
    else estado.config.horariosItem[id] = v;
  }

  const doGrupo = (chave: string) => ITENS.filter((i) => !i.condicional && chaveGrupo(i) === chave);
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

        {#if !item.condicional}
          <div class="stack">
            <p class="muted">Horário {estado.config.horariosItem[item.id] ? 'próprio deste remédio' : 'do grupo'}. Mude aqui só se este remédio precisar de um horário diferente dos outros do grupo.</p>
            <Horarios
              n={dosesPorDia(item)}
              valores={horariosDoItem(item, estado.config) ?? []}
              aoMudar={(v) => mudarHorarios(item.id, v)}
            />
            {#if estado.config.horariosItem[item.id]}
              <button class="btn ghost" onclick={() => delete estado.config.horariosItem[item.id]}>Seguir o horário do grupo</button>
            {/if}
          </div>

          {#if p.inicio}
            {#if estado.config.fimManual[item.id]}
              <button class="btn" onclick={() => delete estado.config.fimManual[item.id]}>Reativar tratamento</button>
            {:else}
              <button class="btn danger" onclick={() => confirm(`Encerrar ${item.nome} hoje? Doses depois de hoje saem da agenda.`) && (estado.config.fimManual[item.id] = estado.hoje)}>
                Encerrar tratamento hoje
              </button>
            {/if}
          {/if}
        {/if}
      </div>
    {/if}
  </article>
{/snippet}

<div class="page">
  <h1>Remédios</h1>
  <p class="muted">Transcrição da receita de 21/10/2026, separada por frequência. Defina o horário de cada grupo e todos os remédios dele seguem juntos.</p>

  {#each GRUPOS as g (g.chave)}
    {@const itens = doGrupo(g.chave)}
    {#if itens.length}
      <GrupoHorarios chave={g.chave} n={g.n} titulo={g.titulo} {itens} />
      {#each itens as item (item.id)}{@render cartao(item)}{/each}
    {/if}
  {/each}

  <h2>Se precisar</h2>
  <p class="muted">Não têm horário fixo: registre na aba Hoje quando der.</p>
  {#each sos as item (item.id)}{@render cartao(item)}{/each}

  <PdfCard />
</div>

<style>
  .head { all: unset; cursor: pointer; display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; min-height: 48px; }
  .head:focus-visible { outline: 3px solid var(--fast); outline-offset: 4px; }
  .original { font-style: italic; }
  .detalhe { border-top: 1px solid var(--line); padding-top: 10px; }
</style>
