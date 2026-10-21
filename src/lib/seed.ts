import type { Item } from './schema';

// Transcrição da receita de 21/10/2026 (HOSPIVET, Dra. Andressa Silva de Sousa).
// Nenhum valor foi alterado ou convertido; dúvidas ficam em `duvidas`.

export const PACIENTE = { nome: 'Jujuba', especie: 'Felina', pesoKg: 3.55, pesoData: '2026-10-17' };
export const EMITIDA_EM = '2026-10-21';
export const RETORNO = '2026-10-23';
export const CLINICA = {
  nome: 'HOSPIVET',
  telefones: [
    { rotulo: '(88) 3614-3133', href: 'tel:+558836143133' },
    { rotulo: '(88) 99951-0382', href: 'tel:+5588999510382' },
  ],
};

export const ORIENTACOES = [
  'Ofertar exclusivamente ração gastrointestinal Royal Canin ou Vetlife, até novas recomendações.',
  'Paciente deve ingerir uma média de 180 mL de líquidos por dia.',
  'Retorno e repetição de exames no dia 23/10/26.',
  'Em quadro de piora, retornar para reavaliação.',
];

export const META_LIQUIDOS_ML = 180;

export const CUIDADOS_SONDA = [
  'Limpar a cada 12 horas com solução fisiológica (NaCl 0,9%) e gaze.',
  'Usar sempre luvas na limpeza da sonda.',
  'Manter a sonda sempre coberta com atadura.',
  'Se houver secreção ou mau cheiro, entrar em contato imediatamente.',
  'Se a Jujuba quiser mexer na sonda, colocar um colar nela.',
  'Evitar ambientes sujos e caixa de areia com areia (trocar por papel higiênico ou jornal).',
  'A sonda fica fechada 24 horas por dia, abrindo só para alimentar e medicar.',
  'Sempre que abrir a sonda, dobrá-la para não entrar ar.',
  'Ao medicar ou alimentar, usar água suficiente para lavar a sonda e deixá-la limpa.',
];

const nd = 'Não administrar medicação em jejum.';

export const ITENS: Item[] = [
  {
    id: 'dipirona', ordem: 1, nome: 'Dipirona', tipo: 'farmacia', via: 'oral',
    dose: { valor: 3, exibir: '3 gotas', unidade: 'gotas' },
    intervaloHoras: 12, duracaoDias: 3, condicional: null, jejum: 'nao',
    original: 'Dipirona (500mg/mL). Dar 3 gotas, a cada 12 h, por 3 dias.',
    obs: ['500 mg/mL'],
    duvidas: ['Quantas gotas cabem em 1 mL no frasco usado?'],
    regras: [],
  },
  {
    id: 'amoxicilina', ordem: 2, nome: 'Amoxicilina + clavulanato de potássio', tipo: 'farmacia', via: 'oral',
    dose: { valor: 0.9, exibir: '0,9 mL', unidade: 'mL' },
    intervaloHoras: 12, duracaoDias: 24, condicional: null, jejum: 'proibido',
    original: 'Amoxicilina + clavulanato de potássio (400mg/5mL). Dar 0,9mL, a cada 12 h, por 24 dias. Obs.: não administrar medicação em jejum.',
    obs: ['400 mg/5 mL', nd],
    duvidas: [],
    regras: [],
  },
  {
    id: 'vetnidazol', ordem: 3, nome: 'Vetnidazol', tipo: 'farmacia', via: 'oral',
    dose: { valor: 1, exibir: '1 comprimido', unidade: 'comprimido' },
    intervaloHoras: 12, duracaoDias: 10, condicional: null, jejum: 'proibido',
    original: 'Vetnidazol (75mg). Dar 1 comprimido, a cada 12 h, por 10 dias. Obs: não administrar medicação em jejum.',
    obs: ['75 mg', nd],
    duvidas: ['Confirmar o nome do medicamento na caixa.'],
    regras: [],
  },
  {
    id: 'hepvet', ordem: 4, nome: 'Hepvet suspensão', tipo: 'farmacia', via: 'oral',
    dose: { valor: 0.7, exibir: '0,7 mL', unidade: 'mL' },
    intervaloHoras: 24, duracaoDias: 30, condicional: null, jejum: 'nao',
    original: 'Hepvet suspensão. Dar 0,7mL a cada 24 h, por 30 dias.',
    obs: [], duvidas: [], regras: [],
  },
  {
    id: 'sanus', ordem: 5, nome: 'Sanus 100 mg', tipo: 'farmacia', via: 'oral',
    dose: { valor: 1, exibir: '1 cápsula', unidade: 'cápsula' },
    intervaloHoras: 24, duracaoDias: null, condicional: null, jejum: 'exigido',
    original: 'Sanus 100 mg. Dar 1 cápsula, a cada 24 h, até novas recomendações. Não pode ser diluída. **Realizar em jejum.',
    obs: ['Não pode ser diluída.', 'Realizar em jejum.'],
    duvidas: [
      'Por quanto tempo de jejum antes e depois da ração?',
      'Como dar sem diluir quando a via é a sonda?',
    ],
    regras: [],
  },
  {
    id: 'vitamina-e', ordem: 6, nome: 'Vitamina E 400 UI', tipo: 'farmacia', via: 'oral',
    dose: { valor: 1, exibir: '1 cápsula', unidade: 'cápsula' },
    intervaloHoras: 24, duracaoDias: null, condicional: null, jejum: 'nao',
    original: 'Vitamina E 400 UI. Dar 1 cápsula, a cada 24 h, até novas recomendações.',
    obs: [], duvidas: [], regras: [],
  },
  {
    id: 'acetilcisteina', ordem: 7, nome: 'Acetilcisteína 40 mg/mL', tipo: 'farmacia', via: 'oral',
    dose: { valor: 6.2, exibir: '6,2 mL', unidade: 'mL' },
    intervaloHoras: 8, duracaoDias: 7, condicional: null, jejum: 'nao',
    original: 'Acetilcisteína 40 mg/mL. Dar 6,2 mL, a cada 8 h, durante 7 dias.',
    obs: ['40 mg/mL'],
    duvidas: ['Confirmar a dose de 6,2 mL: é um volume grande para 3,55 kg.'],
    regras: [],
  },
  {
    id: 'basken', ordem: 8, nome: 'Basken suspensão Plus 5', tipo: 'farmacia', via: 'oral',
    dose: { valor: 0.7, exibir: '0,7 mL', unidade: 'mL' },
    intervaloHoras: 24, duracaoDias: 5, condicional: null, jejum: 'nao',
    original: 'Basken suspensão Plus 5. Dar 0,7 mL, a cada 24 h, durante 5 dias.',
    obs: ['Mesma dose do Hepvet (0,7 mL), mas é outro frasco.'],
    duvidas: [], regras: [],
  },
  {
    id: 'revimax', ordem: 9, nome: 'Revimax 50 mg', tipo: 'farmacia', via: 'oral',
    dose: { valor: 0.25, exibir: '1/4 de comprimido', unidade: 'comprimido' },
    intervaloHoras: 12, duracaoDias: null, condicional: null, jejum: 'nao',
    original: 'Revimax 50 mg. Dar 1/4 (um quarto) de comprimido, a cada 12 h, até novas recomendações.',
    obs: ['50 mg'],
    duvidas: ['A farmácia entrega fracionado ou a tutora fraciona?'],
    regras: [],
  },
  {
    id: 'prednisolona', ordem: 10, nome: 'Prednisolona 3 mg/mL', tipo: 'farmacia', via: 'oral',
    dose: { valor: 0.6, exibir: '0,6 mL', unidade: 'mL' },
    intervaloHoras: 24, duracaoDias: 7, condicional: null, jejum: 'nao',
    original: 'Prednisolona 3 mg/mL. Dar 0,6 mL, a cada 24 h, durante 7 dias.',
    obs: ['3 mg/mL', 'Ao terminar, começa a telmisartana.'],
    duvidas: [], regras: [],
  },
  {
    id: 'ursodesoxicolico', ordem: 11, nome: 'Ácido ursodesoxicólico 50 mg', tipo: 'farmacia', via: 'oral',
    dose: { valor: 1, exibir: '1 comprimido', unidade: 'comprimido' },
    intervaloHoras: 24, duracaoDias: 30, condicional: null, jejum: 'nao',
    original: 'Ácido ursodexosicólico 50 mg. Dar 1 comprimido, a cada 24 h, durante 30 dias.',
    obs: ['50 mg', 'Na receita está escrito "ursodexosicólico".'],
    duvidas: [], regras: [],
  },
  {
    id: 'nutrifull', ordem: 12, nome: 'Nutrifull cat', tipo: 'farmacia', via: 'oral',
    dose: { valor: 2, exibir: '2 mL', unidade: 'mL' },
    intervaloHoras: 24, duracaoDias: null, condicional: null, jejum: 'nao',
    original: 'Nutrifull cat. Dar 2 mL, a cada 24 h, até novas recomendações.',
    obs: [], duvidas: [], regras: [],
  },
  {
    id: 'ondansetrona', ordem: 13, nome: 'Ondansetrona 4 mg', tipo: 'farmacia', via: 'oral',
    dose: { valor: 0.5, exibir: '1/2 comprimido', unidade: 'comprimido' },
    intervaloHoras: 8, duracaoDias: 5, condicional: 'Se notar náusea.', jejum: 'nao',
    original: 'Ondansetrona 4 mg. Dar 1/2 (meio) comprimido, a cada 8 h, durante 5 dias. Se notar náusea.',
    obs: ['4 mg', 'Durante 5 dias.'],
    duvidas: ['Os 5 dias contam a partir de quando?'],
    regras: [],
  },
  {
    id: 'peglax', ordem: 14, nome: 'Peg-lax 8,5 mg', tipo: 'farmacia', via: 'oral',
    dose: { valor: 1, exibir: '1 sachê', unidade: 'sachê' },
    intervaloHoras: 24, duracaoDias: null, condicional: 'Se a Jujuba demonstrar dificuldade em evacuar.', jejum: 'nao',
    original: 'Peg - lax 8,5 mg. Se paciente demonstrar dificuldade em evacuar, dar 1 sachê a cada 24 h.',
    obs: ['8,5 mg'],
    duvidas: ['A receita não informa por quantos dias.'],
    regras: [],
  },
  {
    id: 'kalium', ordem: 15, nome: 'Kalium Vet gatos', tipo: 'farmacia', via: 'oral',
    dose: { valor: 1, exibir: '1 comprimido', unidade: 'comprimido' },
    intervaloHoras: 48, duracaoDias: 10, condicional: null, jejum: 'nao',
    original: 'Kalium Vet gatos. Dar 1 comprimido, a cada 48 h, durante 10 dias. Ao iniciar a telmisartana, suspender uso do Kalium.',
    obs: ['A cada 48 horas (dia sim, dia não).', 'Ao iniciar a telmisartana, suspender o Kalium.'],
    duvidas: ['São 5 doses (a cada 48 h em 10 dias)? A conta do app assume que sim.'],
    regras: [{ tipo: 'encerraQuandoInicia', item: 'telmisartana' }],
  },
  {
    id: 'simeticona', ordem: 16, nome: 'Simeticona gotas', tipo: 'farmacia', via: 'oral',
    dose: { valor: 1, exibir: '1 mL', unidade: 'mL' },
    intervaloHoras: 8, duracaoDias: null,
    condicional: 'Se notar acúmulo de gás ou distensão abdominal.', jejum: 'nao',
    original: 'Simeticona gotas. Se notar acúmulo de gás ou distensão abdominal. Dar 1 mL, a cada 8 h, até novas recomendações.',
    obs: [], duvidas: [], regras: [],
  },
  {
    id: 'telmisartana', ordem: 17, nome: 'Telmisartana 3,5 mg', tipo: 'manipulado', via: 'oral',
    dose: { valor: 1, exibir: '1 cápsula', unidade: 'cápsula' },
    intervaloHoras: 24, duracaoDias: 30, condicional: null, jejum: 'nao',
    original: 'Farmácia de manipulação: Telmisartana 3,5 mg. Dar 1 cápsula a cada 24 horas, por 30 dias. Iniciar somente ao finalizar o uso da prednisolona.',
    obs: ['Farmácia de manipulação.', 'Iniciar somente ao finalizar a prednisolona.'],
    duvidas: [],
    regras: [{ tipo: 'inicioApos', item: 'prednisolona' }],
  },
  {
    id: 'sonda', ordem: 18, nome: 'Limpar a sonda', tipo: 'cuidado', via: null,
    dose: null,
    intervaloHoras: 12, duracaoDias: null, condicional: null, jejum: 'nao',
    original: 'Cuidados com a sonda: realizar a limpeza a cada 12 horas com solução fisiológica (NaCl 0,9%) e gaze.',
    obs: ['Soro fisiológico NaCl 0,9% e gaze.', 'Use luvas e mantenha a sonda coberta com atadura.'],
    duvidas: [], regras: [],
  },
];

export const ITEM_POR_ID: Record<string, Item> = Object.fromEntries(ITENS.map((i) => [i.id, i]));

export const DUVIDAS_GERAIS = [
  'A receita diz "via oral", mas os cuidados falam em medicar pela sonda. Qual é a via de cada remédio?',
  'Qual o tempo de jejum do Sanus e qual horário combina com amoxicilina e vetnidazol (que não podem ser em jejum)?',
  'A acetilcisteína é mesmo 6,2 mL a cada 8 h?',
  'A água usada para lavar a sonda conta nos 180 mL de líquidos por dia?',
  'Os itens "até novas recomendações" continuam depois do retorno de 23/10?',
];
