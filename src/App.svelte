<script lang="ts">
  import Agenda from './Agenda.svelte';
  import Config from './Config.svelte';
  import Cuidados from './Cuidados.svelte';
  import Historico from './Historico.svelte';
  import Hoje from './Hoje.svelte';
  import Remedios from './Remedios.svelte';

  const abas = [
    { id: 'hoje', rotulo: 'Hoje', icone: '🏠' },
    { id: 'agenda', rotulo: 'Agenda', icone: '📅' },
    { id: 'remedios', rotulo: 'Remédios', icone: '💊' },
    { id: 'cuidados', rotulo: 'Sonda', icone: '🩹' },
    { id: 'historico', rotulo: 'Histórico', icone: '📋' },
    { id: 'config', rotulo: 'Ajustes', icone: '⚙️' },
  ];

  let aba = $state('hoje');
  const ir = (a: string) => {
    aba = a;
    window.scrollTo(0, 0);
  };
</script>

<main>
  {#if aba === 'hoje'}<Hoje irPara={ir} />
  {:else if aba === 'agenda'}<Agenda />
  {:else if aba === 'remedios'}<Remedios />
  {:else if aba === 'cuidados'}<Cuidados />
  {:else if aba === 'historico'}<Historico />
  {:else}<Config irPara={ir} />{/if}
</main>

<nav aria-label="Principal">
  {#each abas as a}
    <button class:ativa={aba === a.id} aria-current={aba === a.id ? 'page' : undefined} onclick={() => ir(a.id)}>
      <span aria-hidden="true">{a.icone}</span>
      <span>{a.rotulo}</span>
    </button>
  {/each}
</nav>

<style>
  nav {
    position: fixed; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(6, 1fr);
    background: var(--card); border-top: 1px solid var(--line); z-index: 10;
    padding-bottom: env(safe-area-inset-bottom);
  }
  nav button {
    background: none; border: none; min-height: var(--tab); display: grid; place-items: center; align-content: center;
    gap: 2px; font-size: 0.7rem; font-weight: 700; color: var(--muted); padding: 4px 0;
  }
  nav button span:first-child { font-size: 1.3rem; }
  nav button.ativa { color: var(--ink); box-shadow: inset 0 3px 0 var(--mel); }
</style>
