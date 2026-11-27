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

Na criação, cada retrato sobe e desce levemente em um ciclo de respiração. Apenas pontas de cabelo e tecido se deslocam dentro da imagem. O rosto, o tronco e o equipamento conservam as proporções, e a preferência de movimento reduzido exibe o retrato estático.

## Mecânicas

### Combate em formação

- Cada equipe tem até seis posições em duas fileiras de três. O herói ocupa uma posição e pode levar até duas tropas aliadas no início.
- O jogador escolhe uma habilidade disponível e um alvo válido. Os tipos de alvo incluem unidade única, fileira frontal ou traseira, grupo, aliado com menor HP, todos os aliados e o próprio herói.
- Cada classe começa com um ataque básico gratuito e duas habilidades. Custos, geração de recurso e cooldowns em turnos são configuráveis. A interface indica o motivo de indisponibilidade.
- O herói abre cada rodada. Em seguida, os aliados e inimigos atuam em uma fila única por velocidade, com desempate pelo identificador da unidade. Efeitos periódicos são resolvidos ao fim da rodada. A resolução é reproduzível com a mesma configuração, sequência de ações e seed.
- Os efeitos previstos incluem escudo, sangramento, queimadura, regeneração, atordoamento com limite de duração e modificadores de ataque, defesa e velocidade. O dano considera poder, defesa, crítico, variação controlada e barreiras. O HP mínimo é zero.
- A vitória concede XP, ouro, itens fixos ou ponderados e progresso de missão. Cada tentativa concluída concede sua recompensa uma única vez. Na derrota, **Tentar novamente** permite repetir o encontro sem perda irreversível no MVP.

O combate passa por preparação, início de rodada, entrada do jogador, resolução de ações, atualização de efeitos e fim de rodada. Ao fim, inicia outra rodada ou chega à vitória ou à derrota. Durante a resolução, a interface bloqueia novos comandos de ação. A lógica de batalha aplica dano, gasto de energia e recompensas uma única vez por evento válido. As animações exibem o resultado desses eventos.

O Disparo básico do Atirador e da Atiradora mostra a preparação, a puxada do arco dourado, a soltura e a volta à guarda. A Vida do alvo muda quando a flecha chega. A animação acompanha a pausa e a velocidade de combate. Com **Pular efeitos** ou movimento reduzido, a ação resolve diretamente.

No Golpe Firme, o Vanguarda corre até o adversário selecionado, desfere o corte com um arco de fogo, faíscas e som no impacto, e corre de volta à posição inicial antes da próxima ação. A arena desenha o arco inteiro e a ponta da espada depois de compor as poses recortadas do vídeo de referência. A aparência feminina reaproveita o rosto e o cabelo do retrato de jogo. O retorno usa os quadros de corrida espelhados.

Na Investida, o Vanguarda corre, salta e desce a espada junto do alvo. As poses vêm de SALTO GOLPE.mp4. Os sons marcam as pisadas durante a corrida, o grito antes do corte e a explosão no chão. A Vida do alvo muda no impacto da espada e a próxima ação começa depois que o Vanguarda retorna à formação.

Na Centelha, o Canalizador carrega o cajado e dispara uma esfera azul de núcleo luminoso com descargas elétricas ao redor. Seu raio visível principal é de 31 unidades na escala da arena. A Vida do alvo muda quando a esfera explode no contato. Durante a espera na arena, heróis, tropas, inimigos e chefes vivos respiram em ciclos fora de fase, com os pés apoiados. Tecidos, cabelo, pelo, asas ou vinhas se movem conforme a criatura. A pausa congela o repouso, e **Pular efeitos** e a preferência de movimento reduzido mantêm os sprites estáticos.

As referências de balanceamento propostas são 20 pontos de recurso inicial, 12 gerados no ataque básico, recuperação de 5 por turno e custos de 20 e 35 para as duas habilidades. A duração desejada é de 3–6 rodadas para uma batalha comum e 5–9 para um miniboss. Os valores serão calibrados em testes.

### Juras Profanas e Abismos Pessoais

Depois das Ruínas do Farol, ações comuns alimentam o medidor de Mácula. Uma Jura Profana fortalece a habilidade escolhida em 30%, cobra Vida e acrescenta Corrosão Interna. Cada acúmulo de Corrosão causa 2 de dano ao fim da rodada, até três. Afinidades de relíquias e o Caminho da Jura podem reduzir o custo.

Cada Abismo tem custo-base de 60 de Mácula. Vanguarda e Atirador começam com duas rodadas e passam a três no nível 2 do Abismo. O Canalizador tem três rodadas nos dois níveis, com pulsos mais fortes no nível 2. O nível 2 do Abismo exige herói no nível 2 e Conselho no nível 2 ou vitória no Portão Caído.

| Classe | Abismo | Efeito |
| --- | --- | --- |
| Vanguarda | Bastião de Cinzas | Escudos para toda a formação e redução do dano que ela recebe. |
| Canalizador | Círculo do Vazio | Reduz a iniciativa de uma fileira inimiga, pulsa no fim de cada rodada e amplifica em 20% o dano direto do Canalizador nessa fileira. |
| Atirador | Firmamento da Caça | Amplifica o dano contra a presa. Se ela cair, a marca passa ao inimigo vivo de maior Ataque. |

A câmera parte de uma escala mais aberta e pulsa durante a abertura. Traçados, círculos, ícones de estado e cores separam disparo, dano em área, cura, proteção, penalidade e efeito persistente. O Campo de Treino do Refúgio oferece as duas formações completas, com saída imediata e sem espólio.

### Árvore do Mago e leitura de combate

O Canalizador acessa a árvore após as Ruínas do Farol. Recebe dois pontos no nível inicial e dois por nível de herói. Cada nível de nó custa um ponto e verifica os pré-requisitos. O Refúgio permite redistribuir pontos e preparar até seis ativas, três passivas e o Círculo do Vazio. A Centelha fica no primeiro espaço para recuperar Foco. O Núcleo de Foco funciona como fundamento da árvore. Os quatro feitiços iniciais e as três passivas existentes preservam a configuração inicial ao migrar da versão 0.3.0.

Na arena, a vida atual e máxima aparece junto à unidade e no painel do herói. Aliados usam verde, inimigos usam vermelho e escudos têm contorno azul. A Centelha viaja até um alvo. A Chuva Astral lança meteoros de gelo com caudas de fogo azul sobre a fileira atingida. Eles caem em sequência e explodem individualmente ao tocar o chão. O dano da habilidade é resolvido na primeira explosão e a próxima ação começa após a sequência. A Renovação envolve o aliado em luz ascendente, o Coro Vital pulsa sobre toda a formação e o Círculo do Vazio forma fendas e sigilos sobre a área. Cada feitiço tem ícone e som próprios e a opção de pular efeitos preserva a resolução do combate.

Cada encontro começa com uma entrada pela lateral da arena. Combatentes terrestres caminham até as posições da formação, e seres voadores entram flutuando. Núcleos e reforços recebem uma entrada própria quando aparecem. Pausa, velocidade, movimento reduzido e Pular efeitos se aplicam à chegada, que termina antes de liberar o próximo comando de combate.

### Exploração

O jogador seleciona um nó do mapa e abre um encontro que pode conter diálogo, baú, combate ou escolha, conforme o conteúdo. A interface indica o objetivo, os requisitos, o progresso da etapa e a recompensa. Cada encontro oferece um fluxo para continuar a jornada ou voltar à cidade.

## Sistemas

### Cidade e economia

| Edifício do MVP | Função |
| --- | --- |
| Salão do Conselho | Define o limite de nível dos demais edifícios e participa dos desbloqueios de regiões. |
| Quartel das Maldições | Recruta e melhora tropas. |
| Fazenda do Vale | Produz provisões periodicamente, com coleta e limite de armazenamento. |
| Tesouraria | Define a capacidade de ouro. |

O painel de cada prédio mostra nível, ação disponível, pré-requisitos, custo, duração e comparação entre o nível atual e o próximo. Produção e melhorias em andamento conservam seus tempos após o recarregamento. Compras, recrutamento e melhorias validam saldo e requisitos antes de debitar recursos e conceder o resultado uma única vez.

No Refúgio de Alvor, todos os quatro edifícios começam no nível 1. O Conselho deve completar o próximo nível antes de permitir melhorias dos demais. A Tesouraria comporta 500, 750 e 1.000 de ouro, respectivamente. A Fazenda produz uma provisão a cada 12, 9 ou 6 segundos e armazena até 8, 13 ou 20. A colheita transfere o estoque para a carteira. O Quartel permite treinar as tropas até seu nível. Cada nível de tropa acrescenta 10 Vida, 3 Ataque e 1 Defesa. Custos e tempos são parâmetros de balanceamento.

O ouro financia construções, compras e parte do recrutamento. As provisões complementam o custo de tropas. O XP progride o herói. Os cristais são previstos para pesquisa na Academia dos Ecos. Seu uso no MVP depende do escopo dessa construção. Portal dos Caminhos, Forja e Mercado fazem parte da cidade proposta. O acesso ao mapa é obrigatório no MVP, com o painel próprio do Portal ainda a definir. A campanha do MVP é concluível sem compras reais.

### Interface de chefes

O Guardião do Portão e os oito núcleos de expedição usam o mesmo HUD, no canto superior direito da arena. O núcleo recebe a interface quando emerge após a queda dos focos. Cada chefe tem nível de exibição, retrato, runa, paleta e ornamentação próprios. A barra mostra a camada atual, o número de camadas restantes e a Vida total real. As camadas são divisões visuais da Vida máxima e a perda de uma camada não altera as regras de dano.

A paleta acompanha a invocação do reforço do Guardião e a quebra da barreira da Sentinela da Ruptura. Os demais núcleos mudam de apresentação na última camada. Os ícones mostram efeitos que estão ativos e habilidades especiais quando executadas. A interface respeita a preferência por movimento reduzido e a opção Pular efeitos.

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

O salvamento v8 registra a tentativa ativa e seu resultado de forma transacional e conserva a preparação do Canalizador. A migração preserva os IDs das classes, acessórios, inventário anterior, tropas, formação, recursos e progresso. Ao retomar um combate interrompido, o encontro reinicia com a mesma formação e seed. A build de produção pode ser reaberta offline após carregar e preparar o cache em HTTPS ou localhost.

## Expansão ritual

A direção visual usa nanquim, placas de carvão, branco de sal e fitas carmesim. Vermelho, azul-elétrico e violeta identificam Vanguarda, Atirador de Precisão e Canalizador. Símbolos e texto acompanham as cores nos controles de combate. O Refúgio e a Praça de Alvor são a entrada para a futura expansão do Enclave. As ilustrações conceituais orientam o trabalho de arte, navegação e leitura em combate.

### Canalizador na versão 0.4.0

As recargas usam rodadas. Um feitiço de Foco gera Mácula no fluxo atual. A Jura desses feitiços acrescenta 30% de potência e cobra Vida e Corrosão. Alvorada e Círculo disputam a mesma reserva de Mácula e ficam fora da Jura. Bônus de cura multiplicam a potência antes do arredondamento e do limite da Vida máxima. Curar uma formação afeta apenas os integrantes vivos.

| Nó / habilidade | Tipo, custo e recarga | Efeito e progressão |
| --- | --- | --- |
| Núcleo de Foco | Fundamento | +4 Foco inicial por nível, até 3. |
| Centelha / Rastro de Cometa | Ativa, 0, sem recarga | 92% de Poder e +12 Foco. Cada nível soma 12 pontos percentuais ao bônus de potência, até 3. |
| Chuva Astral / Constelação Ardente | Ativa, 20 Foco, 2 | 112% de Poder na fileira e queimadura de 5 por 2 rodadas. +3 de dano periódico por nível, até 3. |
| Renovação / Seiva de Estrelas | Ativa, 35 Foco, 2 | 45 de cura em aliado escolhido. +6 por nível, até 3. |
| Coro Vital / Ressonância Vital | Ativa, 45 Foco, 3 | 22 de cura em cada aliado vivo. +4 por nível, até 3. |
| Fio de Âmbar | Ativa, 22 Foco, 2 | Cura 26% da Vida máxima do aliado vivo com menor percentual de Vida. Empate prioriza o menor índice de formação. +3 pontos percentuais nos níveis 2 e 3. |
| Orvalho de Sal | Ativa, 28 Foco, 3 | Cura 6% da Vida máxima de cada aliado ao fim de cada rodada por três rodadas. A aplicação substitui a anterior. +1 ponto percentual nos níveis 2 e 3. |
| Alvorada de Marfim | Ativa, 70 Mácula, 4 | Cura imediata de 32% da Vida máxima de cada aliado. +4 pontos percentuais nos níveis 2 e 3. |
| Prisma de Selos | Ativa, 25 Foco, 2 | Escudo de 32 por 2 rodadas em aliado escolhido. +6 pontos de escudo nos níveis 2 e 3. |
| Rasgo de Nanquim | Ativa, 32 Foco, 3 | 90% de Poder na fileira e marca de 12% de dano recebido por duas rodadas. +5 pontos percentuais ao dano nos níveis 2 e 3. |
| Trama Restauradora | Passiva | +8% de cura direta e periódica ao Canalizador por nível, até 3. |
| Margem do Vazio | Passiva | +3 de dano por pulso do Círculo por nível, até 3. |
| Juramento Sereno | Passiva | −2 no custo de Vida por Jura por nível, até 3. |
| Selo de Órbita | Passiva | +5 Mácula inicial por nível, até 2. |
| Círculo do Vazio / Horizonte do Abismo | Soberania, 60 Mácula, 3 | −4 de iniciativa, pulso de 9 ou 12 e +20% de dano direto do Canalizador na fileira por três rodadas. −5 de Mácula por nível do nó, até 2. |

| Preparação | Sequência e contrapartida |
| --- | --- |
| Sustento | Centelha para repor Foco, Orvalho antes do dano, Fio no aliado mais ferido e Alvorada quando a formação precisar de cura imediata. A Trama aumenta a cura e ocupa um espaço de passiva. Gastar Mácula na Alvorada adia o Círculo. |
| Pressão em fileira | Centelha recarrega recursos, Círculo escolhe a fileira, Rasgo expõe os alvos e Chuva inflige queimadura. Ações consecutivas na mesma fileira aumentam a pressão e deixam a outra responder normalmente. |
| Híbrido de contenção | Prisma cobre o aliado exposto, Fio resolve ferimentos graves e Chuva pune uma fileira cheia. A Jura acelera a sequência em troca de Vida e Corrosão. |

Os testes determinísticos verificam o custo da Alvorada, os três pulsos do Orvalho, o alvo proporcional do Fio e o bônus restrito à fileira do Círculo. Com 100 de Mácula, a Alvorada deixa 30, abaixo do custo mesmo com o Horizonte no máximo. Esse intervalo limita uma sequência de cura em massa seguida de Soberania. O balanceamento de PvP depende de partidas com builds completas de todas as classes.

### Próximos sistemas e integração

| Frente | Regras previstas | Dependência e aceitação |
| --- | --- | --- |
| Vanguarda e Atirador | 15 nós por classe, com um básico fixo, escolhas de até 6 ativas e 3 passivas e uma Soberania de três rodadas. Vanguarda deve alternar contenção, defesa e impacto. Atirador escolhe marcar, perfurar, pressionar a retaguarda ou sustentar-se com reposicionamento. | Testar duas composições viáveis por classe contra o mesmo encontro e medir dano, proteção, frequência da Soberania e custo das Juras. |
| XP e Índice de Calamidade | Degraus: início rápido para apresentar os recursos, meio sustentado por Relíquias, Pregos e Núcleos e fim guiado por cooperação. Primeira Purificação forte, Varredura após domínio, XP fixo de rotina e Bônus de Auxílio cooperativo. | Exibir XP e poder em separado. Bônus de retorno exige referência real de clã ou servidor e teto. Recompensa previsível e troca direta precisam coexistir com o saque variável. |
| Saque e conversão | Garantia visível para Núcleos, Pregos e relíquias-chave. Marcas de Expurgo financiam trocas fixas. Desmonte converte excedentes em Cinzas, Icor ou materiais. Selos de Enxerto preservam refinamento. | Reusar o Relicário, o Altar e a Calamidade Desperta existentes. Validar média e pior caso até uma peça-chave, com custo e retorno explícitos. |
| Rotina diária | Chamado da Quarentena conta purificações e Varredura. Pacto do Dia conta Juras ou Soberanias válidas. Forja e Contenção conta refinamento e encaixes. Expurgo em Grupo conta Ninhos ou auxílio. Metas, janela e pagamentos em dados, com alvo de 10–20 minutos e resgate único. | Começar pelos três contadores locais em ações confirmadas. O bloco cooperativo exige Ninho autoritativo. Reencaixar repetidamente o mesmo Prego deve contar uma vez por objetivo. |
| Rotação semanal | Colheita Profana concede Fios garantidos por energia gasta. Calamidade Desperta premia marcos configuráveis, inicialmente 100, 300 e 600 pontos. Semana do Grimório e do Clã mede contribuição e coleção em sete dias. | Usar ações do jogo, recompensas fixas e resgates idempotentes. Fragmentos permitem escolher uma peça ou acumular para o conjunto; a meta coletiva exige clãs reais. |
| Indumentárias | Quatro slots livres. Penteados e máscaras competem no adorno, junto de traje, projeção de arma e manifestação. A Bolsa abre prévia do herói, síntese e presets. Conjunto completo mantém bônus de coleção e título equipado mesmo com aparência misturada. | Somar ganhos PvE em limites calibráveis para que a coleção tenha peso e Relíquias sigam como fonte principal de força. Igualar bônus disponíveis por jogo e compra e normalizar poder cosmético em PvP competitivo. |

| Enclave | Recurso e progressão propostas |
| --- | --- |
| Santuário Central | Cinzas e marcos da campanha liberam os níveis e o teto das outras estruturas. Reaproveitar o papel atual do Conselho. |
| Câmara de Contenção | Talismãs selam candidatos enfraquecidos nas Zonas ou Ninhos. Icor e fragmentos evoluem graus Inferior, Médio, Superior e Calamidade. Prever um selo garantido na introdução e dois lugares na formação ativa. |
| Forja de Selamento | Cinzas refinam Relíquias. Pregos e Selos de Enxerto aproveitam as regras já existentes do Relicário sem duplicar carteiras. Melhorias liberam capacidades com o teto do Santuário. |
| Obelisco de Coleta | Produz Cinzas e Estilhaços de Obsidiana ao longo do tempo. Definir taxa e estoque por nível depois de medir a receita das campanhas. Teto inicial de referência de 12 horas para permitir duas coletas diárias. |

O primeiro elenco planejado da Câmara inclui **Colosso de Vidro** (Inferior, frente e proteção), **Predador de Tinta** (Médio, pressão em alvos enfraquecidos) e **Oráculo de Marfim** (Médio, cura ou manipulação de Mácula). Valores iniciais para simulação de treino são 12, 18 e 18 Coágulos de Icor, respectivamente. Cada evolução deve mostrar materiais, função, mudança nos atributos e contribuição ao Índice de Calamidade. A formação atual continuará carregando os recrutados durante a migração do sistema.

As **Bestas de Selamento** têm trilha única de nível e estrelas, com Icor e Selos de Domínio obtidos em jogo. Cão de Cinzas é a referência inicial, Corcel Ósseo no 10, Quimera de Talismãs no 20 e Leviatã de Nanquim no 30. Aparências especiais por eventos e trocas podem ser exibidas sem alterar a trilha de treino. O bônus de coleção é cumulativo com teto e a velocidade do mapa depende do terreno. Ganhos permanentes e formas especiais precisam ter limites e caminho gratuito antes de serem habilitados.

| Economia futura | Efeito, custo e limite |
| --- | --- |
| Mercado Profano | Obsidiana de atividades paga frascos com limite diário, encaixes de bolsa e Selos de Enxerto. Altar de Expurgo reserva Núcleos e Pregos avançados a Marcas de Expurgo ganhas em atividade. Alta Costura tem preço explícito em Lágrimas de Sangue ou caminho semanal. |
| Altar do Destino | Oito resultados úteis. Um giro gratuito por dia, um extra pelo Selo de Patrocínio e um terceiro opcional. A garantia de 30 giros precisa de contador persistente e deve avançar também com giros gratuitos. O protótipo atual conserva suas regras até a revisão da economia. |
| Selo de Patrocínio | 30 dias, dose diária de Lágrimas, giro extra, Varredura em lote, desconto de 10% em Cinzas nas melhorias da base e borda visual. Preços e limites ficam em aberto até testar a economia gratuita. Benefícios de tempo e aparência devem preservar a competição. |
| Relicário do Tempo | Vigília mensal acumula apenas com atividade útil visível, pausa em ausência e tem teto. A loja indica a virada do mês, saldo e expiração. Resgates predefinidos de Cinzas, Icor, Selos, Marcas, fragmentos e Indumentária. Definir teto e valores com telemetria antes de usar o relógio como fonte de recompensa. |

A primeira trilha após o Canalizador é estender a preparação a Vanguarda e Atirador. A segunda é instrumentar as ações de rotina e fechar a economia local de fragmentos, XP e garantia. Captura, Enclave e Bestas seguem sobre essa economia. Clã, Ninhos cooperativos, Vigília autoritativa, VIP e comércio real exigem identidade do jogador, serviço persistente e validação de transações e prazos no servidor.

## Painel de testes

A conta proprietária da prévia pode abrir **Testes** na barra superior depois de criar ou carregar um herói. O painel edita níveis do herói e das tropas recrutadas, ouro e provisões, e concede relíquias, materiais e aparências do catálogo. A operação usa o salvamento local da campanha, com os mesmos controles de revisão. A redução do nível do Canalizador requer pontos gastos compatíveis com o novo nível. No combate, o painel abre durante o turno do jogador. Uma mudança de nível reinicia o mesmo encontro na primeira rodada ao voltar, com a mesma semente e sem conceder recompensa adicional.

## Questões em aberto

- **Conteúdo da cidade.** O GDD inclui cristais entre os recursos do MVP e descreve a Academia e a Forja. O plano situa pesquisa e forja na expansão. Confirmar se haverá uso de cristais ou funcionalidade parcial desses edifícios no MVP.
- **Tropas e equilíbrio.** Definir os desbloqueios de tropas além de Sentinela e Besteiro, a regra de recuperação dos feridos e os valores de produção. Custos, efeitos e recompensas da primeira jornada são parâmetros provisórios.
- **Decisões futuras.** Nome comercial, direção de arte final, volume adicional de conteúdo, licenças de assets, infraestrutura online, formato de PvP e monetização.

## Fontes do projeto

- `GAME_DESIGN_DOCUMENT.md` (visão, regras de jogo, conteúdo proposto e aceitação).
- `TECHNICAL_DESIGN.md` (restrições de interface, persistência e verificações).
- `DEVELOPMENT_PLAN.md` e `TASKS.md` (marcos, recorte do MVP e expansões).
