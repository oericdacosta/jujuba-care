<script lang="ts">
  import { espacar, horariosDoGrupo } from './agenda';
  import type { Item } from './schema';
  import { estado } from './store.svelte';

  let { chave, n, titulo, itens }: { chave: string; n: number; titulo: string; itens: Item[] } = $props();

  const valores = $derived(horariosDoGrupo(chave, n, estado.config) ?? []);
  const manual = $derived(Boolean(estado.config.ancoras[chave]));
  const proprios = $derived(itens.filter((i) => estado.config.horariosItem[i.id]));

  /** Mudar a 1ª dose reposiciona as outras no intervalo certo; as demais mudam sozinhas. */
  function mudar(i: number, v: string) {
    if (!v) return;
    if (i === 0) {
      const novos = espacar(v, n);
      // mantém a ordem "1ª, 2ª, 3ª" a partir do horário escolhido
      const k = novos.indexOf(v);
      estado.config.ancoras[chave] = [...novos.slice(k), ...novos.slice(0, k)];
      return;
    }
    const atual = estado.config.ancoras[chave] ?? [...valores];
    const novo = Array.from({ length: n }, (_, j) => atual[j] ?? '');
    novo[i] = v;
    estado.config.ancoras[chave] = novo;
  }

  const ordenados = $derived.by(() => {
    const a = estado.config.ancoras[chave];
    return a && a.length === n && a.every(Boolean) ? a : valores;
  });
</script>

<section class="grupo stack">
  <div class="row between wrap">
    <h2>⏰ {titulo}</h2>
    <span class="chip {manual ? 'food' : ''}">{manual ? 'escolhido por você' : 'automático'}</span>
  </div>
  <p class="muted">
    {n > 1
      ? 'Escolha o horário da 1ª dose e as outras se ajustam sozinhas. Vale para todos os remédios abaixo.'
      : 'Um horário para todos os remédios abaixo.'}
  </p>

  <div class="row wrap">
    {#each Array.from({ length: n }, (_, i) => i) as i}
      <label class="stack">
        <span class="muted">{n > 1 ? `${i + 1}ª dose` : 'Horário'}</span>
        <input type="time" value={ordenados[i] ?? ''} onchange={(e) => mudar(i, e.currentTarget.value)} />
      </label>
    {/each}
  </div>

  {#if proprios.length}
    <div class="banner">
      <span aria-hidden="true">ℹ️</span>
      <div class="stack">
        {#each proprios as p}
          <div class="row between wrap">
            <span><strong>{p.nome}</strong> tem horário próprio ({estado.config.horariosItem[p.id].join(', ')}).</span>
            <button class="btn ghost" onclick={() => delete estado.config.horariosItem[p.id]}>Seguir o grupo</button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if manual}
    <button class="btn ghost" onclick={() => delete estado.config.ancoras[chave]}>Voltar ao automático</button>
  {/if}
</section>

<style>
  .grupo { background: var(--mel-soft); border-radius: var(--radius); padding: 14px; }
</style>
