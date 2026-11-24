# DEVELOPMENT PLAN — Entrega por marcos verificáveis

## Estratégia
Construir um **vertical slice** completo e divertido, depois ampliar conteúdos e sistemas. Um MMO do porte de Wartune é um produto de grande escopo e não deve ser prometido como resultado de um único prompt. Cada marco termina com build executável, roteiro de teste e evidências honestas.

## M0 — Fundação
- Inicializar projeto Vite + Phaser + TypeScript, scripts, lint, testes, pastas e README.
- Cena Boot/Title, gerenciador de cenas, layout responsivo, assets temporários originais e áudio desligável.
- Modelos de dados, store, RNG reproduzível, IndexedDB e versão de save.
**Aceite:** `npm run dev`, build e testes básicos funcionam; título possui Novo/Continuar.

## M1 — Combate funcional
- Motor separado do renderer; 3 classes com ataque básico + 2 habilidades cada.
- Formation 2×3, 2 tropas recrutáveis, inimigos, status, custo/cooldown, IA, velocidade e resultado.
- Combat UI e efeitos visuais mínimos, 1 batalha tutorial e 1 miniboss.
**Aceite:** jogar até vitória/derrota com cada classe, sem duplicidade de dano/recompensas; testes de motor.

## M2 — Cidade + economia
- 4 prédios funcionais: conselho, quartel, fazenda, tesouraria; HUD de recursos.
- Construções/upgrade, recrutamento e formação; produção com relógio persistente.
**Aceite:** contratar tropa/melhorar prédio/coletar e recarregar sem perder ou duplicar estado.

## M3 — Exploração + progressão
- Mapa região Campos de Alvor, 3 nós/combates + chefe.
- Missões ligadas a eventos reais, XP/levelup, drops, inventário/equipar 6+ itens.
- Tutorial guiado e autossalvamento.
**Aceite:** fluxo completo Novo Jogo -> Chefe -> Recompensa -> Continuar.

## M4 — Polimento do MVP
- UI desktop/móvel, ajustes de equilíbrio, música e SFX originais, animações completas essenciais, modo Auto opcional.
- Testes de regressão, recuperação de save, telas de erro, otimização de mobile, README de deploy.
**Aceite:** checklist de GDD completo, sem erro bloqueador reproduzível.

## M5 — Expansão PvE
- Novas regiões e inimigos; forja, talentos, pesquisa, masmorras, montarias/companheiros originais, metas diárias com resets claros.
- Progressão de médio prazo e ferramentas de balanceamento.
**Aceite:** novos sistemas integrados à economia e missões, testados sem quebrar save.

## M6 — Multiplayer (projeto independente)
- Infraestrutura de servidor, autenticação, banco de dados, transferência consciente de save, proteção econômica.
- PvP assíncrono primeiro, guilda e cooperativo depois, se orçamento/infraestrutura permitirem.
- Chat moderado, eventos agendados e monitoramento operacional.
**Aceite:** testes de concorrência, autenticação/autorização, duplo crédito, latência e queda de conexão.

## M7 — Publicação
- Validar direitos de assets, termos, classificação indicativa, privacidade e store SDKs.
- Adaptar build para Poki/Android/Steam individualmente; testes reais por plataforma.
- Integração de compra digital somente após backend, recibos e políticas da loja.

## Processo após cada marco
1. Atualizar `TASKS.md` com execução concreta.
2. Entregar instruções precisas de execução e lista de arquivos modificados.
3. Reportar testes aprovados, falhos e não executados (sem inventar).
4. Manter jogo funcional ao final do marco; não avançar até corrigir bloqueadores.
