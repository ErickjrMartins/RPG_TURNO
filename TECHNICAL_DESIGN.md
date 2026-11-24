# TECHNICAL DESIGN — RPG Estratégico de Fantasia

## 1. Recomendação tecnológica
**MVP: Phaser 3 + TypeScript estrito + Vite + HTML/CSS para painéis e acessibilidade + IndexedDB (Dexie opcional).** Phaser é adequado para cenários 2D, sprites, câmeras, partículas, timeline/tween, input touch e browser. Uma engine 3D completa é desnecessária para o formato proposto; React é opcional para interfaces complexas e não deve ser adotado sem necessidade. Use versões estáveis atuais verificadas no momento da instalação, sem assumir APIs obsoletas.

**Alternativa:** Godot 4 para ferramenta visual de edição de cenas e exportações nativas; exige reconstrução do fluxo e não é a escolha inicial deste MVP HTML5. Se a estratégia mudar para Android/Steam prioritariamente, reavaliar com critérios objetivos.

**Multiplayer após MVP:** Node.js/TypeScript + WebSocket, banco PostgreSQL, Redis apenas se necessário. Serviço autoritativo, validações transacionais, registro de evento e rate limit. Não colocar toda lógica do servidor no front-end.

## 2. Estrutura sugerida
```
project/
  AGENTS.md
  GAME_DESIGN_DOCUMENT.md
  TECHNICAL_DESIGN.md
  DEVELOPMENT_PLAN.md
  TASKS.md
  README.md
  package.json
  index.html
  public/assets/{sprites,atlases,backgrounds,audio,ui}/
  src/
    main.ts
    game/config.ts
    game/scenes/{BootScene,TitleScene,CharacterScene,CityScene,WorldMapScene,BattleScene,ResultScene}.ts
    game/entities/{HeroSprite,TroopSprite,EnemySprite}.ts
    game/ui/{HUD,SkillBar,BuildingPanel,InventoryPanel,QuestPanel}.ts
    domain/{combat,economy,character,city,quests,inventory,progression}/
    domain/combat/{BattleEngine,TurnQueue,Targeting,Damage,Status,EnemyAI}.ts
    content/{classes,skills,enemies,troops,items,buildings,quests,maps,loot}.ts
    state/{GameState,GameActions,selectors}.ts
    persistence/{SaveRepository,SaveMigrations,SaveValidation}.ts
    shared/{types,events,rng,math}.ts
    styles/
  tests/{unit,integration,smoke}/
```

## 3. Regras de separação
- `domain/` não importa Phaser, DOM nem APIs de armazenamento; funções puras e entidades tipadas.
- `game/scenes/` chama ações do domínio, representa eventos e animações; não calcula economia/combate.
- `content/` contém tabelas configuráveis validadas por schemas e IDs estáveis.
- `state/` mantém fonte única de verdade; não duplicar saldo, HP ou progresso em diversas cenas.
- `persistence/` recebe snapshots validados e faz versionamento.
- Usa RNG com seed injetável no combate e loot, permitindo replay e teste.
- Eventos tipados (`battle:started`, `skill:used`, `damage:applied`, `enemy:defeated`, `quest:progressed`, `resource:spent`, `building:upgraded`, `save:completed`).

## 4. Modelo de dados ilustrativo
```ts
type HeroClass = 'warrior' | 'archer' | 'mage';
type Presentation = 'masculine' | 'feminine';
type BattlePhase = 'prepare' | 'roundStart' | 'playerInput' | 'resolve' | 'roundEnd' | 'victory' | 'defeat';
type Currency = 'gold' | 'supplies' | 'crystals';
interface PlayerSave {
  schemaVersion: number;
  savedAt: string;
  hero: { id: string; name: string; heroClass: HeroClass; presentation: Presentation; level: number; xp: number; equipment: Record<string, string | null> };
  currencies: Record<Currency, number>;
  inventory: Array<{ instanceId: string; itemId: string; quantity: number }>;
  troops: Array<{ instanceId: string; troopId: string; level: number; slot: number }>;
  buildings: Record<string, { level: number; upgradeEndsAt?: string }>;
  completedEncounters: string[];
  quests: Record<string, { progress: number[]; claimed: boolean }>;
  flags: Record<string, boolean>;
  settings: { music: number; sfx: number; reduceMotion: boolean; autoBattle: boolean };
}
```
Versão acima é conceitual; completar schemas, prevenção de IDs repetidos e validação de índices.

## 5. Motor de batalha
**API proposta:** `createBattle(config, seed) -> BattleState`, `getValidActions(state)`, `applyAction(state, action) -> {state, events}`, `advanceNonPlayerActions(...)`, `getOutcome(state)`. Comandos de usuário são validados: fase, dono da vez, existência de alvo, custo de recurso, cooldown, status impeditivo. Efeitos são descritos por dados e processados com ordem fixada. UI só executa animações dos eventos retornados. Recompensa apenas após transição final validada, com `encounterRunId` para idempotência.

## 6. Economia e upgrades
`purchase/upgrade` deve funcionar como transação: validar requisitos e saldo -> aplicar débito uma única vez -> conceder item/upgrade -> atualizar missões -> salvar. Testar recursos insuficientes, duplo clique, troca de tela e refresh durante atualização. Clock persistente para upgrades e coleta local. Não atribuir recompensa em callback de animação.

## 7. UI/input e resolução
Canvas Phaser com `Scale.FIT` e tamanho lógico sugerido 1280×720; área segura para notch; letterbox tolerável mas sem elementos críticos cortados. Paisagem recomendada; para retrato, fornecer overlay orientativo opcional e navegação acessível. Touch targets >= 44 CSS pixels como referência. `pointer` para seleção/movimento, ESC para voltar, atalhos numéricos para skills, tabulação possível nos menus HTML. Escala de fontes, overlay de modal, navegação entre painéis. Limitar FPS e efeitos gráficos em celulares medianos.

## 8. Performance
Asset packs por cena e lazy loading; sprites atlases comprimidos; texturas com dimensões adequadas; limitar partículas, instâncias simultâneas e canvas resize; pooling de números de dano; pausar em aba oculta; monitorar tempo de carregamento/uso de memória, registrar metas em testes reais. Sem animações infinitas criadas em cada frame.

## 9. Persistência local e evolução online
MVP local: IndexedDB + `schemaVersion`, backups de última gravação íntegra, exportação/importação, testes de migração. Offline-first não equivale a antitrapaça: moeda local pode ser manipulada. Quando houver PvP, eventos online, rankings ou compras, **servidor autoritativo** controla inventário, moedas, resultados e tempos. Nunca converter save local diretamente em crédito competitivo sem validação.

## 10. Publicação e monetização
- **Poki:** confirmar SDK e critérios de submissão na data de publicação; evitar dependências de login externo, peso excessivo e integração de anúncios antes da validação.
- **Google Play:** se o jogo vender moedas/bens digitais no app distribuído na Play Store, integrar Google Play Billing conforme políticas vigentes; confirmar compra no backend e conceder moedas somente após verificação server-side. HTML5 empacotado em WebView/Capacitor precisa de bridge nativa segura e plugin compatível.
- **Steam:** avaliar Steamworks e políticas comerciais na fase de empacotamento.
- Nenhuma compra real, anúncio, autenticação social, servidor pago ou SDK proprietário deve ser falsamente apresentado como funcionando no MVP.

## 11. Segurança e operação do online (futuro)
Validação de sessão e autorização por jogador; antifraude em recompensas; tokens apenas server side; TLS; limites de requisições; idempotency keys; logs sem PII desnecessária; backup e migrações de banco; isolamento de servidores; moderação de chat; proteção de menores quando pertinente; integração e política de privacidade.

## 12. Scripts e testes
Scripts alvo: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:watch`. Framework de testes Vitest; Playwright opcional para testes de fluxo após consolidar UI.
Casos obrigatórios: dano/defesa/crítico, aplicação/expiração de status, alvos válidos, bloqueio de habilidades por custo, vitória/derrota, recompensa única, XP/levelup, compra sem saldo, upgrade com saldo, formação salva, migração de save, classe escolhida preservada, três classes conseguem finalizar campanha MVP.

## 13. Definição de visualização vs funcionalidade
A primeira build precisa conter sprites visíveis, uma cidade navegável, um combate que usa o motor real, HUD, inventário e salvamento funcional. Placeholder ilustrado é permitido apenas quando explicitamente marcado como temporário no README e não deve virar um menu sem ação.
