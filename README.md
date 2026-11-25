# Reinos da Aurora

RPG estratégico de fantasia para navegador. A jornada começa com a criação de um Vanguarda, Atirador ou Canalizador, cada um com aparência masculina e feminina. Lute nas Ruínas do Farol, equipe o prêmio, recrute tropas no Refúgio de Alvor e enfrente o Guardião do Portão.

## Prévia hospedada

Use a prévia privada no Sites para testar as atualizações pelo navegador. Entre com a conta do ChatGPT que recebeu acesso e use o mesmo navegador e perfil para retomar seu save. [Abrir a prévia de Reinos da Aurora](https://reinos-da-aurora-previa.erickmartins1.chatgpt.site)

## Executar

Use Node.js 22.13 ou superior na linha 22, ou Node.js 24+.

Para baixar o código do GitHub pela primeira vez, use `git clone https://github.com/ErickjrMartins/RPG_TURNO.git` e entre na pasta `RPG_TURNO`.

```sh
npm ci
npm run dev
```

Abra `http://localhost:5173`. Escolha **Novo jogo** para criar um herói ou **Continuar** para recuperar a campanha do mesmo navegador e endereço. Use mouse ou toque para escolher a habilidade e o alvo. Pelo teclado, as teclas **1** a **7** selecionam habilidades disponíveis, e **Tab** e **Enter** operam os controles.

## Verificar e executar a build de produção

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Abra `http://localhost:4173` para verificar a build. Em outro terminal, execute o teste de navegador.

```sh
npx playwright install chromium
npm run test:browser
```

Se o Chromium já estiver instalado, indique seu executável com `AURORA_CHROMIUM_PATH`. Para testar outro endereço, use `AURORA_URL`. A suíte verifica as três classes, Abismos em formação completa, a cidade, expedições, Relicário, eventos e retomada. A jornada do Atirador usa toque em uma viewport de 390 px, offline após o cache inicial.

A build em `dist/` pode ser servida por um host estático em HTTPS. Para jogar offline, abra a build uma vez online e aguarde o cache local. O modo offline requer HTTPS ou localhost. O progresso é independente por origem, portanto as portas 5173 e 4173 terão saves diferentes. O save registra pontos de controle. Ao retomar uma batalha interrompida, ela recomeça com a mesma formação e semente.

## Organização

- `src/content/` contém classes, habilidades, tropas, encontros e recompensas.
- `src/domain/` resolve combate, formação e progressão sem dependências de renderização ou navegador.
- `src/game/` usa Phaser 3 para sprites e efeitos. A interface HTML dá suporte a teclado e toque.
- `src/persistence/` usa IndexedDB com revisão transacional, migração e cópia da última gravação íntegra.
- `public/assets/` contém arte original provisória, otimizada em WebP. Os avisos de licença do Phaser e das fontes Cinzel e DM Sans ficam em `public/licenses/`.

`GAME_DESIGN.md` registra as decisões atuais, `TECHNICAL_DESIGN.md` descreve a arquitetura planejada e `TASKS.md` acompanha os marcos.

## Jornada da versão 0.4.0

- **Refúgio de Alvor** permite administrar Conselho, Quartel, Fazenda e Tesouraria. A Fazenda acumula provisões e o Conselho define o limite de nível dos demais edifícios.
- **Campo de Treino** permite praticar Juras e Abismos com duas formações de seis unidades.
- **Expedições** se expandem após o Portão Caído. Os capítulos solo têm nota, Primeira Purificação e Varredura. O Ninho é uma simulação local com companheiros controlados pelo jogo.
- **Relicário** reúne equipamento, Forja, Enxerto, Pregos, Glifos, linhagens e maestria, com atalhos para Indumentárias.
- **Eventos** inclui login, recompensas de expedição, roleta e recargas simuladas.
- **Árvore de Habilidades** fica no Refúgio do Canalizador após as Ruínas do Farol. Aprenda com pontos, depois equipe a habilidade na preparação. A Centelha sempre fica no primeiro espaço. Seis ativas, três passivas e o Círculo do Vazio podem entrar em combate. Os Pântanos e a Cordilheira aparecem nas Expedições depois de Alvor.
- **Praça de Alvor** exibe os avatares de quem entrar no mesmo servidor. Clique numa posição da praça ou use as setas com o mapa focado.

## Jogar na mesma praça

```sh
npm run build
npm start
```

A aplicação e a API da praça são servidas na porta 8080 por padrão. O ambiente de hospedagem pode fornecer `PORT`. Para jogadores em lugares diferentes, sirva essa instância Node em um endereço acessível aos dois. A build estática e o HTML portátil funcionam para a campanha local. A sessão compartilhada requer a API Node.

Para repetir a verificação com dois navegadores, rode `PORT=4183 npm start` e, em outro terminal, `npm run test:world`. É possível ajustar `AURORA_URL` e `AURORA_CHROMIUM_PATH` como na suíte principal.

## Gerar um arquivo para abrir sem servidor

```sh
npm run build:portable
```

Abra `dist/reinos-da-aurora.html` no navegador como um arquivo local. O HTML inclui o jogo, a arte, as fontes e os sons. O navegador precisa permitir o acesso a arquivos locais e o salvamento IndexedDB.
