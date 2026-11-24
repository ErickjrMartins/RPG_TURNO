# Reinos da Aurora

Documento de design inicial. **Reinos da Aurora** é o codinome provisório.

## Visão do jogo

RPG estratégico de fantasia para navegador desktop e celular, com combate tático por turnos, exploração por nós, gestão de cidade e progressão persistente. Cada batalha combina decisões de habilidade, alvo, energia, efeitos e formação. Suas recompensas permitem fortalecer o herói, as tropas e o assentamento.

Após a queda do Farol Celestial, o jogador lidera um herói, recruta guardiões e reconstrói um assentamento enquanto restaura portais antigos e enfrenta criaturas do Véu. Cenários, personagens, nomes, interface, áudio e demais assets são originais.

A campanha PvE pode ser concluída offline. A Praça de Alvor é a área social para encontrar jogadores conectados à mesma instância do jogo. O idioma inicial é português brasileiro, com preparação para localização. Android fica para uma etapa posterior. Steam depende de adaptação e validação.

### Ciclo de jogo

Criar herói → preparar cidade e formação → escolher uma missão no mapa → explorar um nó → batalhar → receber recompensas → equipar o herói e investir na cidade → desbloquear novos desafios.

### Primeiros 15 minutos

1. Na tela de título, escolher **Novo jogo** ou **Continuar**. Em um novo jogo, nomear o herói, escolher Vanguarda, Atirador ou Canalizador e selecionar aparência masculina ou feminina. A criação exibe a arte e dois atributos de destaque.
2. Jogar o tutorial com um herói, um guarda aliado e dois inimigos. Aprender a usar o ataque básico, uma habilidade e a seleção de alvos.
3. Receber XP, ouro e um item na tela de vitória e selecionar **Continuar** para entrar na cidade.
4. Visitar o quartel, recrutar uma tropa e melhorar o Salão do Conselho, com custo, duração e efeito visíveis.
5. Abrir o mapa e enfrentar um miniboss, com possibilidade de derrota e nova tentativa. Aprender a equipar um item e ter o progresso salvo automaticamente.

## Mecânicas

### Combate em formação

- Cada equipe tem até seis posições em duas fileiras de três. O herói ocupa uma posição e pode levar até duas tropas aliadas no início.
- O jogador escolhe uma habilidade disponível e um alvo válido. Os tipos de alvo incluem unidade única, fileira frontal ou traseira, grupo, aliado com menor HP, todos os aliados e o próprio herói.
- Cada classe começa com um ataque básico gratuito e duas habilidades. Custos, geração de recurso e cooldowns em turnos são configuráveis. A interface indica o motivo de indisponibilidade.
- O herói abre cada rodada. Em seguida, os aliados e inimigos atuam em uma fila única por velocidade, com desempate pelo identificador da unidade. Efeitos periódicos são resolvidos ao fim da rodada. A resolução é reproduzível com a mesma configuração, sequência de ações e seed.
- Os efeitos previstos incluem escudo, sangramento, queimadura, regeneração, atordoamento com limite de duração e modificadores de ataque, defesa e velocidade. O dano considera poder, defesa, crítico, variação controlada e barreiras. O HP mínimo é zero.
- A vitória concede XP, ouro, itens fixos ou ponderados e progresso de missão. Cada tentativa concluída concede sua recompensa uma única vez. Na derrota, **Tentar novamente** permite repetir o encontro sem perda irreversível no MVP.

O combate passa por preparação, início de rodada, entrada do jogador, resolução de ações, atualização de efeitos e fim de rodada. Ao fim, inicia outra rodada ou chega à vitória ou à derrota. Durante a resolução, a interface bloqueia novos comandos de ação. A lógica de batalha aplica dano, gasto de energia e recompensas uma única vez por evento válido. As animações exibem o resultado desses eventos.

As referências de balanceamento propostas são 20 pontos de recurso inicial, 12 gerados no ataque básico, recuperação de 5 por turno e custos de 20 e 35 para as duas habilidades. A duração desejada é de 3–6 rodadas para uma batalha comum e 5–9 para um miniboss. Os valores serão calibrados em testes.

### Juras Profanas e Abismos Pessoais

Depois das Ruínas do Farol, ações comuns alimentam o medidor de Mácula. Uma Jura Profana fortalece a habilidade escolhida em 30%, cobra Vida e acrescenta Corrosão Interna. Cada acúmulo de Corrosão causa 2 de dano ao fim da rodada, até três. Afinidades de relíquias e o Caminho da Jura podem reduzir o custo.

Cada Abismo consome 60 de Mácula e dura duas rodadas. No nível 2 do herói, o nível 2 do Conselho ou a vitória no Portão Caído elevam o Abismo a três rodadas e fortalecem seu efeito.

| Classe | Abismo | Efeito |
| --- | --- | --- |
| Vanguarda | Bastião de Cinzas | Escudos para toda a formação e redução do dano que ela recebe. |
| Canalizador | Círculo do Vazio | Reduz a iniciativa de uma fileira inimiga e causa dano periódico nessa área. |
| Atirador | Firmamento da Caça | Amplifica o dano contra a presa. Se ela cair, a marca passa ao inimigo vivo de maior Ataque. |

A câmera parte de uma escala mais aberta e pulsa durante a abertura. Traçados, círculos, ícones de estado e cores separam disparo, dano em área, cura, proteção, penalidade e efeito persistente. O Campo de Treino do Refúgio oferece as duas formações completas, com saída imediata e sem espólio.

### Árvore do Mago e leitura de combate

O Canalizador acessa a árvore após as Ruínas do Farol. Recebe dois pontos no nível inicial e dois por nível de herói. Cada nó custa um ponto e verifica os caminhos anteriores. A redistribuição é gratuita no Refúgio. Os nove nós modificam potência da Centelha, dano periódico da Chuva Astral, cura individual e coletiva, Foco inicial, Mácula inicial, custo de Vida das Juras e dano e custo do Círculo do Vazio.

Na arena, a vida atual e máxima aparece junto à unidade e no painel do herói. Aliados usam verde, inimigos usam vermelho e escudos têm contorno azul. A Centelha viaja até um alvo. A Chuva Astral projeta meteoros sobre a fileira, a Renovação envolve o aliado em luz ascendente, o Coro Vital pulsa sobre toda a formação e o Círculo do Vazio forma fendas e sigilos sobre a área. Cada feitiço tem ícone e som próprios e a opção de pular efeitos preserva a resolução do combate.

### Exploração

O jogador seleciona um nó do mapa e abre um encontro que pode conter diálogo, baú, combate ou escolha, conforme o conteúdo. A interface indica o objetivo, os requisitos, o progresso da etapa e a recompensa. Cada encontro oferece um fluxo para continuar a jornada ou voltar à cidade.

## Sistemas

### Cidade e economia

| Edifício do MVP | Função |
| --- | --- |
| Salão do Conselho | Define o limite de nível dos demais edifícios e participa dos desbloqueios de regiões. |
| Quartel dos Guardiões | Recruta e melhora tropas. |
| Fazenda do Vale | Produz provisões periodicamente, com coleta e limite de armazenamento. |
| Tesouraria | Define a capacidade de ouro. |

O painel de cada prédio mostra nível, ação disponível, pré-requisitos, custo, duração e comparação entre o nível atual e o próximo. Produção e melhorias em andamento conservam seus tempos após o recarregamento. Compras, recrutamento e melhorias validam saldo e requisitos antes de debitar recursos e conceder o resultado uma única vez.

No Refúgio de Alvor, todos os quatro edifícios começam no nível 1. O Conselho deve completar o próximo nível antes de permitir melhorias dos demais. A Tesouraria comporta 500, 750 e 1.000 de ouro, respectivamente. A Fazenda produz uma provisão a cada 12, 9 ou 6 segundos e armazena até 8, 13 ou 20. A colheita transfere o estoque para a carteira. O Quartel permite treinar as tropas até seu nível. Cada nível de tropa acrescenta 10 Vida, 3 Ataque e 1 Defesa. Custos e tempos são parâmetros de balanceamento.

O ouro financia construções, compras e parte do recrutamento. As provisões complementam o custo de tropas. O XP progride o herói. Os cristais são previstos para pesquisa na Academia dos Ecos. Seu uso no MVP depende do escopo dessa construção. Portal dos Caminhos, Forja e Mercado fazem parte da cidade proposta. O acesso ao mapa é obrigatório no MVP, com o painel próprio do Portal ainda a definir. A campanha do MVP é concluível sem compras reais.

### Inventário e equipamentos

O Relicário tem seis slots de herói: arma, manto, rosário, dois anéis e talismã. Algumas relíquias podem equipar as tropas. O equipamento atualiza atributos e aparece na comparação com ganhos e perdas. A grade começa com 48 posições, seis colunas no desktop, filtros e materiais em pilhas de até 999. Excedentes entram em reserva. É possível organizar, expandir com ouro e confirmar o desmonte de peças comuns ou incomuns elegíveis. Peças equipadas, bloqueadas ou raras ficam protegidas.

Refinamento determinístico consome Cinzas de Maldição e Coágulos de Icor. A promoção de grau usa núcleos e materiais de campanha. Selos de Enxerto transferem o refinamento para outra relíquia compatível. O grau abre de dois a quatro encaixes para Pregos de Selamento, recuperáveis gratuitamente. Algumas afinidades e Pregos reduzem o custo da Jura.

Três Glifos da Peste dão +10 recurso inicial. Três Glifos do Vazio prolongam penalidades aplicadas pelo herói. Núcleos montam Linhagens Amaldiçoadas, que podem ser reativadas sem pagar novamente. A maestria progride do nível 1 ao 10. As escolhas do Caminho Seguro e do Caminho da Jura nos níveis 5 e 10 podem ser trocadas a qualquer momento na base sem perda do progresso.

### Missões e salvamento

- Missões vinculam pré-requisitos, etapas, objetivos, recompensa e política de repetição a eventos de jogo. Cada evento elegível avança o progresso uma única vez. Cada conclusão elegível permite um único resgate de recompensa. Os tipos previstos incluem história, combate, chefe, recrutamento, melhoria, equipamento, coleta e masmorra conforme a fase do projeto.
- O salvamento local versionado em IndexedDB conserva herói, XP, equipamentos, inventário, recursos, tropas e posições, edifícios e temporizadores, pesquisas quando disponíveis, campanha, missões, tutorial e preferências.
- O autossalvamento ocorre ao concluir ações transacionais e nos pontos de controle da jornada. **Continuar** carrega o progresso validado após fechar e reabrir o jogo. O fluxo prevê exportação e importação em JSON, migrações de formato e recuperação da última gravação íntegra em caso de corrupção.

## Personagens

Cada classe oferece duas aparências jogáveis, com as mesmas habilidades e atributos. A escolha muda o sprite e o nome de classe exibido, como Atirador ou Atiradora.

| Classe | Papel e recurso | Vantagem e limitação | Habilidades iniciais |
| --- | --- | --- | --- |
| Vanguarda | Tanque e controle. Ímpeto (0–100). | Defesa e escudos. Menor dano em área. | Golpe Firme (básico), Muralha (escudo), Investida (dano e redução de atributo). |
| Canalizador | Magia e suporte. Foco (0–100). | Dano em área e cura. Baixa defesa física. | Centelha (básico), Chuva Astral (área), Renovação (cura individual) e Coro Vital (cura em área). |
| Atirador | Precisão e dano. Concentração (0–100). | Críticos e escolha de alvos. Menor resistência. | Disparo (básico), Rajada Dupla, Marca da Caça (redução de atributo). |

Os atributos previstos incluem nível, XP, HP máximo e atual, ataques e defesas físicos e mágicos, velocidade, crítico, precisão, esquiva, bloqueio, resistência a efeitos e poder de combate estimado.

**Abominações Domadas.** Sentinela (tanque), Besteiro (alvo único), Adepta (apoio) e Lanceiro (dano) compõem o elenco proposto. Pelo menos três tipos ficam disponíveis no MVP, com dois recrutáveis no início. Cada tropa tem custo, nível, atributos e comportamento próprios. Nível, composição e posição persistem entre sessões.

**Inimigos.** A IA usa regras por situação. Um inimigo de apoio pode curar um aliado com HP baixo, e a fileira frontal é priorizada salvo exceções de alcance. O **Guardião do Portão Caído** tem duas fases. Abaixo de 50% de HP, invoca reforço e muda o padrão de ataque. Os ataques do chefe sinalizam sua intenção ao jogador.

**Visual e animação.** Personagens 2D de corpo inteiro têm silhuetas distintas. A arena lateral apresenta profundidade 2.5D com aliados à esquerda e inimigos à direita, sobre fundos pintados em camadas com parallax sutil. As animações previstas incluem espera, ataque ou conjuração, impacto sofrido, derrota, vitória e caminhada onde houver exploração. A música acompanha o contexto da cidade, da aventura e das batalhas.

## Indumentárias e eventos

As Indumentárias oferecem Traje, Máscara, Projeção de Arma e Manifestação. Aparência e atributos podem ser equipados separadamente e aparecem no Refúgio e na arena. Cada quatro desbloqueios do Grimório concedem +2 Vida e um conjunto completo concede +3 recurso inicial. Os bônus por slot são iguais nas coleções Expurgo, Vigília e Noturno. A Colheita de Mácula recompensa expedições com Fios e giros gratuitos. Há trilhas de temporada, alta costura e Roleta do Altar Selado, com chance de 12% e garantia no oitavo giro sem Manifestação no ciclo.

O calendário semanal libera uma recompensa por dia local, incluindo uma Manifestação no sétimo dia. Cash, pacotes e metas de recarga são simulados localmente. Cada recibo é contabilizado uma vez e cada meta é resgatada uma vez no ciclo. A futura integração real precisa de provedor e confirmação de recibo pelo servidor.

## Mapas e níveis

| Região | Conteúdo previsto |
| --- | --- |
| **Campos de Alvor** | Ruínas do Farol, Refúgio de Alvor, Portão Caído e as Zonas de Quarentena Posto das Cinzas, Brejo do Silêncio e Coração do Véu. |
| **Pântanos do Véu** | Sinos Submersos e Cisterna das Mariposas. Retorcidos enfraquecem alvos e Mariposas marcam aliados frágeis. |
| **Cordilheira Cinzenta** | Passo da Geada e Observatório das Cinzas. Linces atacam a retaguarda e Colossos erguem escudos periódicos. |
| **Desfiladeiro das Cinzas** | Expansão com fogo e ondas de inimigos. |

O Portão Caído libera o Posto das Cinzas. Os capítulos solo têm focos e um núcleo final, classificação de até três estrelas e Primeira Purificação única. A nota máxima libera a Varredura de Área por energia diária. Romper Selo aumenta o dano inimigo em 35%, dobra as Marcas de Expurgo e melhora a chance de núcleos completos.

O Ninho da Ruptura é o protótipo local de Ninhos de Calamidade para dois a quatro participantes, com o jogador e companheiros controlados pelo jogo. A barreira do núcleo exige um Abismo, o espólio é calculado individualmente e o herói recebe a própria parte. A conclusão abre o Altar de Trocas. A sincronização entre jogadores depende do servidor autoritativo previsto.

O Coração do Véu libera os Pântanos. A Cisterna das Mariposas libera a Cordilheira. Cada um dos quatro capítulos tem flora ou arquitetura própria, focos, chefe, recompensas e Varredura por nota máxima. Os termos de nível ou missão e o fluxo de recompensas continuam registrados no save.

Regiões posteriores podem exigir missão ou nível para acesso. O plano de expansão prevê de três a seis nós por região, com miniboss, chefe, itens e cenário próprio.

## Interfaces

- **Título e criação de herói.** Novo jogo, Continuar, nome do herói, seleção de classe, visual e atributos de destaque.
- **Cidade.** Nome, nível, XP, recursos, edifícios interativos, objetivo rastreado e atalhos para Herói, Tropas, Missões, Mapa, Bolsa e Configurações.
- **Mapa e aventura.** Região, nós, requisitos de acesso, objetivos, recompensas e ações disponíveis no encontro.
- **Combate.** HP, energia, fila de turnos, alvos selecionáveis, habilidades com custo e cooldown, pausa, log resumido e velocidade 1x/2x. A opção de pular animação conserva o resultado. O modo **Auto** é opcional após o tutorial.
- **Resultados.** Recompensas e **Continuar** na vitória. **Tentar novamente** na derrota.
- **Painéis de gestão.** Herói e equipamento, inventário, tropas e formação, edifícios, missões e configurações.

Mouse, teclado e toque devem permitir concluir o fluxo principal. A interface mantém textos legíveis e controles acessíveis em desktop e celular. O feedback inclui seleção visível de alvo, atualização de barras, impacto, números de dano, efeitos sonoros distintos, explicação de bloqueios, controles de áudio e redução de movimento.

## Praça de Alvor

A praça comum fica dentro do Refúgio. O jogador pode visitar e se movimentar localmente ou entrar na sessão online da instância. Quando online, o servidor registra nome, classe, aparência, nível e posição do avatar para os demais visitantes. O servidor valida posições e encerra sessões inativas. Compra, campanha e salvamento do personagem continuam locais. A sessão da praça depende de um servidor ativo e guarda presença apenas enquanto os jogadores estão conectados.

## Progressão

Batalhas e missões concedem XP, ouro e itens. O XP sobe o nível do herói e desbloqueia habilidades. Equipamentos alteram atributos, melhorias do Conselho liberam avanços na cidade e requisitos de missão ou nível controlam a abertura de novas regiões. A dificuldade cresce com padrões de ataque, composição inimiga e efeitos de combate.

A expansão PvE prevê novas regiões, pesquisa, forja ampliada, talentos, gemas, masmorras, montaria, criatura auxiliar, desafios locais e conquistas. Um QTE acessível é uma possibilidade para experimento futuro. Conta, PvP, guildas, combate cooperativo, chat e eventos online constituem uma fase posterior independente da presença na Praça de Alvor.

## Critérios de aceitação do MVP

1. Criar e concluir o tutorial com Vanguarda, Atirador e Canalizador. Verificar as aparências masculina e feminina de cada classe. As três classes conseguem completar a campanha.
2. Completar três encontros e o chefe de Campos de Alvor. Verificar vitória, derrota e nova tentativa, sem duplicação de gasto, dano ou recompensa.
3. Usar os quatro edifícios do MVP, coletar recursos e confirmar custo e efeito das melhorias. Recrutar dois tipos no início, acessar pelo menos três no MVP e confirmar que a formação persiste.
4. Progredir em missões ligadas a ações reais, receber saque e XP, subir de nível e equipar itens de um conjunto de pelo menos seis equipamentos com bônus efetivos.
5. Salvar, fechar, reabrir e continuar com o progresso íntegro, inclusive temporizadores e recompensas, sem duplicar itens nem moeda. Verificar a campanha local offline e a recuperação de uma gravação inválida.
6. Concluir a jornada com mouse, teclado e toque nas plataformas web previstas, com controles funcionais, texto legível e sem erros de console no fluxo principal.

O plano técnico prevê verificar a entrega com `npm run dev`, `npm run build`, `npm test` e os scripts de qualidade definidos para o projeto.

## Jornada jogável

A jornada inicial passa por Ruínas do Farol, Refúgio de Alvor e Portão Caído. Nas ruínas, o guarda do tutorial acompanha o herói contra um Rastejante de Pedra e um Vulto do Véu. No Refúgio, o jogador pode recrutar Sentinela e Besteiro, reposicioná-los e equipar o Broche do Alvorecer para o segundo encontro. As duas primeiras vitórias concedem moedas, provisões, XP, um acessório e materiais. As Expedições ampliam o ciclo de combate, preparação na base e progressão.

O salvamento v7 registra a tentativa ativa e seu resultado de forma transacional. A migração preserva os IDs das classes, acessórios, inventário anterior, tropas, formação, recursos e progresso. Ao retomar um combate interrompido, o encontro reinicia com a mesma formação e seed. A build de produção pode ser reaberta offline após carregar e preparar o cache em HTTPS ou localhost.

## Questões em aberto

- **Conteúdo da cidade.** O GDD inclui cristais entre os recursos do MVP e descreve a Academia e a Forja. O plano situa pesquisa e forja na expansão. Confirmar se haverá uso de cristais ou funcionalidade parcial desses edifícios no MVP.
- **Tropas e equilíbrio.** Definir os desbloqueios de tropas além de Sentinela e Besteiro, a regra de recuperação dos feridos e os valores de produção. Custos, efeitos e recompensas da primeira jornada são parâmetros provisórios.
- **Decisões futuras.** Nome comercial, direção de arte final, volume adicional de conteúdo, licenças de assets, infraestrutura online, formato de PvP e monetização.

## Fontes do projeto

- `GAME_DESIGN_DOCUMENT.md` (visão, regras de jogo, conteúdo proposto e aceitação).
- `TECHNICAL_DESIGN.md` (restrições de interface, persistência e verificações).
- `DEVELOPMENT_PLAN.md` e `TASKS.md` (marcos, recorte do MVP e expansões).
