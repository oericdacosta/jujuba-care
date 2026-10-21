<script lang="ts">
  let { n, valores, aoMudar }: { n: number; valores: string[]; aoMudar: (v: string[]) => void } = $props();

  function mudar(i: number, v: string) {
    const novo = Array.from({ length: n }, (_, k) => valores[k] ?? '');
    novo[i] = v;
    aoMudar(novo);
  }
</script>

<div class="row wrap">
  {#each Array.from({ length: n }, (_, i) => i) as i}
    <label class="stack">
      <span class="muted">{n > 1 ? `${i + 1}ª dose` : 'Horário'}</span>
      <input type="time" value={valores[i] ?? ''} onchange={(e) => mudar(i, e.currentTarget.value)} />
    </label>
  {/each}
</div>
