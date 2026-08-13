---
name: prd-to-tickets
description: Criar PRDs detalhadas a partir de requisitos, épicos, planos ou specs locais e decompor cada PRD em tickets Markdown verticais para o projeto. Usar quando o usuário quiser transformar um requisito do Insta Flow em decisões explícitas, documentação de produto e tickets locais implementáveis.
---

# PRD to Tickets

## Objetivo

Conduzir o fluxo completo de descoberta e planejamento do Insta Flow:

```text
Requirement / Epic / Spec
        ↓
contexto do repositório
        ↓
decisões que exigem o usuário
        ↓
PRD detalhada
        ↓
decomposição em fatias verticais
        ↓
aprovação da decomposição
        ↓
docs/tickets/*.md
```

Produzir documentação e tickets; não implementar código durante este fluxo.

## Entradas e escopo

Aceitar como fonte:

- caminho local para um requisito, épico, plano ou spec;
- identificador de um épico ou requisito dentro de `REQUIREMENTS.md`;
- contexto da conversa, quando o usuário não fornecer um arquivo;
- combinação das fontes acima.

Se o pedido cobrir o produto inteiro, identificar um épico ou uma primeira fatia implementável. Não misturar vários épicos em uma única PRD sem justificar o limite.

Usar o vocabulário e as restrições do projeto. No Insta Flow, consultar, quando relevantes:

- `ARCHITECTURE.md` para fronteiras, módulos e decisões arquiteturais;
- `REQUIREMENTS.md` para requisitos, épicos, histórias e critérios de aceite;
- `DATA-MODEL.md` para entidades, estados, integridade e persistência;
- `ROADMAP.md` para fase, ordem e bloqueios;
- `CONTEXT.md`, `docs/adr/` e tickets existentes, se estiverem presentes.

Ler integralmente a fonte indicada. Ler apenas os documentos relacionados necessários para preservar o contexto. Não substituir a documentação de domínio por suposições genéricas.

## Fase 1 — Entender o contexto

Antes de perguntar ou escrever arquivos:

1. Identificar objetivo, atores, escopo e épico de origem.
2. Mapear requisitos funcionais e não funcionais relacionados.
3. Identificar módulos, integrações, dados, estados, eventos e filas afetados.
4. Verificar padrões existentes e decisões registradas.
5. Registrar ambiguidades que alterariam comportamento, segurança, dados, UX, operação ou esforço.

Não perguntar sobre pontos já decididos na fonte. Não transformar cada detalhe de implementação em uma pergunta.

## Fase 2 — Resolver decisões com o usuário

Criar uma lista curta de decisões materiais. Para cada item, apresentar:

- `DEC-XX`: identificador estável;
- questão objetiva;
- por que a decisão importa;
- recomendação do agente;
- alternativas e impacto de cada alternativa;
- se bloqueia a PRD ou pode ser adiada.

Perguntar uma decisão por vez ou em pequenos grupos coerentes. Usar a ferramenta de entrada do ambiente quando disponível; caso contrário, fazer perguntas diretas em português.

Priorizar nesta ordem:

1. comportamento principal e limites do escopo;
2. autorização, isolamento multi-tenant e segurança;
3. modelo de dados e consistência;
4. contratos, eventos, filas e integrações;
5. UX, observabilidade e detalhes operacionais.

Classificar cada decisão como `RESOLVIDA`, `ACEITA COMO PADRÃO`, `ADIADA` ou `BLOQUEADA`. Não marcar como resolvida uma decisão que o usuário não respondeu. Se uma decisão puder seguir uma convenção documentada sem mudar o produto, usar `ACEITA COMO PADRÃO` e registrar a justificativa.

Não criar a PRD enquanto existir uma decisão bloqueadora sem resposta. Decisões adiadas devem aparecer na seção `Further Notes` da PRD, com o impacto e o momento em que precisam ser revisitadas.

## Fase 3 — Criar a PRD

Depois que as decisões bloqueadoras forem respondidas, criar um arquivo novo. Usar esta prioridade de destino:

1. diretório de PRDs já existente no projeto;
2. `docs/prds/`;
3. `docs/`;
4. raiz do repositório somente se nenhum diretório de documentação existir.

Usar nome lowercase kebab-case que identifique o épico ou feature. Não sobrescrever uma PRD existente sem autorização explícita.

Escrever a PRD com as seções abaixo:

```markdown
# <Nome da feature>

## Source and Traceability

Fonte, épico, requisitos e decisões DEC-XX cobertos.

## Problem Statement

Problema do usuário, público afetado, contexto e valor da solução.

## Goal and Scope

Objetivo verificável, incluído, não incluído e critério de sucesso.

## Actors and Permissions

Atores, workspace/organization, permissões e isolamento.

## User Stories

Histórias numeradas no formato: As an <actor>, I want <capability>, so that <benefit>.

## Functional Behavior

Fluxos principal e alternativos, validações, estados vazios, carregamento, erros, retry, recuperação e edge cases.

## Domain Rules and Data

Entidades, relações, invariantes, estados, idempotência, retenção e consistência.

## Contracts and Integrations

API, eventos, jobs, adapters, dependências externas e compatibilidade.

## Acceptance Criteria

Critérios observáveis e verificáveis, organizados por fluxo.

## Implementation Decisions

Módulos, responsabilidades, interfaces, fronteiras, transações, autorização e observabilidade. Não incluir caminhos específicos de arquivos nem trechos de código.

## Testing Decisions

Testes unitários, integração, contrato e ponta a ponta; sucessos, falhas e casos-limite.

## Out of Scope

Funcionalidades adjacentes excluídas para evitar aumento de escopo.

## Decision Log

DEC-XX, decisão, status, resposta, impacto e data.

## Further Notes

Suposições, riscos, dependências, decisões adiadas e referências.
```

Escrever histórias e critérios suficientemente precisos para permitir a decomposição em tickets. Cobrir, quando aplicável, permissões, acessibilidade, auditoria, observabilidade, consistência, retries, estados de processamento e comportamento de integração.

Após criar a PRD, informar o caminho, o escopo documentado, as decisões registradas e as suposições relevantes.

## Fase 4 — Propor tickets verticais

Ler a PRD recém-criada e montar uma proposta antes de criar qualquer ticket. Cada ticket deve:

- atravessar as camadas necessárias para entregar um comportamento verificável;
- ser pequeno o bastante para implementar e validar isoladamente;
- ter resultado demonstrável ou testável;
- cobrir histórias e critérios específicos;
- declarar dependências reais;
- ser classificado como `HITL` quando exigir decisão, revisão ou julgamento humano, ou `AFK` quando puder ser implementado com as informações disponíveis.

Preferir fatias como “usuário cria e lista workspace” ou “comentário simulado dispara resposta pública” a tickets horizontais como “criar todas as entidades” ou “configurar todo o backend”. Um ticket horizontal só é permitido quando produzir um comportamento ou contrato verificável por si só.

Apresentar a proposta numerada com:

- título;
- tipo `HITL` ou `AFK`;
- dependências;
- histórias cobertas;
- breve descrição do comportamento entregue.

Pedir aprovação da granularidade, dependências, classificações e autorização para criar os arquivos. Não criar tickets antes dessa aprovação, exceto quando o usuário disser explicitamente que uma decomposição já aprovada deve ser executada.

## Fase 5 — Criar tickets locais

Depois da aprovação, criar os tickets em `docs/tickets/`, em ordem de dependência. Determinar o próximo número lendo os arquivos existentes e continuar do maior número. Nunca sobrescrever ticket existente.

Usar nomes `NNN-slug-do-ticket.md`, com slug ASCII lowercase e hífens.

Cada ticket deve ter este frontmatter:

```yaml
---
title: "Título curto"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/feature.md"
blocked_by: []
user_stories: [1, 2]
---
```

Usar caminhos relativos ao repositório em `parent` e `blocked_by`. Usar `parent: "conversation"` somente quando não existir fonte ou PRD em arquivo.

Usar este corpo mínimo:

```markdown
## Parent

Referência à PRD de origem e aos requisitos cobertos.

## What to build

Comportamento end-to-end da fatia vertical.

## Acceptance criteria

- [ ] Critério observável 1
- [ ] Critério observável 2
- [ ] Testes e validações necessários

## Blocked by

Tickets locais necessários antes, ou `None - can start immediately`.

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
```

Manter os corpos concisos e orientados à implementação. Não modificar a PRD, `REQUIREMENTS.md`, `ARCHITECTURE.md` ou `DATA-MODEL.md` para criar tickets.

## Fase 6 — Verificar a saída

Antes de finalizar:

1. Confirmar que a PRD existe e cobre a fonte selecionada.
2. Confirmar que todas as decisões bloqueadoras foram respondidas.
3. Confirmar que cada ticket tem frontmatter válido e `status: "needs-triage"`.
4. Confirmar numeração única, dependências existentes e ordem coerente.
5. Confirmar rastreabilidade de histórias e critérios para tickets.
6. Confirmar ausência de tickets horizontais sem comportamento verificável.
7. Se `graphify-out/` existir, executar `graphify update .` após alterações documentais para manter o grafo atualizado.

Não criar GitHub Issues, labels ou registros em trackers remotos. Reportar arquivos criados, decisões assumidas, bloqueios e validações executadas.
