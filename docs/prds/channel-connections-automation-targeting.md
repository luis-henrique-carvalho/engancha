# Conexões de canais e direcionamento de automações

## Source and Traceability

Esta PRD consolida a evolução de `EPIC-03` e prepara `EPIC-09`. Ela cobre `FR-META-001` a `FR-META-003`, `FR-META-009`, `FR-META-010`, `FR-CHANNEL-001` a `FR-CHANNEL-009`, `RN-001`, `RN-003`, `RN-007` a `RN-010` e complementa `FR-AUTO-002`, `FR-AUTO-011`, `FR-AUTO-012` e `FR-AUTO-014`.

A fonte imediata é a decisão do usuário, em 27/08/2026, de separar plataforma, conexão externa e alvo da automação. As decisões `DEC-01` a `DEC-09` abaixo fecham a regra antes adiada no `DATA-MODEL.md` sobre como uma revisão de automação se associa a uma `ChannelConnection`.

## Problem Statement

O modelo atual distingue provider e modo de execução e já normaliza conteúdos, mas ainda não identifica por qual conta externa uma automação real receberá eventos e enviará respostas. `provider=INSTAGRAM` não é suficiente quando um workspace possui mais de uma conta profissional conectada.

Sem uma conexão explícita no alvo da revisão, conteúdo, credenciais, webhooks, conflitos de gatilho e métricas podem ser associados à conta errada. Também não existe uma fronteira de módulo explícita para administrar conexões e expor conteúdos normalizados aos demais domínios.

## Goal and Scope

O objetivo é permitir que um workspace administre conexões externas e que cada revisão de automação real aponte para exatamente uma conexão ativa e um conteúdo pertencente a ela, sem acoplar o motor de automações à Meta ou exigir uma conexão fictícia no modo simulado.

Incluído:

- domínio `Channels` para conexões, catálogo de providers, capabilities e conteúdos normalizados;
- `ChannelConnection` pertencente a uma Organization;
- relação opcional de `Content` com `ChannelConnection`;
- relação opcional e explícita de `AutomationTarget` com `ChannelConnection`;
- seleção de conexão antes do conteúdo no editor de automações reais;
- opção virtual “Instagram — Simulador” para o fluxo simulado;
- validações de workspace, provider, modo, estado da conexão e pertencimento do conteúdo;
- impacto de migração sobre o schema, API, backend e frontend existentes.

Não incluído:

- implementação do OAuth, webhook ou envio real pela Meta nesta PRD de planejamento;
- suporte simultâneo a várias conexões em uma mesma revisão;
- transferência automática de uma conta externa entre workspaces;
- unificação de métricas, contatos ou identidades entre providers;
- armazenamento de conexões simuladas na tabela `channel_connection`.

O sucesso é uma automação real possuir roteamento inequívoco até uma única conta conectada, enquanto automações simuladas existentes continuam válidas sem backfill artificial de conexão.

## Actors and Permissions

- Membro confirmado: visualiza conexões disponíveis e usa uma conexão ativa na configuração de automações, conforme a política de permissões do workspace.
- Owner/admin do workspace: conecta, renova e desconecta contas externas. A permissão granular pode evoluir, mas nenhum usuário pode administrar conexão de outro workspace.
- Organization: proprietária de `ChannelConnection`, `Content` e `Automation`; todas as relações são validadas no backend pelo contexto ativo.
- Provider externo: autentica a conta, fornece conteúdos e entrega eventos por adapters isolados.
- Worker: resolve a conexão registrada no snapshot da execução sem receber tokens pelo job.

## User Stories

1. As a workspace owner or admin, I want to connect and inspect an external channel account, so that the workspace can use it safely.
2. As a confirmed member, I want to see only active connections from my current workspace, so that I cannot select another tenant's account.
3. As a confirmed member, I want to select one connection before selecting its content, so that the automation has an unambiguous destination.
4. As a confirmed member, I want the editor and simulator to show available providers without requiring OAuth, so that the simulated MVP remains usable and can evolve beyond Instagram.
5. As a confirmed member, I want publication to reject an inactive or inconsistent connection/content pair, so that a broken automation never becomes active.
6. As an operator, I want executions to preserve connection, provider and mode in their snapshot, so that routing and diagnostics remain traceable.

## Functional Behavior

1. A página de integrações lista as conexões do workspace ativo com provider, nome de exibição, identificador público apropriado, estado e expiração quando aplicável. Tokens nunca são retornados.
2. Conectar uma conta real cria ou atualiza uma `ChannelConnection` somente após o adapter validar identidade, permissões e escopos. Uma mesma conta externa não pode ficar ativa em dois workspaces sem transferência explícita.
3. O editor mantém a criação inicial de rascunho incompleto. Na etapa de alvo, o usuário escolhe primeiro uma conexão disponível e depois um conteúdo pertencente a ela.
4. Alterar a conexão limpa qualquer conteúdo selecionado que não pertença à nova conexão e exige nova seleção antes da publicação.
5. Cada `AutomationRevision` possui no máximo um `AutomationTarget`; cada alvo publicado aponta para exatamente um conteúdo e, no modo real, para exatamente uma conexão.
6. Uma revisão real somente pode ser publicada quando a conexão está `ACTIVE`, pertence ao mesmo workspace, possui o mesmo provider do conteúdo e suporta as ações configuradas.
7. No modo simulado, o editor e o simulador apresentam os providers disponíveis como opções virtuais; inicialmente, apenas `Instagram` é disponibilizado. O usuário escolhe o provider, mas não escolhe o modo: `Content.mode=SIMULATED` é imposto pelo backend. `Content.channelConnectionId=null` e `AutomationTarget.channelConnectionId=null`; nenhuma credencial ou linha de conexão fictícia é criada.
8. Desconectar, expirar ou revogar uma conexão impede novas publicações e novas execuções reais. Revisões publicadas e execuções antigas permanecem consultáveis; a política de pausa automática da automação será decidida no ticket de implementação do lifecycle.
9. Editar a conexão ou o conteúdo de uma automação ativa ocorre somente em nova revisão de rascunho. A revisão publicada continua imutável até nova publicação.
10. Para aplicar a mesma configuração a duas contas, o usuário cria ou duplica outra automação. Uma revisão não distribui eventos ou ações para múltiplas conexões.

## Domain Rules and Data

```text
Organization
├── ChannelConnection[]
│   └── Content[]
└── Automation[]
    └── AutomationRevision[]
        └── AutomationTarget
            ├── channelConnectionId?
            └── contentId
```

- `Provider` é vocabulário controlado do sistema e identifica o adapter; não é cadastro realizado pelo usuário.
- `ChannelConnection` representa somente uma conta externa real e não possui `mode`.
- `Content` preserva `provider` e `mode`. Conteúdo real exige `channelConnectionId`; conteúdo simulado exige `channelConnectionId=null`.
- `AutomationTarget.channelConnectionId` é explícito para tornar a decisão da revisão e seu roteamento auditáveis. No modo real, deve ser igual a `Content.channelConnectionId`; no simulado, deve ser nulo.
- Provider, modo, conexão e conteúdo devem pertencer ao mesmo contexto lógico. A aplicação valida a invariância antes de persistir e novamente ao publicar.
- Uma conexão pertence a exatamente uma Organization. O identificador externo global não pode estar conectado simultaneamente a organizações diferentes.
- Credenciais são criptografadas no backend, nunca serializadas para o frontend ou incluídas em eventos, jobs e logs.
- O snapshot de execução preserva `provider`, `mode`, `channelConnectionId`, identidade do conteúdo e versão da automação, mas não credenciais.
- Conteúdos reais são únicos dentro da conexão e do tipo de conteúdo. Conteúdos simulados continuam únicos no workspace pelo identificador controlado pelo sistema.
- Dados existentes de `Content` e `AutomationTarget` são simulados e permanecem com `channelConnectionId=null`; não haverá criação de conexões artificiais no backfill.

## Contracts and Integrations

Contratos genéricos futuros sob `/api/v1/channel-connections`:

- listar conexões visíveis no workspace ativo;
- obter detalhes sanitizados de uma conexão;
- iniciar/concluir o fluxo de conexão por provider;
- renovar ou revalidar uma conexão;
- desconectar uma conexão;
- listar conteúdos normalizados da conexão.

O callback OAuth pode possuir rota específica do adapter, mas deve entregar o resultado ao caso de uso de `Channels`; controllers e serviços de automação não manipulam payload, token ou erro específico da Meta.

`Automations` consome portas de consulta do domínio `Channels` para resolver conexão, conteúdo e capabilities. `Channels` não depende de `Automations`. `Simulation` produz conteúdo e eventos simulados usando os contratos normalizados, sem persistir `ChannelConnection`.

Os endpoints existentes de automação permanecem estáveis. O contrato de patch do alvo passa a aceitar a seleção de conexão quando `mode=REAL`; respostas de revisão incluem uma projeção sanitizada da conexão escolhida.

## Acceptance Criteria

- [ ] Provider é tratado como catálogo técnico; contas cadastradas pelo usuário são representadas por `ChannelConnection` pertencente ao workspace.
- [ ] Um workspace pode possuir várias conexões do mesmo provider, e cada conexão expõe estado sanitizado sem tokens.
- [ ] Uma revisão possui no máximo um alvo e uma automação real publicada aponta para uma única conexão ativa e um conteúdo dessa conexão.
- [ ] Trocar a conexão invalida um conteúdo incompatível e a publicação rejeita relações entre workspaces, providers ou modos diferentes.
- [ ] O simulador continua disponível sem OAuth, sem credenciais e sem registro fictício em `channel_connection`.
- [ ] Edição de alvo em automação ativa cria ou reutiliza uma revisão de rascunho e não altera a revisão publicada.
- [ ] Execuções reais preservam `channelConnectionId` e identidade do conteúdo no snapshot, sem copiar credenciais.
- [ ] A migração mantém conteúdos e alvos simulados existentes com conexão nula e sem alteração de comportamento.
- [ ] Contratos, logs e respostas nunca expõem tokens ou metadados secretos do provider.
- [ ] Testes cobrem isolamento por Organization, inconsistências de provider/modo/conexão, lifecycle da conexão, publicação e regressão do modo simulado.

## Implementation Decisions

- Criar um módulo de domínio `Channels` no modular monolith. Ele será proprietário de conexões, catálogo de providers, capabilities e acesso ao catálogo normalizado de conteúdo.
- Mover gradualmente o registry/provider atualmente localizado em `Automations` para `Channels`; `Automations` dependerá de portas, não de `InstagramContentProvider` concreto.
- Adicionar `ChannelConnection` ao schema e relações opcionais em `Content` e `AutomationTarget`. Constraints condicionais de modo serão aplicadas por validação transacional e, quando adequado, por checks/índices SQL da migration.
- Resolver e validar conexão e conteúdo no backend usando `AuthorizationContext`; IDs enviados pelo browser nunca constituem autorização.
- Manter uma conexão por revisão. Uma futura distribuição multi-conta exigirá outro conceito de deployment/binding, sem transformar esta relação em N:N antecipadamente.
- Manter a seleção simulada de provider como uma projeção de UI/contrato, não como entidade persistida. O backend impõe `mode=SIMULATED` em toda criação de simulação.
- Dividir entrega em fatias verticais: fundação de conexão, consulta segura, seleção no editor, publicação e lifecycle/execução.

## Testing Decisions

- Testes unitários para invariantes entre provider, mode, conexão, conteúdo e target.
- Testes de integração Prisma/PostgreSQL para relações, unicidade, isolamento, migration e backfill nulo.
- Testes de contrato para respostas sanitizadas, IDs inválidos e estados de conexão.
- Testes de API para acesso cruzado, conexão inexistente/inativa e publicação concorrente.
- Testes web para ausência de conexões, seleção/troca de conta, carregamento de conteúdos, expiração e opção simulada.
- Testes de adapters por contrato compartilhado; chamadas reais ficam restritas a smoke tests credenciados.

## Out of Scope

- Facebook, Twitter/X ou outro provider real além do primeiro adapter Meta.
- Uma automação publicada simultaneamente em múltiplas contas ou conteúdos.
- Transferência self-service de conta externa entre workspaces.
- Cofre externo de segredos, rotação automática universal ou catálogo versionado definitivo de capabilities.
- Importação histórica completa de conteúdo, comentários ou mensagens.
- Alteração imediata do código existente durante esta etapa documental.

## Decision Log

| ID | Decision | Status | Impact | Date |
| --- | --- | --- | --- | --- |
| DEC-01 | `Provider` é catálogo técnico; o usuário cadastra `ChannelConnection`, não plataformas. | RESOLVIDA | Evita entidades de plataforma duplicadas e mantém adapters controlados pelo sistema. | 2026-08-27 |
| DEC-02 | O domínio será `Channels`; `Account` permanece reservado ao Better Auth. | RESOLVIDA | Evita colisão de linguagem entre autenticação e integração externa. | 2026-08-27 |
| DEC-03 | `ChannelConnection` representa apenas conexão real e pertence a uma Organization. | RESOLVIDA | Mantém OAuth e credenciais fora do modo simulado e garante isolamento. | 2026-08-27 |
| DEC-04 | Cada revisão possui no máximo uma conexão, registrada em `AutomationTarget`. | RESOLVIDA | Torna o roteamento versionado e elimina ambiguidade entre contas do mesmo provider. | 2026-08-27 |
| DEC-05 | `Content` também referencia a conexão real que o forneceu. | RESOLVIDA | Permite filtrar conteúdo por conta e validar a coerência do alvo. | 2026-08-27 |
| DEC-06 | O modo simulado usa opção virtual e conexão nula. | RESOLVIDA | Preserva o MVP sem inventar credenciais ou contas externas. | 2026-08-27 |
| DEC-07 | Uma revisão não suporta múltiplas conexões; o usuário duplica a automação. | RESOLVIDA | Evita complexidade prematura em conflitos, métricas e lifecycle. | 2026-08-27 |
| DEC-08 | Publicação real exige conexão ativa, mesmo workspace, mesmo provider e conteúdo pertencente à conexão. | RESOLVIDA | Impede configurações publicadas sem rota executável. | 2026-08-27 |
| DEC-09 | Registros simulados existentes permanecem com conexão nula na migração. | ACEITA COMO PADRÃO | Mantém compatibilidade sem backfill artificial. | 2026-08-27 |
| DEC-10 | O simulador permite selecionar provider, mas sempre impõe `mode=SIMULATED` no backend. | RESOLVIDA | Prepara a interface para novos providers sem permitir uma simulação ser confundida com execução real. | 2026-08-27 |

## Further Notes

- O código atual ainda não possui `ChannelConnection`, relações de conexão em `Content`/`AutomationTarget`, módulo `Channels`, endpoints de integração ou etapa de seleção de conta. Esses itens são trabalho futuro e não devem ser inferidos como implementados pela atualização documental.
- O `InstagramContentProvider` atual funciona apenas como capability gate dentro de `Automations`; ele deverá migrar para a fronteira `Channels` antes da integração real.
- A reação automática a uma conexão que expira ou é desconectada precisa ser fechada na implementação: a recomendação é bloquear novas execuções imediatamente e apresentar a automação como “requer atenção”, preservando seu status e revisão para recuperação após reconexão.
- O catálogo definitivo/versionado de capabilities e a estratégia de rotação/recriptografia de tokens continuam adiados, sem alterar as invariantes desta PRD.
- Os tickets serão criados somente depois da aprovação da decomposição proposta.
