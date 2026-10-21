<script lang="ts">
  import { onDestroy } from 'svelte';
  import { cabecalhoPadrao } from './cabecalho';
  import { addDays, fmtBR } from './dates';
  import { montarDados } from './plano';
  import { ITENS, RETORNO } from './seed';
  import { estado } from './store.svelte';

  let desde = $state(estado.hoje);
  let dias = $state(7);
  let gerando = $state(false);
  let erro = $state('');
  let pdf = $state<{ url: string; arquivo: File } | null>(null);

  const nome = $derived(`jujuba-plano-${desde}.pdf`);
  const podeCompartilhar = (f: File) =>
    typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [f] }) && matchMedia('(pointer: coarse)').matches;

  function limpar() {
    if (pdf) URL.revokeObjectURL(pdf.url);
    pdf = null;
  }
  onDestroy(limpar);

  async function gerar() {
    erro = '';
    limpar();
    gerando = true;
    try {
      const { gerarPdf } = await import('./pdf'); // carrega o gerador só quando precisa
      const hoje = new Date();
      const dados = montarDados(ITENS, estado.planos, estado.config, desde, dias, RETORNO);
      const doc = gerarPdf(dados, cabecalhoPadrao(hoje.toLocaleDateString('pt-BR')));
      const blob = doc.output('blob');
      pdf = { url: URL.createObjectURL(blob), arquivo: new File([blob], nome, { type: 'application/pdf' }) };
    } catch (e) {
      erro = 'Não foi possível gerar o PDF. Tente de novo.';
      console.error(e);
    } finally {
      gerando = false;
    }
  }

  async function compartilhar() {
    if (!pdf) return;
    try {
      await navigator.share({ files: [pdf.arquivo], title: 'Plano da Jujuba' });
    } catch {
      /* a pessoa fechou a folha de compartilhar */
    }
  }
</script>

<section class="card stack">
  <h2>🖨️ Plano para imprimir (PDF)</h2>
  <p class="muted">
    Folha com a rotina do dia por horário, os remédios "se precisar", as datas importantes e um checklist para marcar cada dose no papel.
  </p>

  {#if !estado.config.inicio}
    <p class="banner">Defina a primeira dose em Ajustes antes de gerar o PDF.</p>
  {:else}
    <div class="row wrap">
      <label class="stack">
        <span class="muted">Checklist a partir de</span>
        <input type="date" value={desde} onchange={(e) => { desde = e.currentTarget.value || estado.hoje; limpar(); }} />
      </label>
      <label class="stack">
        <span class="muted">Quantos dias</span>
        <select bind:value={dias} onchange={limpar}>
          <option value={7}>7 dias</option>
          <option value={14}>14 dias</option>
        </select>
      </label>
    </div>
    <p class="muted">Checklist de {fmtBR(desde)} a {fmtBR(addDays(desde, dias - 1))}.</p>

    {#if !pdf}
      <button class="btn primary" onclick={gerar} disabled={gerando}>{gerando ? 'Gerando…' : 'Gerar PDF'}</button>
    {:else}
      <p class="banner ok" role="status">PDF pronto. Abra para imprimir ou salvar.</p>
      <div class="row wrap">
        {#if podeCompartilhar(pdf.arquivo)}
          <button class="btn primary" onclick={compartilhar}>Imprimir ou compartilhar</button>
        {/if}
        <a class="btn link" href={pdf.url} target="_blank" rel="noopener">Abrir PDF</a>
        <a class="btn link" href={pdf.url} download={nome}>Baixar</a>
      </div>
      <button class="btn ghost" onclick={gerar}>Gerar de novo</button>
    {/if}
  {/if}
  {#if erro}<p class="banner risk" role="alert">{erro}</p>{/if}
</section>

<style>
  .link { display: inline-flex; align-items: center; text-decoration: none; color: var(--ink); }
  select {
    font: inherit; min-height: 48px; padding: 0 10px; border-radius: 12px;
    border: 1px solid var(--line); background: var(--card); color: var(--ink);
  }
</style>
