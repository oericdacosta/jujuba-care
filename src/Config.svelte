<script lang="ts">
  import { gerarIcs, baixar } from './lib/ics';
  import Horarios from './lib/Horarios.svelte';
  import { ITENS } from './lib/seed';
  import { agoraLocal, estado, validar } from './lib/store.svelte';

  const grupos = [
    { chave: '8', n: 3, titulo: 'A cada 8 horas' },
    { chave: '12', n: 2, titulo: 'A cada 12 horas' },
    { chave: '24', n: 1, titulo: 'A cada 24 horas (e 48 h)' },
  ];
  const usados = (chave: string) =>
    ITENS.filter((i) => !i.condicional && String(i.intervaloHoras >= 24 ? 24 : i.intervaloHoras) === chave).map((i) => i.nome);

  let msg = $state('');

  function exportarBackup() {
    baixar(`jujuba-backup-${agoraLocal().slice(0, 10)}.json`, JSON.stringify(estado.exportar(), null, 2), 'application/json');
  }

  async function importar(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const arq = input.files?.[0];
    input.value = '';
    if (!arq) return;
    try {
      const d = validar(JSON.parse(await arq.text()));
      if (!d) throw new Error('formato inválido');
      if (!confirm('Substituir todos os dados atuais pelos do backup?')) return;
      estado.aplicar(d);
      msg = 'Backup restaurado.';
    } catch {
      msg = 'Arquivo de backup inválido. Nada foi alterado.';
    }
  }

  function exportarIcs() {
    const ics = gerarIcs(ITENS, estado.planos, estado.hoje, 14);
    if (!ics.includes('BEGIN:VEVENT')) {
      msg = 'Escolha o início e os horários antes de exportar.';
      return;
    }
    baixar('jujuba-lembretes.ics', ics, 'text/calendar');
    msg = 'Arquivo gerado com os próximos 14 dias. Abra-o para adicionar ao Calendário.';
  }

  function zerar() {
    if (confirm('Apagar horários e todo o histórico deste aparelho? Isso não pode ser desfeito.')) estado.zerar();
  }
</script>

<div class="page">
  <h1>Ajustes</h1>

  <section class="card stack">
    <h2>1. Primeira dose</h2>
    <p class="muted">Quando foi (ou será) a primeira dose do tratamento. As datas de término partem daqui.</p>
    <input type="datetime-local" value={estado.config.inicio ?? ''} onchange={(e) => (estado.config.inicio = e.currentTarget.value || null)} />
  </section>

  <section class="card stack">
    <h2>2. Horários</h2>
    <p class="muted">Escolha os horários de cada frequência. Um remédio específico pode ter horário próprio na aba Remédios (por exemplo, o Sanus em jejum).</p>
    {#each grupos as g}
      <div class="stack">
        <strong>{g.titulo}</strong>
        <p class="muted">{usados(g.chave).join(', ')}</p>
        <Horarios
          n={g.n}
          valores={estado.config.ancoras[g.chave] ?? []}
          aoMudar={(v) => (estado.config.ancoras[g.chave] = v)}
        />
      </div>
    {/each}
  </section>

  <section class="card stack">
    <h2>Lembretes no Calendário</h2>
    <p class="muted">Notificações de sites são pouco confiáveis no iPhone. Este arquivo coloca os próximos 14 dias no Calendário do aparelho, com alarme 5 min antes. O que você marcar como feito no Calendário não volta para o app. Se mudar os horários, apague os eventos antigos e exporte de novo.</p>
    <button class="btn" onclick={exportarIcs}>Exportar lembretes (.ics)</button>
  </section>

  <section class="card stack">
    <h2>Backup</h2>
    <p class="muted">Os dados ficam só neste aparelho. Exporte de vez em quando.</p>
    <div class="row wrap">
      <button class="btn" onclick={exportarBackup}>Exportar backup</button>
      <label class="btn pick">Importar backup<input type="file" accept="application/json,.json" onchange={importar} hidden /></label>
    </div>
  </section>

  {#if msg}<p class="banner" role="status">{msg}</p>{/if}

  <section class="card stack">
    <h2>Instalar no iPhone</h2>
    <p class="muted">No Safari: Compartilhar → Adicionar à Tela de Início. Depois, abra pelo ícone.</p>
  </section>

  <button class="btn danger" onclick={zerar}>Apagar tudo neste aparelho</button>
</div>

<style>
  .pick { display: inline-flex; align-items: center; }
</style>
