<script lang="ts">
  import { CLINICA, CUIDADOS_SONDA, DUVIDAS_GERAIS, ITENS, META_LIQUIDOS_ML, ORIENTACOES } from './lib/seed';
  import { estado } from './lib/store.svelte';

  const agua = $derived(estado.agua[estado.hoje] ?? 0);
  const duvidasPorItem = ITENS.filter((i) => i.duvidas.length);
</script>

<div class="page">
  <h1>Sonda e cuidados</h1>

  <section class="card stack">
    <h2>💧 Líquidos de hoje</h2>
    <p><strong class="grande">{agua}</strong> de {META_LIQUIDOS_ML} mL</p>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={META_LIQUIDOS_ML} aria-valuenow={agua}>
      <i style="width:{Math.min(100, (agua / META_LIQUIDOS_ML) * 100)}%"></i>
    </div>
    <div class="row wrap">
      {#each [10, 20, 50] as ml}<button class="btn" onclick={() => estado.somarAgua(estado.hoje, ml)}>+{ml} mL</button>{/each}
      <button class="btn ghost" onclick={() => estado.somarAgua(estado.hoje, -10)}>−10</button>
    </div>
    <p class="muted">Meta da receita: média de 180 mL de líquidos por dia. O que entra na conta (por exemplo a água da sonda) é dúvida para a veterinária.</p>
  </section>

  <section class="card stack">
    <h2>Cuidados com a sonda</h2>
    <p class="muted">A limpeza a cada 12 h aparece na aba Hoje, junto das doses.</p>
    <ul>{#each CUIDADOS_SONDA as c}<li>{c}</li>{/each}</ul>
  </section>

  <section class="card stack">
    <h2>Orientações gerais</h2>
    <ul>{#each ORIENTACOES as o}<li>{o}</li>{/each}</ul>
  </section>

  <section class="card stack">
    <h2>Sinal de piora ou secreção na sonda?</h2>
    <p>Ligue para a {CLINICA.nome}:</p>
    <div class="row wrap">
      {#each CLINICA.telefones as t}<a class="btn primary ligar" href={t.href}>📞 {t.rotulo}</a>{/each}
    </div>
  </section>

  <section class="card stack">
    <h2>Perguntas para a veterinária</h2>
    <ul>{#each DUVIDAS_GERAIS as d}<li>{d}</li>{/each}</ul>
    {#each duvidasPorItem as i}
      <p><strong>{i.nome}</strong></p>
      <ul>{#each i.duvidas as d}<li>{d}</li>{/each}</ul>
    {/each}
  </section>

  <p class="muted">
    Este app só organiza e registra o que está na receita. Ele não recomenda nem calcula doses e não substitui a orientação da veterinária.
    Em caso de dúvida, confira o papel original.
  </p>
</div>

<style>
  .grande { font-size: 2rem; }
  ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; }
  .ligar { display: inline-flex; align-items: center; text-decoration: none; }
</style>
