<script lang="ts">
  import type { Item } from './schema';

  let { dose, tamanho = 'g' }: { dose: NonNullable<Item['dose']>; tamanho?: 'g' | 'p' } = $props();

  const seringaMax = $derived(dose.valor <= 1 ? 1 : dose.valor <= 3 ? 3 : dose.valor <= 5 ? 5 : 10);
  const fatia = $derived(Math.min(dose.valor, 1));

  function arco(f: number): string {
    if (f >= 1) return '';
    const a = -Math.PI / 2 + f * 2 * Math.PI;
    const x = 20 + 16 * Math.cos(a), y = 20 + 16 * Math.sin(a);
    return `M20 20 L20 4 A16 16 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
  }
</script>

<div class="dose" class:p={tamanho === 'p'}>
  <div class="art" aria-hidden="true">
    {#if dose.unidade === 'mL'}
      <svg viewBox="0 0 150 34" width="150" height="34">
        <line x1="2" y1="17" x2="22" y2="17" stroke="currentColor" stroke-width="2" />
        <rect x="22" y="7" width="100" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2" />
        <rect x="23" y="8" width={98 * (dose.valor / seringaMax)} height="18" fill="var(--mel)" />
        {#each Array.from({ length: seringaMax + 1 }, (_, i) => i) as t}
          <line x1={22 + (100 * t) / seringaMax} y1="7" x2={22 + (100 * t) / seringaMax} y2="12" stroke="currentColor" stroke-width="1.5" />
        {/each}
        <line x1="122" y1="17" x2="144" y2="17" stroke="currentColor" stroke-width="2" />
        <line x1="144" y1="8" x2="144" y2="26" stroke="currentColor" stroke-width="3" />
      </svg>
      <span class="legenda">seringa de {seringaMax} mL</span>
    {:else if dose.unidade === 'gotas'}
      <svg viewBox="0 0 {dose.valor * 34} 40" width={dose.valor * 34} height="40">
        {#each Array.from({ length: dose.valor }, (_, i) => i) as i}
          <path transform="translate({i * 34 + 3} 0)" d="M14 3 C14 3 3 17 3 25 a11 11 0 0 0 22 0 C25 17 14 3 14 3 Z" fill="var(--mel)" stroke="currentColor" stroke-width="2" />
        {/each}
      </svg>
    {:else if dose.unidade === 'comprimido'}
      <svg viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="16" fill="var(--card)" stroke="currentColor" stroke-width="2" />
        {#if fatia >= 1}
          <circle cx="20" cy="20" r="16" fill="var(--mel)" stroke="currentColor" stroke-width="2" />
        {:else}
          <path d={arco(fatia)} fill="var(--mel)" />
          <line x1="20" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="2" />
        {/if}
      </svg>
    {:else if dose.unidade === 'cápsula'}
      <svg viewBox="0 0 70 30" width="70" height="30">
        <rect x="3" y="4" width="64" height="22" rx="11" fill="var(--card)" stroke="currentColor" stroke-width="2" />
        <path d="M35 4 H14 a11 11 0 0 0 0 22 H35 Z" fill="var(--mel)" stroke="currentColor" stroke-width="2" />
      </svg>
    {:else}
      <svg viewBox="0 0 50 40" width="50" height="40">
        <path d="M6 6 H44 V34 H6 Z M6 6 L10 3 H40 L44 6" fill="var(--mel)" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        <line x1="12" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="2" />
      </svg>
    {/if}
  </div>
  <strong class="valor">{dose.exibir}</strong>
</div>

<style>
  .dose { display: flex; align-items: center; gap: 12px; }
  .art { flex-shrink: 0; }
  .art { display: grid; justify-items: start; gap: 2px; }
  .legenda { font-size: 0.72rem; color: var(--muted); }
  .valor { font-size: 1.6rem; line-height: 1.1; font-weight: 800; }
  .p .valor { font-size: 1.15rem; }
  .p svg { transform: scale(0.8); transform-origin: left center; }
</style>
