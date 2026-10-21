import { resolver } from './agenda';
import { pad, ymd } from './dates';
import type { Config, Registro, SosRegistro } from './schema';
import { ITENS } from './seed';

const CHAVE = 'jujuba.v1';
export const VERSAO = 1;

export interface Dados {
  versao: number;
  config: Config;
  doses: Record<string, Registro>;
  sos: SosRegistro[];
  agua: Record<string, number>;
}

export const configVazia = (): Config => ({ inicio: null, ancoras: {}, horariosItem: {}, fimManual: {} });

export function agoraLocal(d = new Date()): string {
  return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function carregar(): Dados {
  const vazio: Dados = { versao: VERSAO, config: configVazia(), doses: {}, sos: [], agua: {} };
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazio;
    return validar(JSON.parse(bruto)) ?? vazio;
  } catch {
    return vazio;
  }
}

/** Aceita só o formato conhecido; devolve null se algo estiver fora do esperado. */
export function validar(x: unknown): Dados | null {
  if (!x || typeof x !== 'object') return null;
  const d = x as Partial<Dados>;
  if (d.versao !== VERSAO || !d.config || typeof d.config !== 'object') return null;
  if (!d.doses || typeof d.doses !== 'object' || !Array.isArray(d.sos)) return null;
  return {
    versao: VERSAO,
    config: { ...configVazia(), ...d.config },
    doses: d.doses,
    sos: d.sos,
    agua: d.agua && typeof d.agua === 'object' ? d.agua : {},
  };
}

class Estado {
  config = $state<Config>(configVazia());
  doses = $state<Record<string, Registro>>({});
  sos = $state<SosRegistro[]>([]);
  agua = $state<Record<string, number>>({});
  agora = $state(new Date());
  planos = $derived(resolver(ITENS, this.config));

  constructor() {
    this.aplicar(carregar());
    setInterval(() => (this.agora = new Date()), 30_000);
    $effect.root(() => {
      $effect(() => {
        try {
          localStorage.setItem(CHAVE, JSON.stringify(this.exportar()));
        } catch {
          /* armazenamento indisponível: o app continua funcionando na sessão */
        }
      });
    });
  }

  hoje = $derived(ymd(this.agora));

  exportar(): Dados {
    return $state.snapshot({
      versao: VERSAO, config: this.config, doses: this.doses, sos: this.sos, agua: this.agua,
    }) as Dados;
  }

  aplicar(d: Dados) {
    this.config = d.config;
    this.doses = d.doses;
    this.sos = d.sos;
    this.agua = d.agua;
  }

  registrar(key: string, status: Registro['status']) {
    this.doses[key] = { status, em: agoraLocal() };
  }

  desfazer(key: string) {
    delete this.doses[key];
  }

  registrarSos(itemId: string) {
    this.sos.push({ itemId, em: agoraLocal() });
  }

  desfazerSos(em: string, itemId: string) {
    const i = this.sos.findIndex((s) => s.em === em && s.itemId === itemId);
    if (i >= 0) this.sos.splice(i, 1);
  }

  somarAgua(data: string, ml: number) {
    this.agua[data] = Math.max(0, (this.agua[data] ?? 0) + ml);
  }

  zerar() {
    this.aplicar({ versao: VERSAO, config: configVazia(), doses: {}, sos: [], agua: {} });
  }
}

export const estado = new Estado();
