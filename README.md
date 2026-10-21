# Jujuba Care

PWA para organizar a receita veterinária da Jujuba (21/10/2026): o que dar, quanto e quando.
Os dados ficam só no aparelho (localStorage). O app não calcula nem altera doses.

## Rodar

    npm install --legacy-peer-deps
    npm run dev       # desenvolvimento
    npm test          # lógica de agenda
    npm run build     # gera dist/

## Publicar (precisa de HTTPS para instalar no celular)

Arraste a pasta `dist/` em https://app.netlify.com/drop (ou use GitHub Pages).
Não coloque a receita em PDF (tem CPF e endereço) em repositório público.

## Instalar no iPhone

Abra o link no Safari, Compartilhar, Adicionar à Tela de Início.

## Estrutura

- `src/lib/seed.ts`: transcrição da receita (fonte dos dados)
- `src/lib/agenda.ts`: geração de horários e regras (prednisolona, telmisartana, Kalium)
- `src/lib/ics.ts`: exportação para o Calendário
