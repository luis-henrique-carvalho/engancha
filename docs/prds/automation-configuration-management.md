# Gestão de configuração de automações

## Source and Traceability

Esta PRD cobre a primeira entrega de `EPIC-03` da Fase 3: `FR-AUTO-001` a `FR-AUTO-008` e `FR-AUTO-010` a `FR-AUTO-014`, além de `RN-001`, `RN-002`, `RN-003`, `RN-006` e `RN-008`. Ela preserva os contratos de provider/mode e a fronteira API → worker definidos na arquitetura. `FR-AUTO-009` fica preparado no modelo, mas sua experiência e execução ficam fora deste recorte.

As decisões `DEC-01` a `DEC-08` foram resolvidas durante a descoberta desta PRD. `DEC-09` registra a adoção do conteúdo simulado mínimo necessária para que uma automação seja vinculada a um conteúdo concreto antes da integração real.

## Problem Statement

Um criador ou pequeno negócio precisa preparar, revisar e controlar uma resposta automatizada para um conteúdo específico sem depender de uma integração real com a Meta. O produto ainda não possui uma configuração persistente que associe, de modo seguro e versionável, o conteúdo-alvo, a palavra-chave e as ações que serão executadas.

Sem esse agregado, o simulador futuro não terá uma configuração confiável para consultar e o usuário não conseguirá evoluir uma automação ativa sem correr o risco de alterar silenciosamente o fluxo já publicado.

## Goal and Scope

O objetivo é permitir que um membro confirmado crie, liste, edite, publique e pause automações do workspace ativo. Cada automação deve ter exatamente um conteúdo-alvo, um gatilho de comentário por palavra-chave e uma sequência publicável de resposta pública, DM e uma ação final de link ou captura de e-mail.

Incluído:

- persistência, migration e regras do agregado de automação;
- conteúdo simulado mínimo e conteúdo-alvo genérico, preparados para providers futuros;
- rascunhos, revisões, publicação, pausa e listagem escopada por Organization;
- contratos REST e validações de entrada e saída;
- formulário guiado, revisão, feedback de validação e estados acessíveis no web;
- preservação imutável de versões publicadas, sem tela de histórico nesta fase.

Não incluído:

- ingestão, matching em execução, jobs, worker ou envio de mensagens;
- conversas, contatos, leads, métricas e aplicação de tags;
- conexão, catálogo ou leitura de conteúdo de providers reais;
- múltiplos conteúdos por automação, priorização de automações ou execução de múltiplos matches;
- exclusão física, tela de arquivamento, restauração de versões ou RBAC granular.

Sucesso é um usuário conseguir criar um rascunho incompleto, completar uma revisão válida, publicá-la para um conteúdo simulado e depois pausá-la, sem acessar ou alterar automações de outro workspace.

## Actors and Permissions

- Membro confirmado: cria, lista, edita, publica e pausa automações no workspace ativo.
- Workspace/Organization: é a fronteira obrigatória de todo dado de produto. O identificador recebido do browser nunca autoriza uma operação.
- Owner, admin e member têm a mesma permissão para automações no MVP. RBAC específico será adicionado posteriormente.
- Sessão ausente, e-mail não confirmado, contexto ativo ausente ou membership inválido impede toda operação de produto.

## User Stories

1. As a confirmed workspace member, I want to list the automations in my active workspace, so that I can find their current state and configuration.
2. As a confirmed workspace member, I want to create an incomplete automation draft, so that I can configure it progressively.
3. As a confirmed workspace member, I want to associate an automation with one simulated content item, so that the future interaction applies to the intended post-like content.
4. As a confirmed workspace member, I want to configure a keyword, public reply, DM and one final action, so that the automation is ready for publication.
5. As a confirmed workspace member, I want to edit an active automation as an unpublished revision, so that the live configuration remains stable until I explicitly publish again.
6. As a confirmed workspace member, I want to publish or pause an automation, so that only deliberate configurations can receive future interactions.

## Functional Behavior

1. A criação gera uma `Automation` pertencente ao workspace ativo, em `DRAFT`, e sua primeira revisão editável. Nome, alvo, gatilho e ações podem estar ausentes no rascunho.
2. O formulário associa a automação a exatamente um conteúdo simulado do workspace. Cada conteúdo informa um título de exibição, provider, mode, tipo de conteúdo e identificador estável. Nesta fase, a UI aceita apenas `INSTAGRAM` e `SIMULATED`.
3. O gatilho é `COMMENT_KEYWORD`. A palavra original é preservada para exibição; a forma normalizada é usada para validação e, futuramente, matching.
4. Uma revisão publicável contém, nesta ordem, uma resposta pública obrigatória, uma DM obrigatória e exatamente uma ação final: `LINK` ou `CAPTURE_EMAIL`. A sequência permanece modelada como ações ordenadas e extensíveis; tipos futuros não podem ser usados até ganharem schema e suporte de execução.
5. A revisão mostra um resumo acessível antes de publicar. Publicar falha com erros por campo quando nome, alvo, gatilho ou sequência obrigatória estiverem ausentes ou inválidos.
6. A primeira publicação torna a automação `ACTIVE`. Ao editar uma automação ativa, o sistema cria ou reutiliza uma revisão em rascunho baseada na versão publicada; ela não altera a versão que está ativa. Uma nova publicação promove somente essa revisão e conserva as versões publicadas anteriores imutáveis.
7. Pausar altera a automação para `PAUSED` e preserva sua última versão publicada. Retomar, arquivar, restaurar e excluir não fazem parte desta PRD.
8. A lista mostra nome, estado, palavra-chave da versão relevante, conteúdo-alvo, atualização e contagens de execução/lead iguais a zero até que as entidades de execução existam. Rascunhos e alterações não publicadas são identificáveis sem serem apresentadas como ativas.
9. O sistema rejeita a publicação de duas automações ativas com a mesma combinação de conteúdo-alvo e palavra-chave normalizada. Rascunhos podem repetir a combinação; a verificação é feita no servidor, dentro da operação de publicação.
10. A normalização do gatilho elimina variações de caixa, acentos, hífens e espaços extras e usa correspondência de palavra ou frase inteira. O algoritmo exato será compartilhado entre a futura ingestão e esta validação, sem expor comportamento específico de provider.

## Domain Rules and Data

O agregado separa a identidade da automação de suas configurações versionadas:

```text
Automation
├── organizationId
├── createdByUserId
├── status: DRAFT | ACTIVE | PAUSED | ARCHIVED
├── currentPublishedRevision
└── currentDraftRevision?

AutomationRevision
├── automationId
├── version
├── state: DRAFT | PUBLISHED
├── AutomationTarget (exactly one)
├── AutomationTrigger (exactly one)
└── AutomationAction[] (ordered)

Content
└── organizationId, provider, mode, contentType, stable content identifier, title
```

- Uma `Automation` e um `Content` nunca existem sem `organizationId`.
- Toda revisão publicada é imutável. Há no máximo uma revisão em rascunho editável por automação.
- Uma revisão em rascunho pode ser incompleta; uma publicada não.
- O conteúdo-alvo é um conceito normalizado, não um campo `instagramPostId`. No modo real, ele poderá referenciar uma `ChannelConnection` e um identificador externo fornecido pelo adapter.
- A revisão publicada é a única configuração disponível para futuras execuções. Execuções posteriores registrarão um snapshot da revisão publicada que as iniciou.
- O modelo mantém `APPLY_TAG` no catálogo extensível, mas não aceita essa ação para publicação nesta fase porque não há tag ou contato para receber a aplicação.
- Os campos de texto usam limites técnicos padrão do produto: nome até 80 caracteres; palavra-chave até 120; resposta pública e DM até 1.000; URL até 2.048; rótulo de link até 80; pergunta de captura de e-mail até 300.
- Não há unicidade para o nome da automação. A unicidade de gatilho é aplicada somente na publicação, para o mesmo conteúdo-alvo e workspace.
- Registros de automação e revisão não sofrem delete físico no MVP.

## Contracts and Integrations

Os endpoints protegidos permanecem sob `/api/v1/automations`:

- `GET /`: lista as automações do contexto ativo;
- `POST /`: cria o rascunho inicial;
- `GET /:id`: retorna somente a automação do contexto ativo, incluindo revisão publicada e eventual revisão em rascunho autorizada;
- `PATCH /:id`: atualiza a revisão em rascunho;
- `POST /:id/publish`: valida e promove a revisão em rascunho;
- `POST /:id/pause`: pausa a automação ativa.

Os contratos em `packages/contracts` usam schemas Zod para a entrada e a saída serializada. Controllers validam e delegam; o módulo de automações concentra regras de aplicação, autorização contextual e transações. Nenhum job é produzido nesta fase.

O conteúdo simulado é uma dependência local de produto, não uma simulação de API externa. A Fase 4 deverá receber o mesmo identificador de conteúdo no evento normalizado. Providers reais continuarão a passar por adapters e capabilities, sem criar outro motor de automação.

## Acceptance Criteria

- [ ] Um membro confirmado cria e retoma uma automação incompleta somente no workspace ativo.
- [ ] Cada automação publicada aponta para exatamente um conteúdo simulado do mesmo workspace.
- [ ] Uma publicação aceita apenas gatilho de comentário, resposta pública, DM e uma ação final válida de link ou captura de e-mail, na ordem definida.
- [ ] Palavras-chave são normalizadas e duas automações ativas não podem publicar a mesma combinação de conteúdo e gatilho no mesmo workspace.
- [ ] Editar uma automação ativa preserva a versão ativa e cria uma revisão que só produz efeito depois de nova publicação.
- [ ] Versões publicadas anteriores permanecem consultáveis pelo domínio e não são alteradas por edição futura.
- [ ] Pausar uma automação ativa impede seu uso futuro pela Fase 4, preservando seus dados e versão publicada.
- [ ] Toda leitura e mutação ignora ou retorna `404` para automações de outro workspace, sem confiar em `organizationId` enviado pelo browser.
- [ ] A interface apresenta lista, criação/edição guiada, revisão, loading, erros por campo, sucesso e controles acessíveis de publicar/pausar.
- [ ] Testes cobrem o agregado, migration, autorização multi-tenant, contratos, transições de revisão/publicação/pausa e o percurso web de rascunho até publicação.

## Implementation Decisions

- O backend adiciona um módulo de automações ao modular monolith; repositories encapsulam Prisma e a camada de aplicação encapsula transações de criação, revisão e publicação.
- A criação de uma revisão e sua promoção devem ser transacionais. A publicação revalida o agregado completo e a ausência de conflito de gatilho no instante da escrita.
- A autorização usa exclusivamente o `AuthorizationContext` existente; services e repositories recebem o contexto resolvido, não um `organizationId` arbitrário.
- Schemas Zod dos contratos e schemas de configuração das ações são a fonte de validação compartilhada. Campos `Json` não são persistidos sem schema estrito correspondente ao tipo da ação.
- A feature web segue `views/`, `components/`, `hooks/`, `services/` e `data/`. Rotas não chamam HTTP diretamente; queries, mutations, chaves e invalidações permanecem no domínio da feature.
- A interface adapta apenas padrões necessários da referência local shadcn-admin: tabela/lista, sidebar, estados de formulário e diálogo de confirmação. Não importa runtime ou dependências da referência.
- Logs estruturados incluem `requestId`, `userId`, `organizationId`, `automationId` e `revisionId` quando disponíveis, sem conteúdo de DM, URL de ação final ou outros dados desnecessários.

## Testing Decisions

- Testes unitários, em abordagem TDD, para normalização, validação da sequência de ações, transições de estado e imutabilidade de versões publicadas.
- Testes de integração com Prisma para relations, índices, transações, conflito de gatilho e escopo por Organization.
- Testes de contrato para payloads inválidos, respostas serializadas e limites de cada configuração.
- Testes de API para sessão ausente, e-mail não confirmado, contexto ativo ausente, membership inválido, acesso cruzado e transições autorizadas.
- Testes de web para rascunho, retomada, revisão, erro de publicação, sucesso, pausa e tratamento de alterações não publicadas.
- Typecheck, lint, formatter e testes do workspace são gates da entrega.

## Out of Scope

- Processar comentários, produzir jobs ou chamar providers de saída.
- Receber webhooks, conectar contas, listar posts reais ou implementar OAuth da Meta.
- Persistir `AutomationExecution`, conversa, mensagem, contato, lead, tag ou métricas.
- Aplicar tags, capturar um e-mail efetivo ou entregar um link.
- Permitir uma automação em vários conteúdos, configurar prioridades ou permitir matches concorrentes.
- Adicionar RBAC, auditoria visível, arquivo/restauração ou exclusão de automações.

## Decision Log

| ID | Decision | Status | Impact | Date |
| --- | --- | --- | --- | --- |
| DEC-01 | A ação final atual é exatamente uma: `LINK` ou `CAPTURE_EMAIL`; o modelo de ações permanece extensível. | RESOLVIDA | Evita CTAs concorrentes sem bloquear novos tipos futuros. | 2026-08-18 |
| DEC-02 | Tags ficam preparadas no domínio, mas não são configuradas ou executadas nesta PRD. | RESOLVIDA | Evita configuração sem contato/lead onde aplicá-la. | 2026-08-18 |
| DEC-03 | Gatilho usa palavra/frase inteira normalizada, ignorando caixa, acentos, hífens e espaços extras. | RESOLVIDA | Reduz falsos positivos e define o contrato futuro de matching. | 2026-08-18 |
| DEC-04 | Nome tem até 80 caracteres e pode repetir no workspace. | RESOLVIDA | Mantém o nome como rótulo, sem conflitos artificiais. | 2026-08-18 |
| DEC-05 | Todo membro confirmado pode gerir automações do workspace ativo no MVP. | RESOLVIDA | Simplifica colaboração; RBAC permanece evolutivo. | 2026-08-18 |
| DEC-06 | Edição de automação ativa ocorre em revisão de rascunho e exige publicação explícita. | RESOLVIDA | Configuração ativa permanece estável durante a edição. | 2026-08-18 |
| DEC-07 | Versões publicadas são imutáveis e preservadas; histórico/rollback visual ficam posteriores. | RESOLVIDA | Garante rastreabilidade e prepara recuperação futura. | 2026-08-18 |
| DEC-08 | Uma automação possui um único conteúdo-alvo genérico, pronto para providers futuros. | RESOLVIDA | Permite a mesma palavra-chave em conteúdos distintos sem acoplamento ao Instagram. | 2026-08-18 |
| DEC-09 | Adotar conteúdo simulado mínimo para tornar o vínculo por conteúdo utilizável antes da integração real. | ACEITA COMO PADRÃO | A Fase 4 terá um alvo persistido para os comentários simulados. | 2026-08-18 |

## Further Notes

- A introdução de revisões e de conteúdo-alvo atualiza o modelo lógico aprovado: `AutomationTrigger` e `AutomationAction` passam a pertencer a uma revisão, e não diretamente à identidade da automação. A migration e a documentação de modelo devem registrar essa evolução antes da implementação.
- A associação a `ChannelConnection`, o catálogo de capabilities por provider, posts reais e os limites específicos de cada provider permanecem para a integração real.
- O estado `ARCHIVED` é preservado no enum para evolução, mas não possui endpoint ou interface nesta entrega.
- A contagem de execuções e leads será zero até as entidades das Fases 4 e 5 existirem; nenhuma métrica derivada será persistida antecipadamente.
