# Reinos da Aurora

RPG tático sobrenatural para navegador. Após um apagão, maldições tomam a cidade contemporânea de Alvor. Escolha Vanguarda, Atirador ou Canalizador, contenha a Estação Aurora, forme sua equipe na Central de Contenção e enfrente o Custódio da Linha 7.

## Prévia hospedada

Use a prévia privada no Sites para testar as atualizações pelo navegador. Entre com a conta do ChatGPT que recebeu acesso e use o mesmo navegador e perfil para retomar seu save. [Abrir a prévia de Reinos da Aurora](https://reinos-da-aurora-jogar.miniaturechina3.chatgpt.site)

## Painel de testes

Crie um herói ou retome a campanha e clique em **Testes** no topo. O painel salva níveis, ouro e provisões na campanha aberta. Itens concedidos ficam no Relicário ou em Indumentárias. Na arena, abra o painel durante seu turno. Mudanças de nível reiniciam o mesmo combate ao voltar.

Na prévia privada, o servidor libera o painel para a identidade autenticada da conta proprietária, configurada em `AURORA_ADMIN_EMAIL`. No Windows, **Iniciar-Testes.cmd** libera o painel apenas na instância local do computador. No checkout, execute `npm run build` e `npm start -- --admin`, depois abra o endereço impresso pelo servidor. Rode `npm run test:admin` com essa instância ativa. Para usar outra porta, defina `AURORA_URL` no teste.

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
npm run test:archer
npm run test:strike
npm run test:motion
npm run test:portrait
npm run test:offline
```

Se o Chromium já estiver instalado, indique seu executável com `AURORA_CHROMIUM_PATH`. Para testar outro endereço, use `AURORA_URL`. A suíte verifica as três classes, Abismos em formação completa, a cidade, expedições, Relicário, eventos e retomada. A jornada do Atirador usa toque em uma viewport de 390 px, offline após o cache inicial. `test:archer` verifica a flecha do Disparo, a Vida no impacto e os controles de apresentação nas duas aparências.

`test:strike` verifica a corrida do Vanguarda, a Vida no impacto, o arco de fogo e a volta à formação nas duas aparências, em desktop e celular. A pausa e o pulo de efeitos também entram no teste.

A build em `dist/` pode ser servida por um host estático em HTTPS. A abertura consulta o servidor e usa a cópia local quando a conexão falha. Para jogar offline, abra a build uma vez online e aguarde o cache local. O modo offline requer HTTPS ou localhost. `test:offline` verifica redirecionamento, atualização, tela de login e retomada offline no Chromium. O progresso é independente por origem, portanto as portas 5173 e 4173 terão saves diferentes. O save registra pontos de controle. Ao retomar uma batalha interrompida, ela recomeça com a mesma formação e semente.

## Organização

- `src/content/` contém classes, habilidades, tropas, encontros e recompensas.
- `src/domain/` resolve combate, formação e progressão sem dependências de renderização ou navegador.
- `src/game/` usa Phaser 3 para sprites e efeitos. A interface HTML dá suporte a teclado e toque.
- `src/persistence/` usa IndexedDB com revisão transacional, migração e cópia da última gravação íntegra.
- `public/assets/` contém arte original provisória, otimizada em WebP. Os avisos de licença do Phaser e das fontes Cinzel e DM Sans ficam em `public/licenses/`.

`GAME_DESIGN.md` registra as decisões atuais, `TECHNICAL_DESIGN.md` descreve a arquitetura planejada e `TASKS.md` acompanha os marcos.

## Jornada da versão 0.4.0

- **Central de Contenção** reúne Sala de Comando, Quartel das Maldições, Laboratório e Cofre de Contenção. O Laboratório produz provisões e a Sala de Comando define o limite de nível das instalações.
- **Simulador de Combate** permite praticar Juras e Abismos com duas formações de seis unidades.
- **Expedições** se expandem após o Bloqueio da Linha 7. Os capítulos solo têm nota, Primeira Purificação e Varredura. O Ninho é uma simulação local com companheiros controlados pelo jogo.
- **Relicário** reúne equipamento, Forja, Enxerto, Pregos, Glifos, linhagens e maestria, com atalhos para Indumentárias.
- **Eventos** inclui login, recompensas de expedição, roleta e recargas simuladas.
- **Árvore de Habilidades** fica na Central de Contenção do Canalizador após a missão na Estação Aurora. Aprenda com pontos, depois equipe a habilidade na preparação. A Centelha sempre fica no primeiro espaço. Seis ativas, três passivas e o Círculo do Vazio podem entrar em combate. As Galerias Subterrâneas e as Coberturas de Alvor aparecem nas Expedições depois de liberar o distrito.
- **Pátio de Alvor** exibe os avatares de quem entrar no mesmo servidor. Clique numa posição da praça ou use as setas com o mapa focado.

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
