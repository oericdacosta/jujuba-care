<script lang="ts">
  import { agendaDoDia, diaDoTratamento, type DoseDoDia } from './lib/agenda';
  import { addDays, fmtBR, fmtDiaSemana, minutos } from './lib/dates';
  import Dose from './lib/Dose.svelte';
  import { ITENS, ITEM_POR_ID, RETORNO } from './lib/seed';
  import { estado } from './lib/store.svelte';
  import { horaDe, periodo } from './lib/util';

  let { irPara }: { irPara: (aba: string) => void } = $props();

  let dia = $state(estado.hoje);
  let desfazer = $state<{ texto: string; fn: () => void } | null>(null);
  let timer: ReturnType<typeof setTimeout>;

  const ehHoje = $derived(dia === estado.hoje);
  const doDia = $derived(agendaDoDia(dia, ITENS, estado.planos, estado.doses));
  const faltaConfig = $derived(!estado.config.inicio);
  const semHorario = $derived(
    ITENS.filter((i) => !i.condicional && estado.planos[i.id]?.estimado && estado.planos[i.id].slots.length > 0),
  );
  const resolvidas = $derived(doDia.filter((d) => d.estado !== 'pendente').length);

  const agoraMin = $derived(estado.agora.getHours() * 60 + estado.agora.getMinutes());
  const atrasada = (d: DoseDoDia) =>
    d.estado === 'pendente' && (dia < estado.hoje || (ehHoje && minutos(d.slot.hora) + 30 < agoraMin));

  const grupos = $derived.by(() => {
    const m = new Map<string, DoseDoDia[]>();
    for (const d of doDia) m.set(d.slot.hora, [...(m.get(d.slot.hora) ?? []), d]);
    return [...m.entries()].map(([hora, itens]) => ({
      hora,
      itens: itens.sort((a, b) => Number(b.item.jejum === 'exigido') - Number(a.item.jejum === 'exigido')),
    }));
  });

  const sosItens = ITENS.filter((i) => i.condicional);
  const avisos = $derived.by(() => {
    const out: { texto: string; tipo: '' | 'risk' | 'ok' }[] = [];
    if (dia === addDays(RETORNO, -1)) out.push({ texto: 'Amanhã: retorno e exames na clínica (23/10).', tipo: '' });
    if (dia === RETORNO) out.push({ texto: 'Hoje: retorno e repetição de exames. Leve o histórico.', tipo: '' });
    for (const i of ITENS) {
      const p = estado.planos[i.id];
      if (!p?.inicio || p.estimado) continue;
      const enc = i.regras.find((r) => r.tipo === 'encerraQuandoInicia');
      if (enc && estado.planos[enc.item]?.inicio === dia)
        out.push({ texto: `Hoje começa a ${ITEM_POR_ID[enc.item].nome}. Suspenda o ${i.nome}.`, tipo: 'risk' });
      else if (p.fim === dia && i.tipo !== 'cuidado') out.push({ texto: `Último dia de ${i.nome}.`, tipo: 'ok' });
    }
    return out;
  });

  const numeroDaDose = (d: DoseDoDia) => estado.planos[d.item.id].slots.findIndex((s) => s.key === d.slot.key) + 1;

  function marcar(d: DoseDoDia, status: 'dado' | 'pulado') {
    estado.registrar(d.slot.key, status);
    avisar(`${d.item.nome}: ${status === 'dado' ? 'dado' : 'pulado'}`, () => estado.desfazer(d.slot.key));
  }

  function avisar(texto: string, fn: () => void) {
    clearTimeout(timer);
    desfazer = { texto, fn };
    timer = setTimeout(() => (desfazer = null), 8000);
  }

  const sosHoje = (id: string) => estado.sos.filter((s) => s.itemId === id && s.em.slice(0, 10) === estado.hoje);
  const ultimoSos = (id: string) => estado.sos.filter((s) => s.itemId === id).at(-1);

  function darSos(id: string) {
    const item = ITEM_POR_ID[id];
    const ult = ultimoSos(id);
    if (ult) {
      const horas = (estado.agora.getTime() - new Date(ult.em).getTime()) / 36e5;
      if (horas < item.intervaloHoras) {
        const ok = confirm(
          `A última dose foi às ${horaDe(ult.em)}, há ${horas.toFixed(1).replace('.', ',')} h. A receita indica intervalo de ${item.intervaloHoras} h. Registrar mesmo assim?`,
        );
        if (!ok) return;
      }
    }
    estado.registrarSos(id);
    const reg = estado.sos.at(-1)!;
    avisar(`${item.nome}: registrado`, () => estado.desfazerSos(reg.em, id));
  }
</script>

<div class="page">
  <header class="row between">
    <div>
      <h1>Jujuba 🐈‍⬛</h1>
      <p class="muted">3,55 kg · {fmtDiaSemana(dia)}{ehHoje ? ' · hoje' : ''}</p>
    </div>
    <div class="row">
      <button class="btn" aria-label="Dia anterior" onclick={() => (dia = addDays(dia, -1))}>‹</button>
      <button class="btn" aria-label="Próximo dia" onclick={() => (dia = addDays(dia, 1))}>›</button>
    </div>
  </header>

  {#if faltaConfig}
    <section class="card stack">
      <h2>Vamos começar</h2>
      <p>Falta dizer quando foi (ou será) a primeira dose e escolher os horários. O app não preenche isso por você.</p>
      <button class="btn primary" onclick={() => irPara('config')}>Escolher horários</button>
    </section>
  {:else if semHorario.length > 0}
    <section class="banner">
      <span aria-hidden="true">⏰</span>
      <div class="stack">
        <p><strong>{semHorario.length} remédios ainda sem horário</strong> e por isso não aparecem na agenda do dia.</p>
        <button class="btn" onclick={() => irPara('config')}>Escolher horários</button>
      </div>
    </section>
  {/if}

  {#each avisos as a}
    <div class="banner {a.tipo}"><span aria-hidden="true">{a.tipo === 'risk' ? '⚠️' : a.tipo === 'ok' ? '✔️' : '📅'}</span><p>{a.texto}</p></div>
  {/each}

  {#if doDia.length > 0}
    <section class="card stack">
      <div class="row between"><strong>{resolvidas} de {doDia.length} feitas</strong><span class="muted">{doDia.length - resolvidas} faltam</span></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={doDia.length} aria-valuenow={resolvidas}>
        <i style="width:{(resolvidas / doDia.length) * 100}%"></i>
      </div>
    </section>
  {/if}

  {#each grupos as g (g.hora)}
    {@const p = periodo(g.hora)}
    <section class="stack">
      <h2>{p.icone} {g.hora} · {p.nome}</h2>
      {#each g.itens as d (d.slot.key)}
        {@const tr = diaDoTratamento(d.item, estado.planos[d.item.id], dia)}
        <article class="card dose-card" class:feito={d.estado !== 'pendente'} class:atrasada={atrasada(d)}>
          <div class="row between wrap">
            <h3>{d.item.nome}</h3>
            {#if d.estado === 'feito'}<span class="chip ok">✓ dado às {horaDe(d.registro!.em)}</span>
            {:else if d.estado === 'pulado'}<span class="chip">pulado</span>
            {:else if atrasada(d)}<span class="chip late">atrasada</span>{/if}
          </div>
          {#if d.item.dose}<Dose dose={d.item.dose} tamanho={d.estado === 'pendente' ? 'g' : 'p'} />{/if}
          <div class="row wrap">
            {#if d.item.jejum === 'exigido'}<span class="chip fast">🚫🍽 em jejum</span>{/if}
            {#if d.item.jejum === 'proibido'}<span class="chip food">🍽 com comida</span>{/if}
            {#if d.item.via}<span class="chip">via {d.item.via}</span>{/if}
            {#if tr}<span class="chip">{tr.de ? `dose ${numeroDaDose(d)} de ${estado.planos[d.item.id].slots.length}` : `dia ${tr.n} · contínuo`}</span>{/if}
          </div>
          {#each d.item.obs.filter((o) => /diluída|jejum/i.test(o)) as o}<p class="muted">{o}</p>{/each}
          {#if d.estado === 'pendente'}
            <div class="row">
              <button class="btn primary grow" onclick={() => marcar(d, 'dado')}>{d.item.tipo === 'cuidado' ? 'Feito ✓' : 'Dei ✓'}</button>
              <button class="btn ghost" onclick={() => marcar(d, 'pulado')}>Pular</button>
            </div>
          {:else}
            <button class="btn ghost" onclick={() => estado.desfazer(d.slot.key)}>Desfazer</button>
          {/if}
        </article>
      {/each}
    </section>
  {:else}
    {#if !faltaConfig && semHorario.length === 0}
      <section class="card"><p>Nenhuma dose agendada para {fmtBR(dia)}.</p></section>
    {/if}
  {/each}

  {#if ehHoje}
    <section class="stack">
      <h2>Se precisar</h2>
      {#each sosItens as i}
        {@const ult = ultimoSos(i.id)}
        <article class="card sos stack">
          <div class="row between wrap"><h3>{i.nome}</h3><span class="chip sos">se precisar</span></div>
          {#if i.dose}<Dose dose={i.dose} tamanho="p" />{/if}
          <p>{i.condicional}</p>
          <p class="muted">
            {#if i.id !== 'peglax'}Intervalo da receita: a cada {i.intervaloHoras} h.{:else}Receita: 1 sachê a cada 24 h.{/if}
            {#if ult} Última: {ult.em.slice(0, 10) === estado.hoje ? 'hoje' : fmtBR(ult.em.slice(0, 10))} às {horaDe(ult.em)}.{/if}
            {#if sosHoje(i.id).length} Hoje: {sosHoje(i.id).length}x.{/if}
          </p>
          <button class="btn" onclick={() => darSos(i.id)}>Dei agora</button>
        </article>
      {/each}
    </section>
  {/if}
</div>

{#if desfazer}
  <div class="snack" role="status">
    <span>{desfazer.texto}</span>
    <button onclick={() => { desfazer?.fn(); desfazer = null; }}>Desfazer</button>
  </div>
{/if}

<style>
  .dose-card { display: grid; gap: 10px; border-left: 6px solid var(--mel); }
  .dose-card.feito { opacity: 0.7; border-left-color: var(--ok); }
  .dose-card.atrasada { border-left-color: var(--late); }
  .sos { border-style: dashed; }
  .grow { flex: 1; }
  .snack {
    position: fixed; left: 12px; right: 12px; bottom: calc(var(--tab) + 14px + env(safe-area-inset-bottom));
    background: var(--ink); color: var(--bg); border-radius: 14px; padding: 12px 16px; display: flex;
    justify-content: space-between; align-items: center; gap: 12px; max-width: 616px; margin: 0 auto; z-index: 5;
  }
  .snack button { background: none; border: none; color: var(--mel); font-weight: 800; min-height: 44px; padding: 0 8px; }
</style>
