<script lang="ts">
  import { fmtDiaSemana } from './lib/dates';
  import { ITEM_POR_ID } from './lib/seed';
  import { baixar } from './lib/ics';
  import { estado } from './lib/store.svelte';
  import { horaDe } from './lib/util';

  interface Linha { quando: string; dia: string; texto: string; tipo: 'dado' | 'pulado' | 'sos' }

  const linhas = $derived.by(() => {
    const l: Linha[] = [];
    for (const [key, r] of Object.entries(estado.doses)) {
      const [id, prev] = key.split('|');
      const it = ITEM_POR_ID[id];
      if (!it) continue;
      l.push({
        quando: r.em, dia: r.em.slice(0, 10), tipo: r.status,
        texto: `${r.status === 'dado' ? '' : '(pulado) '}${it.nome}${it.dose ? ' ' + it.dose.exibir : ''} · previsto ${prev.slice(11)}`,
      });
    }
    for (const s of estado.sos) {
      const it = ITEM_POR_ID[s.itemId];
      l.push({ quando: s.em, dia: s.em.slice(0, 10), tipo: 'sos', texto: `${it.nome}${it.dose ? ' ' + it.dose.exibir : ''} · se precisar` });
    }
    return l.sort((a, b) => b.quando.localeCompare(a.quando));
  });

  const porDia = $derived.by(() => {
    const m = new Map<string, Linha[]>();
    for (const x of linhas) m.set(x.dia, [...(m.get(x.dia) ?? []), x]);
    return [...m.entries()];
  });

  function texto(): string {
    return (
      'Histórico de doses - Jujuba\n\n' +
      [...porDia].reverse().map(([d, ls]) => `${fmtDiaSemana(d)}\n` + [...ls].reverse().map((x) => `  ${horaDe(x.quando)}  ${x.texto}`).join('\n')).join('\n\n') +
      '\n'
    );
  }

  let copiado = $state(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto());
      copiado = true;
      setTimeout(() => (copiado = false), 2000);
    } catch {
      baixar('historico-jujuba.txt', texto(), 'text/plain');
    }
  }
</script>

<div class="page">
  <h1>Histórico</h1>
  {#if linhas.length === 0}
    <p class="card">Nada registrado ainda. As doses que você marcar aparecem aqui.</p>
  {:else}
    <div class="row wrap">
      <button class="btn" onclick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar para a consulta'}</button>
      <button class="btn ghost" onclick={() => baixar('historico-jujuba.txt', texto(), 'text/plain')}>Baixar .txt</button>
    </div>
    {#each porDia as [dia, ls]}
      <section class="card stack">
        <h2>{fmtDiaSemana(dia)}</h2>
        {#each ls as x}
          <div class="row"><span class="chip {x.tipo === 'dado' ? 'ok' : x.tipo === 'sos' ? 'sos' : ''}">{horaDe(x.quando)}</span><span>{x.texto}</span></div>
        {/each}
      </section>
    {/each}
  {/if}
</div>
