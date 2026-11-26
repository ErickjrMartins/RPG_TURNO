# TASKS — Reinos da Aurora

> Versão 0.4.9. Marque [x] após implementar e verificar no repositório.

## Golpe Firme e Investida

- [x] Compor um único arco de fogo completo no Golpe Firme.
- [x] Integrar corrida, salto e corte da Investida com sprites do vídeo SALTO GOLPE.
- [x] Coordenar som dos passos, grito de ataque e explosão no impacto.

## Efeitos de combate da versão 0.4.8

- [x] Verificar a esfera maior da Centelha, as descargas durante o voo e a explosão no contato.
- [x] Verificar duas explosões separadas no chão da Chuva Astral enquanto outros meteoros ainda caem.
- [x] Verificar que a lâmina e o arco de fogo do Golpe Firme passam da antiga borda do sprite.

## Golpe Firme do Vanguarda

- [x] Recortar os quadros de corrida e corte do vídeo de referência e adaptar a aparência feminina.
- [x] Sincronizar o dano com o golpe e completar o retorno acelerado antes da próxima ação.
- [x] Verificar a animação, pausa e pulo de efeitos no Chromium em desktop e celular.

## Testes de progressão e Chuva Astral

- [x] Painel de testes para nível do herói e das tropas, ouro, provisões, relíquias, materiais e indumentárias.
- [x] Validar formação, reinício do combate após alterar níveis, retomada do save e bloqueio para visitantes.
- [x] Animar a Chuva Astral com gelo azul e sincronizar o dano da fileira com o impacto.
- [x] Verificar a animação no Chromium nas duas aparências do Canalizador, em desktop e tela móvel.

## M0 — Fundação
- [x] Inspecionar estrutura de arquivos e inicializar package.json/scripts.
- [x] Instalar Phaser + TypeScript + Vite e Vitest e configurar lint/typecheck.
- [x] Criar estrutura de diretórios e módulos de domínio.
- [x] Criar cena de boot e title com Novo/Continuar.
- [x] Criar seleção de Vanguarda, Atirador e Canalizador com seis aparências e salvamento da escolha.
- [x] Criar estado tipado, regras de progressão e configuração por dados.
- [x] Implementar IndexedDB, validação e versionamento do save.
- [x] Build e testes iniciais sem erro.

## M1 — Combate
- [x] Implementar máquina de estados do combate e RNG com seed.
- [x] Implementar velocidade, turnos, alvos, energia e cooldown.
- [x] Implementar dano/crítico/defesa/escudo/status.
- [x] Implementar IA de inimigos e tropas, incluindo reforço e segunda fase do Guardião.
- [x] Implementar habilidades iniciais das 3 classes.
- [x] Renderizar arena, formações, barras de HP, habilidades e log visual.
- [x] Implementar vitória, derrota, retry e recompensas idempotentes.
- [x] Testes do motor e dos dois encontros da primeira jornada.

A versão jogável cobre as Ruínas do Farol, a chegada ao Refúgio de Alvor e o Portão Caído. Recompensas, acessórios, formação e resultados são gravados em IndexedDB. O conjunto do MVP continua nos marcos seguintes. A build passou por typecheck, lint, 14 testes do Vitest e três jornadas no Chromium. A jornada da Arqueira foi executada com toque em viewport de 390 px, offline após o cache inicial.

## M2 — Cidade
- [x] Cidade com 4 edifícios clicáveis e funcionais.
- [x] Produção/colheita/limites de recursos.
- [x] Melhorias de edifícios com custos e temporizadores.
- [x] Recrutamento de Sentinela e Besteiro e formação persistente no Refúgio.
- [x] Testar atualização, refresh e clique repetido.

## M3 — Aventura e economia
- [x] Mapa de expedições em Campos de Alvor com três capítulos e seus núcleos, após o Portão Caído.
- [x] Eventos e missões encadeadas por pré-requisitos.
- [x] XP, levelup e desbloqueios.
- [x] Loot, inventário e 6+ equipamentos com bônus reais.
- [ ] Tutorial completo e autosave.
- [ ] Teste ponta-a-ponta para cada classe.

## Expansão de combate e progressão

- [x] Câmera aberta, efeitos de combate e Campo de Treino 6 × 6.
- [x] Abismos Pessoais, Juras Profanas, Mácula e Corrosão Interna.
- [x] Relicário, refino, grau, enxerto, Pregos, Glifos, linhagens e maestria.
- [x] Zonas de Quarentena, Primeira Purificação, Varredura e Calamidade Desperta.
- [x] Ninho em protótipo local com espólio individual e Altar de Trocas.
- [x] Indumentárias com quatro slots, visuais separados de atributos e Grimório.
- [x] Calendário semanal, Colheita de Mácula, roleta e recarga simulada idempotente.
- [ ] Partidas cooperativas entre jogadores e confirmação de pagamentos no servidor.
- [ ] Arte e animações finais de indumentárias.

A versão 0.2.0 passou no lint, na checagem de tipos, em 30 testes unitários e de integração e na suíte de Chromium para as builds web e portátil. A suíte cobre as três classes, formação completa, recarga de saves, toque em 390 px e execução offline após o carregamento inicial.

## Expansão 0.3.0

- [x] Árvore do Mago com pré-requisitos, pontos, redistribuição e impacto nos feitiços.
- [x] Barras de vida com valores atuais e escudo e painel do herói.
- [x] Ícones, efeitos animados e sons próprios para as magias do Canalizador.
- [x] Dois mapas, quatro capítulos e quatro espécies com IA específica.
- [x] Praça de Alvor com presença e movimento compartilhados no servidor Node.

A versão 0.3.0 passou no lint, na checagem de tipos, em 34 testes automatizados e na build de produção. No Chromium, a validação incluiu as três classes, o salvamento da árvore do Mago, a Chuva Astral na Cordilheira Cinzenta e a presença e o movimento compartilhados entre duas sessões, uma delas em viewport móvel.

## Expansão ritual 0.4.0

- [x] Detalhar no GDD a expansão ritual, os conflitos de balanceamento e a ordem de integração.
- [x] Expandir a árvore do Canalizador para 15 nós e persistir a preparação no save v8.
- [x] Implementar Fio de Âmbar, Orvalho de Sal, Alvorada de Marfim, Prisma de Selos, Rasgo de Nanquim, Trama Restauradora e sinergia por fileira do Círculo do Vazio.
- [ ] Expandir Vanguarda e Atirador para 15 nós cada.
- [ ] Rotina diária configurável, rotação semanal, fragmentos, presets e títulos.
- [ ] XP, Índice de Calamidade e garantia visível nas rotas de saque.
- [ ] Enclave, captura e evolução de Abominações e Bestas de Selamento.
- [ ] Cooperativo autoritativo, Clã, Relicário do Tempo, Mercado e Selo de Patrocínio.

A build, o lint e 39 testes automatizados passaram. O roteiro de navegador cobre as três classes, toque em 390 px, retomada da preparação, expedições e presença compartilhada na Praça de Alvor.

## M4 — Qualidade
- [ ] Responsividade desktop/mobile e área segura.
- [ ] Controle por mouse, touch e atalhos de teclado.
- [ ] Sons, mute, partículas e feedback.
- [ ] Tratamento de save corrompido e exportação/importação.
- [ ] Ajustar balanceamento com testes automatizados.
- [x] README de instalação, build e deploy estático.

## Futuro, não implementar no MVP sem autorização
- [ ] Regiões extras/forja/talentos/montarias/companheiros.
- [ ] Backend autoritativo, autenticação e coop.
- [ ] Guildas, PvP, chat, chefes mundiais e rankings.
- [ ] Integração Play Billing e pagamentos server-side.
- [ ] Publicação Poki, Google Play e Steam.
