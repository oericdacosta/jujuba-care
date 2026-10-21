import type { Cabecalho } from './pdf';
import { CLINICA, EMITIDA_EM, META_LIQUIDOS_ML, ORIENTACOES, PACIENTE } from './seed';

const br = (s: string) => s.split('-').reverse().join('/');

export function cabecalhoPadrao(geradoEm: string): Cabecalho {
  return {
    paciente: PACIENTE.nome,
    especie: PACIENTE.especie,
    peso: `${String(PACIENTE.pesoKg).replace('.', ',')} kg`,
    receita: `Receita de ${br(EMITIDA_EM)}`,
    clinica: CLINICA.nome,
    telefones: CLINICA.telefones.map((t) => t.rotulo),
    orientacoes: ORIENTACOES,
    liquidos: `${META_LIQUIDOS_ML} mL`,
    geradoEm,
  };
}
