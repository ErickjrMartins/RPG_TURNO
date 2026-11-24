# GAME DESIGN DOCUMENT (GDD) — RPG Estratégico de Fantasia

**Status:** proposta de design original para implementação pelo Codex, não engenharia reversa integral de Wartune.
**Codinome provisório:** Reinos da Aurora (renomeável).
**Gênero:** RPG de fantasia + estratégia leve + cidade + combate tático por turnos / tempo de decisão.
**Plataformas alvo:** navegador desktop e celular; empacotamento Android posterior; Steam apenas após adaptação e validação.
**Idioma inicial:** português brasileiro; arquitetura preparada para i18n.
**Público:** jogadores que apreciam progressão persistente, PvE, batalhas com habilidades, tropas e gestão de recursos.

> Requisitos e decisões da versão em desenvolvimento são consolidados em GAME_DESIGN.md.

## 1. Evidências e limites da referência
- **Referência verificada:** site oficial `https://wartune.wan.com/`, guias oficiais e documentação comunitária. O site público lista servidores e páginas de notícias/guias, mas a sessão de jogo exige acesso e pode depender de cliente.
- **Vídeo indicado:** `https://youtu.be/XMVmkhYRMlE` — identificado como *Wartune Gameplay First Look*. Não foi possível inspecionar frame a frame a reprodução completa; NÃO atribuir a cenas desse vídeo detalhes não verificados.
- **Verificado:** três arquétipos (guerreiro/cavaleiro, mago, arqueiro); herói + tropas em formação com fileiras; combate com habilidades e energia; exploração e campanhas; cidade com edifícios; guildas, masmorras, chefes, PvP, agricultura; equipamentos, montarias, companheiros/espíritos, astrals/gemas em versões históricas. Fontes no fim.
- **Proposto para este projeto:** nomes, lore, valores numéricos, mapas, missões, taxas, tempos, habilidades e sequência de desbloqueio abaixo. São sugestões originais de design, não valores copiados do Wartune.

## 2. Visão criativa e pilares
### Premissa original
Após a queda do Farol Celestial, pequenos domínios devem restaurar portais antigos enquanto defendem suas cidades de criaturas do Véu. O jogador lidera um herói, recruta guardiões e reconstrói um assentamento.

### Pilares
1. Cada combate deve ser interessante: escolha de habilidade, alvo, energia, status e formação.
2. Cada vitória deve melhorar a cidade/herói/tropas e desbloquear novas possibilidades.
3. O jogador sempre entende objetivos, materiais necessários, recompensas e o que fazer a seguir.
4. Uma campanha PvE completa deve funcionar **offline em modo local** antes de adicionar multiplayer.
5. Nenhuma dependência de microtransações para completar a campanha.

## 3. Loop central do jogo
Criar herói → introdução → cidade → coletar recursos → recrutar tropas → abrir mapa → escolher missão → explorar nó/área → iniciar batalha → atuar em rodadas → conquistar recompensa → equipar/crescer → aprimorar edifícios/tecnologia → desbloquear região → repetir com novos desafios.

### Primeiros 15 minutos — roteiro obrigatório
1. Tela de título e `Novo jogo`/`Continuar`.
2. Seleção entre Guerreiro, Arqueiro e Mago, com nome do herói, aparência masculina ou feminina, apresentação visual e dois atributos de destaque por classe.
3. Cena tutorial curta de combate com 1 herói, 1 guarda aliado e 2 inimigos; ensinar ataque básico, habilidade e alvos.
4. Tela de vitória com experiência, ouro, item e opção explícita de continuar.
5. Entrada na cidade; destacar quartel; recrutar uma tropa.
6. Melhorar a sede, mostrar custo, tempo e efeito no próximo nível.
7. Abrir o mapa e completar uma segunda batalha com miniboss, com possibilidade real de derrota/repetição.
8. Ensinar inventário e equipamento; salvar progresso automaticamente.

## 4. Criação de personagem e classes
| Classe | Papel | Recursos | Força | Fraqueza |
|---|---|---|---|---|
| Guerreiro | tanque/controle | Ímpeto (0–100) | defesa/escudos | menor dano em área |
| Mago | magia/suporte | Foco (0–100) | dano em área/cura | baixa defesa física |
| Arqueiro | precisão/dano | Concentração (0–100) | crítico/alvos específicos | menor resistência |

As aparências masculina e feminina compartilham as regras de classe. Cada classe começa com ataque básico gratuito e duas habilidades desbloqueadas; outras por nível. Árvore futura: 2 ramificações de talentos por classe, pontos com reset por recurso de jogo.

### Estatísticas (propostas)
Nível, XP, HP máximo/atual, ataque físico, ataque mágico, defesa física, defesa mágica, velocidade, chance crítica, dano crítico, precisão, esquiva, bloqueio, resistência a efeitos, poder de combate estimado. Definir fórmulas centralmente e limitar chances a intervalos balanceados.

## 5. Sistema de combate — especificação funcional
### Cena
Câmera lateral em arena de fantasia 2.5D **renderizada em 2D**, composição heroica com aliados à esquerda e inimigos à direita, fileira frontal e traseira, retratos, barras de vida, energia, números de dano, efeitos e painel de habilidades.

### Estados explícitos
`PREPARE -> ROUND_START -> PLAYER_INPUT -> PLAYER_ACTION -> ALLY_ACTIONS -> ENEMY_ACTIONS -> STATUS_TICK -> ROUND_END -> (ROUND_START|VICTORY|DEFEAT)`.
Cada transição deve ser validada e testável; nenhuma animação pode executar duas vezes o dano. Bloquear cliques durante resolução, com enfileiramento deliberado se desejado.

### Mecânicas
- Formações: 2 linhas × até 3 slots por time no MVP; herói ocupa um slot, até 2 tropas aliadas inicialmente. Futura ampliação após balanceamento.
- Ordem de ação por velocidade com desempate determinístico e prioridade explícita de efeitos.
- Jogador escolhe habilidade e alvo válido; inimigos usam IA por pesos e situação.
- Alvos: único, fileira frontal, fileira traseira, grupo, aliado com menor HP, todos aliados, próprio herói.
- Guerreiro: Golpe Firme (básico), Muralha (escudo), Investida (dano e debuff).
- Mago: Centelha (básico), Chuva Astral (área), Renovação (cura).
- Arqueiro: Disparo (básico), Rajada Dupla, Marca da Caça (debuff).
- Custo de recurso e cooldown em turnos definidos por arquivo de configuração; habilidades indisponíveis ficam visualmente bloqueadas.
- Status: escudo, sangramento, queimadura, regeneração, atordoamento (com limite para evitar trava permanente), bônus e redução de ataque/defesa/velocidade.
- Dano: função pura recebe atacante/defensor/skill/seed; aplica poder, defesa, crítico, aleatoriedade controlada e barreiras; arredondar e impedir HP negativo.
- Eventos sem duplicidade: uso de habilidade, consumo de energia, hit, dano, morte, drops, fim de rodada, resultado.
- Derrota: sem perda punitiva irreversível no MVP; botão `Tentar novamente`.
- Vitória: XP, ouro, drops fixos/ponderados, progresso de missão; recompensas só uma vez por instância concluída.
- Velocidades 1x/2x, `Pular animação` sem alterar resultado, `Auto` opcional após tutorial, com critério de seleção configurável.
- QTE de sequência de teclas aparece em referências históricas; para o projeto, manter como **experimento futuro**, opcional e acessível, não requisito do MVP.

### Exemplo de balanceamento (sujeito a testes)
Ataque básico: gera 12 recurso; habilidade A custa 20; habilidade B custa 35; começo com 20; recuperação por turno +5; duração desejada de batalha comum: 3–6 rodadas; miniboss: 5–9. Números são propostas, NÃO dados oficiais.

## 6. Tropas, recrutamento e formação
Unidades próprias: Sentinela (tanque), Besteiro (alvo único), Adepta (apoio), Lanceiro (dano). Inicialmente duas recrutáveis. Cada tipo tem custo de ouro + provisões, HP, ataque, defesa, velocidade, IA, nível, tamanho de grupo e animações de espera/ataque/sofrer dano/morrer. Tropas preservam nível, composição e formação após salvar. Um soldado ferido após missão é restaurado conforme regra clara de recuperação; custo e limites documentados.

## 7. Cidade — construções conectadas
- **Salão do Conselho:** limite de nível dos demais edifícios e desbloqueio de regiões.
- **Quartel dos Guardiões:** recrutamento e melhoria de unidades.
- **Tesouraria:** capacidade de ouro.
- **Fazenda do Vale:** gera provisões periodicamente; coletar com limite de armazenamento.
- **Academia dos Ecos:** pesquisas de ataque, defesa e produção, consumindo cristais.
- **Forja:** aprimorar, fabricar, desmontar e equipar itens (fases posteriores do MVP).
- **Portal dos Caminhos:** selecionar campanhas e áreas.
- **Mercado:** gastar recursos do jogo; comércio entre jogadores apenas na fase online.

Cada edifício deve ter: `id`, nível, custo de melhoria, pré-requisitos, duração, produção/capacidade, recompensa e ação principal. Ao clicar, abrir painel com comparação antes/depois. Melhorias devem continuar corretamente após recarregar. Na fase local, usar relógio persistente com proteção contra timestamps inválidos; na fase online, tempos controlados pelo servidor.

## 8. Mapas, exploração e missões
### Mapa-múndi original
Região 1: **Campos de Alvor** (tutorial, ruínas, bosque, torre inimiga). Região 2: **Pântanos do Véu** (veneno, inimigos resistentes, chefe). Região 3: **Cordilheira Cinzenta** (gelo, armadilhas, chefe). Região 4: **Desfiladeiro das Cinzas** (fogo, ondas inimigas). Cada região tem entrada por missão/requisito de nível, 3–6 nós, mini-chefe, chefe, itens e cenário próprio; no MVP, implementar **Região 1** funcional com 3 nós de batalha e 1 chefe.

### Interações de exploração
Seleção de nó no mapa; tela de encontro, diálogo, baú, combate ou escolha; efeitos condicionais; retorno à cidade. Jogador vê missão principal, tarefas secundárias, objetivo rastreado, status de etapa, requisito e recompensa. Sem caminhos que levem a telas vazias.

### Tipos de missão
História, eliminar inimigo, vencer boss, recrutar tropa, atualizar edifício, equipar item, coletar produção, concluir masmorra. Modelo de missão com `prerequisites`, `objectives`, `eventTypes`, `reward`, `repeatPolicy`, `claimedAt`, `state`. Transições idempotentes.

## 9. Equipamentos, itens e economia
Slots: arma, elmo, armadura, luvas, botas, colar, anel e artefato. Raridades: comum, incomum, raro, épico, lendário (MVP: 3 primeiras). Inventário com quantidade, empilhamento, filtros, limite configurável, indicação de novo item e confirmação para descarte de item raro. Equipamento altera estatísticas imediatamente e persiste. Recompensas geradas de tabelas de loot versionadas com seed.

Recursos do MVP: ouro (construções/compras), provisões (tropas), cristais (pesquisa) e XP. Consumidores e fontes devem aparecer em uma tabela de economia no código; evitar inflação e progressão bloqueada. Interface mostra saldo e pré-requisitos com clareza. Economias premium e transações reais não fazem parte do MVP.

## 10. Progressão e atividades futuras
### Prioridade próxima após MVP
- Forja mais completa, gemas, árvore de talentos, montaria cosmética ou estatística balanceada, criatura auxiliar original, masmorra de 5 encontros, desafios diários PvE locais, conquistas.
### Multiplayer real — fase independente
- Conta autenticada, perfil persistente no servidor, inventário/economia autoritativos, arena PvP assíncrona ou em tempo real conforme orçamento, guildas, chat moderado, masmorras cooperativas, chefe mundial com instâncias e antitrapaça. Não simular NPC como jogadores humanos.
### LiveOps
- Eventos datados, temporadas, ranking, recompensas diárias com regras transparentes, controle de fuso e relógio do servidor. Não adotar práticas de pressão monetária no MVP.

## 11. Interface e experiência
Telas: título; criação de herói; cidade; mapa; aventura; combate; vitória/derrota; herói/equipamento; inventário; tropas/formação; edifícios; missões; configurações; tutorial; salvar/continuar.

HUD cidade: topo (nome, nível/XP, recursos), centro (construções e personagem), lateral (objetivo rastreado), rodapé/menu recolhível (Herói, Tropas, Missões, Mapa, Bolsa, Configurações). HUD combate: herói + inimigos, barras legíveis, fila de turnos, habilidades com custo/cooldown, alvos selecionáveis, alternador automático, velocidade, pausa, log resumido.

### Feedback obrigatório
Animação de clique, seleção de alvo, movimento mínimo por ação, impacto, shake sutil, partículas, número flutuante, barra atualizada, áudio distinto por evento, mensagens de bloqueio explicativas, sons mutáveis e opção de reduzir animação.

## 12. Direção artística e áudio — ORIGINAL
Fantasia estilizada 2D de alta definição, personagens 2D com corpo inteiro e silhuetas diferenciáveis, fundos pintados por camadas com parallax sutil, profundidade 2.5D sem câmera isométrica obrigatória. UI legível com metal/pedra/fibra estilizados, **não reproduzir a UI de Wartune**. Primeira entrega pode usar sprites e efeitos provisórios originais. Animações: `idle`, `cast/attack`, `hit`, `death`, `victory`, `walk` para exploração. Exportação por atlas sprites e manifesto de animação. Música dinâmica por contexto, SFX para interface, hit, magia, coleta, upgrade e vitória/derrota, com licenças registradas.

## 13. Dados e salvamento
Versionar save (`schemaVersion`), salvar: classe, nível, XP, atributos derivados, equipados, inventário, recursos, tropas e suas posições, edifícios/tempos, pesquisas, campanha, missões, preferências, tutorial e horário do último save. Usar IndexedDB para dados locais com exportar/importar JSON e migrações. Não armazenar informações sigilosas no cliente. Autosave depois de operações transacionais e checkpoints; salvar em carregamento/reinício de aba, com validação de schema e recuperação segura para corrupção.

## 14. IA e dificuldade
IA inimiga com regras legíveis: se aliado com HP baixo, apoio cura; se escudo do herói alto, usar magia; priorizar fileira frontal salvo habilidades de alcance; boss tem telegráficos e fases. Dificuldade progressiva por área; evitar aumento arbitrário de HP como único elemento. Boss inaugural: **Guardião do Portão Caído** com 2 fases (<50% HP invoca reforço e muda padrão de ataque). Testar vitória com as três classes.

## 15. Critérios de aceitação do MVP
- Todas as 3 classes criam personagem e concluem tutorial.
- Pelo menos 3 encontros + 1 boss, com combate real e estados de vitória/derrota.
- Pelo menos 3 tropas disponíveis, com 2 recrutáveis no início e posições persistentes.
- Cidade com 4 edifícios utilizáveis e custo/efeito real; coleta de recurso.
- Missões, loot, XP/level-up e 6+ equipamentos reais; inventário equipável.
- Salvar, fechar, reabrir, continuar sem duplicação de itens/moeda/recompensas.
- Responsivo e usável com mouse/teclado/toque, texto legível.
- Sem botões inertes, placeholders permanentes disfarçados ou erros no console da jornada principal.
- Executa `npm run dev`, `npm run build`, `npm test` e scripts de qualidade definidos.

## 16. Riscos e decisões pendentes
Direção de arte final, nome comercial, escolha de backend para MMO, servidores/custos, PvP sincronizado, volume de conteúdo, assets licenciados e monetização exigem decisão posterior. Não bloquear o MVP por essas escolhas.

## Referências externas — consulta em 18/11/2026
- Site oficial: https://wartune.wan.com/
- Vídeo enviado: https://youtu.be/XMVmkhYRMlE
- Classes/habilidades oficiais: https://wartune.wan.com/article/news/aid/8035.html ; https://wartune.wan.com/article/read.html?aid=8038 ; https://wartune.wan.com/article/read.html?aid=8039
- Guia oficial de construções (Wartune Ultra, versão distinta): https://wartunelite.wan.com/article/news/aid/pc/8343.html
- Visão geral comunidade: https://wartune-official.fandom.com/wiki/Wartune_Official_Wiki
- Combate e formações: https://mmohuts.com/review/wartune
- Campanhas: https://wartune-official.fandom.com/wiki/Campaigns
- Original e Ultra não são idênticos; elementos de Ultra foram usados somente como referência de categoria, não como afirmação sobre a versão exata do vídeo.
