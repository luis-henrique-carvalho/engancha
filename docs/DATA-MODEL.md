# Engancha — Modelo de Dados

> Versão: 0.3
> Status: aprovado para implementação  
> Referências: [ARCHITECTURE.md](./ARCHITECTURE.md) · [REQUIREMENTS.md](./REQUIREMENTS.md)

## 1. Objetivo

Este documento define o modelo lógico de dados do Engancha e orienta a evolução versionada do `schema.prisma` e de suas migrations.

O modelo precisa atender três objetivos ao mesmo tempo:

1. suportar o MVP simulado;
2. garantir isolamento por Organization do Better Auth;
3. permitir adicionar Instagram/Meta real e providers futuros sem reescrever automações, conversas e execuções.

## 2. Princípios

- PostgreSQL é a fonte de verdade dos dados do produto.
- Redis armazena filas, cache e dados temporários; não é fonte de verdade.
- Todas as entidades de negócio pertencem a uma `organization`.
- `organizationId` nunca é suficiente para autorizar uma operação; o membership da sessão deve ser validado.
- IDs internos serão UUIDs gerados pela aplicação/banco.
- IDs externos de providers serão armazenados separadamente dos IDs internos.
- `provider` identifica a plataforma e `mode` identifica `SIMULATED` ou `REAL`; os dois conceitos nunca serão combinados em um único enum.
- O domínio persistirá contratos normalizados; payloads e regras específicas de cada provider ficarão nos adapters de canal.
- A publicação e a execução de ações deverão respeitar as capacidades declaradas pelo provider.
- Dados de execução devem ser imutáveis depois da conclusão.
- Payloads flexíveis ficam em `Json`, mas sempre são validados por schemas Zod antes de persistir.
- As tabelas do Better Auth/Organization Plugin serão tratadas como infraestrutura de autenticação.

## 3. Separação entre autenticação e produto

### Tabelas gerenciadas pelo Better Auth

O Better Auth será responsável pelas tabelas abaixo, incluindo as tabelas adicionadas pelo Organization Plugin:

```text
user
session
account
verification
organization
member
invitation
```

Os nomes e campos finais devem ser gerados/confirmados pelo Better Auth CLI e pelo adapter Prisma. Não devemos duplicar `organization`, `member` ou `user` em tabelas próprias.

### Tabelas do produto

```text
automation
automation_revision
automation_target
automation_trigger
automation_action
content
automation_execution
conversation
message
contact
lead
tag
contact_tag
external_event
channel_connection
```

`channel_connection` e `external_event` ficam preparados para o Instagram real e para providers futuros, mas podem permanecer sem uso no primeiro vertical slice. `account` continua sendo infraestrutura do Better Auth; contas externas do produto usam exclusivamente `channel_connection`.

## 4. Diagrama lógico

```mermaid
erDiagram
  ORGANIZATION ||--o{ AUTOMATION : owns
  ORGANIZATION ||--o{ CONTENT : owns
  ORGANIZATION ||--o{ CONVERSATION : owns
  ORGANIZATION ||--o{ CONTACT : owns
  ORGANIZATION ||--o{ TAG : owns
  ORGANIZATION ||--o{ CHANNEL_CONNECTION : owns
  ORGANIZATION ||--o{ EXTERNAL_EVENT : receives

  AUTOMATION ||--o{ AUTOMATION_REVISION : versions
  AUTOMATION_REVISION ||--o| AUTOMATION_TARGET : targets
  AUTOMATION_REVISION ||--o| AUTOMATION_TRIGGER : triggers
  AUTOMATION_REVISION ||--o{ AUTOMATION_ACTION : contains
  AUTOMATION ||--o{ AUTOMATION_EXECUTION : creates
  CONTENT ||--o{ AUTOMATION_TARGET : selected_by

  AUTOMATION_EXECUTION ||--o{ MESSAGE : produces
  AUTOMATION_EXECUTION }o--|| CONVERSATION : belongs_to
  AUTOMATION_EXECUTION }o--o| CONTACT : concerns

  CONVERSATION ||--o{ MESSAGE : contains
  CONTACT ||--o{ CONVERSATION : participates
  CONTACT ||--o| LEAD : becomes
  CONTACT ||--o{ CONTACT_TAG : has
  TAG ||--o{ CONTACT_TAG : applies
  CHANNEL_CONNECTION ||--o{ CONVERSATION : serves
  CHANNEL_CONNECTION ||--o{ CONTACT : identifies
  CHANNEL_CONNECTION ||--o{ EXTERNAL_EVENT : sources
  CHANNEL_CONNECTION ||--o{ CONTENT : provides
  CHANNEL_CONNECTION ||--o{ AUTOMATION_TARGET : routes
```

## 5. Entidades

### 5.1 Organization

Gerenciada pelo Better Auth Organization Plugin. Representa o workspace exibido no produto.

Campos relevantes para o domínio:

```text
id          String   PK
name        String
slug        String   UNIQUE
logo        String?
metadata    Json?
createdAt   DateTime
```

Relações:

```text
organization 1:N automation
organization 1:N content
organization 1:N conversation
organization 1:N contact
organization 1:N tag
organization 1:N channel_connection
organization 1:N external_event
```

### 5.2 Content

Conteúdo normalizado que pode receber interações e servir como alvo de uma automação. O mesmo conceito representa conteúdo simulado e conteúdo descoberto por um adapter real.

```text
id                    UUID       PK
organizationId        String     FK → organization.id
channelConnectionId   UUID?      FK → channel_connection.id
provider              Enum       INSTAGRAM | FACEBOOK | TWITTER
mode                  Enum       SIMULATED | REAL
contentType           Enum       POST | REEL | VIDEO
title                 String
externalContentId     String
createdAt             DateTime
updatedAt             DateTime
```

Regras:

- conteúdo real exige `channelConnectionId` e deve usar o mesmo provider da conexão;
- conteúdo simulado exige `channelConnectionId=null`;
- conexão e conteúdo pertencem à mesma Organization;
- conteúdos simulados existentes permanecem com conexão nula.

Constraints lógicas:

```text
REAL:      UNIQUE (channelConnectionId, contentType, externalContentId)
SIMULATED: UNIQUE (organizationId, provider, mode, contentType, externalContentId)
```

As constraints condicionais devem usar índices parciais ou estratégia equivalente no PostgreSQL.

### 5.3 Automation

Identidade e estado operacional de uma automação. A configuração mutável ou publicada permanece nas revisões.

```text
id                    UUID       PK
organizationId        String     FK → organization.id
status                Enum       DRAFT | ACTIVE | PAUSED | ARCHIVED
createdByUserId       String     FK lógica → user.id
currentPublishedRevisionId UUID? FK → automation_revision.id
activeContentId       UUID?
activeKeywordNormalized String?
createdAt             DateTime
updatedAt             DateTime
publishedAt           DateTime?
pausedAt              DateTime?
```

Regras:

- apenas `ACTIVE` pode receber novos disparos;
- a criação gera uma primeira revisão `DRAFT`, que pode estar incompleta;
- a revisão publicada atual é imutável;
- `activeContentId` e `activeKeywordNormalized` são projeções usadas para garantir conflito de gatilho entre automações ativas;
- editar uma automação ativa cria ou reutiliza uma revisão de rascunho sem alterar a publicada.

Índices:

```text
(organizationId, status, updatedAt)
UNIQUE (currentPublishedRevisionId)
UNIQUE (organizationId, activeContentId, activeKeywordNormalized)
```

A última unicidade só se aplica quando a automação está ativa e as projeções não são nulas; a migration deve usar índice parcial ou mecanismo transacional equivalente.

### 5.4 AutomationRevision

Configuração versionada da automação.

```text
id           UUID       PK
automationId UUID       FK → automation.id
version      Int
status       Enum       DRAFT | PUBLISHED
name         String?
createdAt    DateTime
publishedAt  DateTime?
```

Regras:

- existe no máximo uma revisão `DRAFT` por automação;
- `DRAFT` pode estar incompleta;
- `PUBLISHED` exige nome, alvo, gatilho e ações válidos e torna-se imutável;
- alterar conexão ou conteúdo de uma automação ativa ocorre em nova revisão.

Constraint:

```text
UNIQUE (automationId, version)
```

### 5.5 AutomationTarget

Alvo único e versionado da automação.

```text
id                    UUID       PK
revisionId            UUID       FK → automation_revision.id
channelConnectionId   UUID?      FK → channel_connection.id
contentId             UUID       FK → content.id
```

Regras:

- uma revisão possui no máximo um alvo;
- no modo real, `channelConnectionId` é obrigatório, pertence ao mesmo workspace e deve ser igual a `Content.channelConnectionId`;
- a conexão deve estar `ACTIVE` no momento da publicação e no início de uma nova execução;
- no modo simulado, `channelConnectionId` é nulo e o conteúdo deve ter `mode=SIMULATED`;
- trocar a conexão invalida qualquer conteúdo de outra conexão;
- uma revisão nunca aponta para várias conexões.

Constraint:

```text
UNIQUE (revisionId)
```

### 5.6 AutomationTrigger

Gatilho versionado que inicia a automação. O MVP possui um gatilho de comentário por palavra-chave.

```text
id                UUID       PK
revisionId        UUID       FK → automation_revision.id
type              Enum       COMMENT_KEYWORD
keyword           String
keywordNormalized String
```

Regras:

- deve existir exatamente um gatilho para uma revisão publicada;
- `keywordNormalized` é usado no matching;
- a palavra original é preservada em `keyword` para exibição.

Constraint:

```text
UNIQUE (revisionId)
```

### 5.7 AutomationAction

Ações ordenadas e versionadas executadas quando o gatilho corresponde.

```text
id              UUID       PK
revisionId      UUID       FK → automation_revision.id
position        Int
type            Enum       PUBLIC_REPLY | PRIVATE_REPLY | LINK | CAPTURE_EMAIL | APPLY_TAG
config          Json
```

Exemplos de `config` validados por Zod:

```json
{
  "type": "PUBLIC_REPLY",
  "text": "Oi! Vou te enviar o material por DM."
}
```

```json
{
  "type": "PRIVATE_REPLY",
  "text": "Aqui está o material que você pediu:"
}
```

```json
{
  "type": "LINK",
  "url": "https://example.com/material",
  "label": "Abrir material"
}
```

```json
{
  "type": "CAPTURE_EMAIL",
  "prompt": "Qual é o seu melhor e-mail?"
}
```

```json
{
  "type": "APPLY_TAG",
  "tagName": "material-instagram"
}
```

Constraint:

```text
UNIQUE (revisionId, position)
```

### 5.8 AutomationExecution

Uma tentativa de executar uma automação para um evento recebido.

```text
id                    UUID       PK
organizationId        String     FK → organization.id
automationId          UUID       FK → automation.id
conversationId        UUID?      FK → conversation.id
contactId             UUID?      FK → contact.id
sourceEventId         UUID?      FK → external_event.id
channelConnectionId   UUID?      FK → channel_connection.id
provider              Enum       INSTAGRAM | FACEBOOK | TWITTER
mode                  Enum       SIMULATED | REAL
sourceType            Enum       COMMENT | MESSAGE | INTERACTION
sourceExternalId      String?
automationVersion     Int
automationSnapshot    Json
status                Enum       PENDING | PROCESSING | COMPLETED | FAILED | IGNORED
matched               Boolean
errorCode             String?
errorMessage          String?
attempts              Int        DEFAULT 0
startedAt             DateTime?
completedAt           DateTime?
createdAt             DateTime
updatedAt             DateTime
```

`automationSnapshot` contém conexão, conteúdo, trigger e actions efetivamente usados na execução, sem copiar credenciais. Isso garante histórico imutável mesmo se a automação for editada depois.

Execuções reais exigem `channelConnectionId`; execuções simuladas mantêm o campo nulo.

Idempotência:

```text
UNIQUE (organizationId, provider, mode, sourceType, sourceExternalId)
```

Para simulações, `sourceExternalId` deve ser gerado pelo sistema ou recebido de forma controlada. O mesmo evento simulado não deve gerar duas execuções.

### 5.9 Conversation

Agrupa mensagens entre um contato e o workspace em um canal específico.

```text
id                    UUID       PK
organizationId        String     FK → organization.id
contactId             UUID?      FK → contact.id
channelConnectionId   UUID?      FK → channel_connection.id
provider              Enum       INSTAGRAM | FACEBOOK | TWITTER
mode                  Enum       SIMULATED | REAL
externalId            String?
status                Enum       OPEN | CLOSED
lastMessageAt         DateTime?
createdAt             DateTime
updatedAt             DateTime
```

Constraint futura:

```text
UNIQUE (organizationId, provider, mode, channelConnectionId, externalId)
```

`externalId` pode ser nulo para dados simulados, mas deve ser obrigatório quando uma conversa real for persistida. Para dados reais, `channelConnectionId` identifica a conta externa responsável pelo canal. Como a conexão é nula no modo simulado, a implementação deve usar índices únicos parciais ou estratégia equivalente.

### 5.10 Message

Mensagem ou resposta registrada na conversa.

```text
id                    UUID       PK
conversationId        UUID       FK → conversation.id
executionId           UUID?      FK → automation_execution.id
direction             Enum       INBOUND | OUTBOUND
type                  Enum       COMMENT | INCOMING_MESSAGE | PUBLIC_REPLY | PRIVATE_REPLY | DIRECT_MESSAGE
provider              Enum       INSTAGRAM | FACEBOOK | TWITTER
mode                  Enum       SIMULATED | REAL
externalId            String?
text                  String?
payload               Json?
status                Enum       PENDING | SENT | FAILED | RECEIVED
sentAt                DateTime?
createdAt             DateTime
```

O campo `type` diferencia uma interação recebida, uma resposta pública, uma private reply e uma DM. Essa distinção é necessária para validar as capacidades de cada provider.

### 5.11 Contact

Pessoa que interagiu com o workspace.

```text
id                    UUID       PK
organizationId        String     FK → organization.id
channelConnectionId   UUID?      FK → channel_connection.id
provider              Enum       INSTAGRAM | FACEBOOK | TWITTER
mode                  Enum       SIMULATED | REAL
externalUserId        String?
username              String?
name                  String?
email                 String?
emailNormalized       String?
metadata              Json?
createdAt             DateTime
updatedAt             DateTime
lastInteractionAt     DateTime?
```

Constraints:

```text
UNIQUE (organizationId, emailNormalized)
UNIQUE (organizationId, provider, mode, channelConnectionId, externalUserId)
```

Como alguns valores podem ser nulos, a implementação Prisma/PostgreSQL deve usar índices únicos parciais ou estratégia equivalente para não bloquear vários contatos sem e-mail/ID externo ou sem conexão simulada. Uma pessoa em providers diferentes não deve ser presumida como a mesma identidade sem uma regra explícita de unificação.

### 5.12 Lead

Marca que um contato forneceu dados e entrou no funil do workspace.

```text
id                    UUID       PK
organizationId        String     FK → organization.id
contactId             UUID       FK → contact.id
automationId          UUID?      FK → automation.id
executionId           UUID?      FK → automation_execution.id
provider              Enum       INSTAGRAM | FACEBOOK | TWITTER
mode                  Enum       SIMULATED | REAL
capturedAt            DateTime
metadata              Json?
createdAt             DateTime
updatedAt             DateTime
```

Constraint do MVP:

```text
UNIQUE (organizationId, contactId)
```

Um contato torna-se lead na primeira captura válida. Se futuramente for necessário registrar várias conversões, será criada uma tabela `lead_capture` sem quebrar o modelo atual.

### 5.13 Tag

Etiqueta pertencente ao workspace.

```text
id              UUID       PK
organizationId  String     FK → organization.id
name            String
normalizedName  String
createdAt       DateTime
updatedAt       DateTime
```

Constraint:

```text
UNIQUE (organizationId, normalizedName)
```

### 5.14 ContactTag

Relação N:N entre contatos e tags.

```text
contactId       UUID       FK → contact.id
tagId           UUID       FK → tag.id
createdAt       DateTime
```

Primary key composta:

```text
PRIMARY KEY (contactId, tagId)
```

### 5.15 ChannelConnection — integração real

Representa uma conta externa conectada ao workspace.

```text
id                    UUID       PK
organizationId        String     FK → organization.id
provider              Enum       INSTAGRAM | FACEBOOK | TWITTER
externalAccountId     String
displayName           String
username              String?
encryptedAccessToken  String
tokenExpiresAt        DateTime?
scopes                String[]
status                Enum       ACTIVE | EXPIRED | REVOKED | ERROR | DISCONNECTED
lastWebhookAt         DateTime?
metadata              Json?
createdAt             DateTime
updatedAt             DateTime
```

Constraints:

```text
UNIQUE (provider, externalAccountId)
INDEX  (organizationId, provider, status)
```

O token nunca será retornado pela API ou enviado ao frontend.

`ChannelConnection` representa uma conta externa real; por isso, não possui `mode` e sempre participa de operações `REAL`. O modo `SIMULATED` é usado nos eventos, conteúdos, conversas, mensagens e contatos gerados pelo simulador, sem exigir uma conta conectada. Uma mesma conta externa não pode permanecer ativa em duas Organizations sem transferência explícita.

### 5.16 ExternalEvent — futuro

Evento recebido de um provider externo ou de um adapter simulado.

```text
id                    UUID       PK
organizationId        String     FK → organization.id
channelConnectionId   UUID?      FK → channel_connection.id
provider              Enum       INSTAGRAM | FACEBOOK | TWITTER
mode                  Enum       SIMULATED | REAL
eventType             String
externalEventId       String
externalObjectId      String?
payload               Json
receivedAt             DateTime
processedAt           DateTime?
status                Enum       RECEIVED | PROCESSING | PROCESSED | FAILED | IGNORED
errorMessage          String?
```

Constraint:

```text
UNIQUE (provider, mode, channelConnectionId, externalEventId)
```

Essa tabela é a primeira barreira de idempotência para reentregas de webhook.

## 6. Enums principais

```text
AutomationStatus:
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED

AutomationRevisionStatus:
  DRAFT
  PUBLISHED

AutomationTriggerType:
  COMMENT_KEYWORD

AutomationActionType:
  PUBLIC_REPLY
  PRIVATE_REPLY
  LINK
  CAPTURE_EMAIL
  APPLY_TAG

ExecutionStatus:
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  IGNORED

ConversationStatus:
  OPEN
  CLOSED

MessageDirection:
  INBOUND
  OUTBOUND

MessageType:
  COMMENT
  INCOMING_MESSAGE
  PUBLIC_REPLY
  PRIVATE_REPLY
  DIRECT_MESSAGE

MessageStatus:
  PENDING
  SENT
  FAILED
  RECEIVED

Provider:
  INSTAGRAM
  FACEBOOK
  TWITTER

ExecutionMode:
  SIMULATED
  REAL

ContentType:
  POST
  REEL
  VIDEO

ChannelConnectionStatus:
  ACTIVE
  EXPIRED
  REVOKED
  ERROR
  DISCONNECTED
```

### 6.1 Capacidades do canal

As capacidades são declaradas pelo adapter de cada provider. Elas não devem ser inferidas apenas pelo tipo de mensagem escolhido na automação.

```text
ChannelCapabilities:
  canReceiveComments       Boolean
  canSendPublicReply       Boolean
  canSendPrivateReply      Boolean
  canSendDirectMessage     Boolean
  requiresConversationWindow Boolean
```

Uma ação incompatível com as capacidades do provider deve ser rejeitada na publicação ou marcada como indisponível antes da execução. O Instagram é o primeiro provider e define o conjunto inicial de capacidades do MVP.

## 7. Fluxo de persistência do MVP

### 7.1 Criar automação

```text
Automation
  └─ AutomationRevision(DRAFT)
       ├─ AutomationTarget?
       ├─ AutomationTrigger?
       └─ AutomationAction[]
```

A criação deve ocorrer em uma transação. O rascunho pode ter campos incompletos; a publicação deve validar o agregado inteiro. No modo simulado, o alvo usa conteúdo simulado e conexão nula. No modo real, o usuário escolhe uma conexão antes do conteúdo, e ambos ficam registrados na revisão.

### 7.2 Conectar conta externa real

```text
1. iniciar OAuth pelo adapter do provider
2. validar callback, identidade, escopos e permissões
3. criar ou atualizar ChannelConnection na Organization ativa
4. criptografar credenciais no backend
5. sincronizar ou consultar Content da conexão
6. retornar somente metadados sanitizados
```

Uma conexão não é criada para o simulador. Falha no OAuth não deve persistir credenciais parciais como conexão ativa.

### 7.3 Receber comentário simulado

```text
1. receber provider selecionado entre os providers simuláveis
2. ignorar qualquer mode recebido do browser e definir mode=SIMULATED
3. normalizar payload como IncomingInteraction
4. criar ExternalEvent ou evento interno equivalente
5. criar AutomationExecution(PENDING)
6. adicionar job automation-execution
```

No MVP, `INSTAGRAM` é o único provider simulável. O mesmo fluxo será usado para providers reais; somente o adapter de entrada, o adapter de saída e o modo mudarão. A criação de conversa, contato, lead e tag permanece na Fase 5.

### 7.4 Processar execução

```text
1. claim idempotente da execução
2. mudar para PROCESSING
3. carregar conexão, conteúdo, trigger e actions da revisão publicada
4. validar conexão ativa quando mode=REAL
5. salvar automationSnapshot sem credenciais
6. validar ChannelCapabilities
7. avaliar keyword
8. criar Message de resposta pública
9. criar Message de private reply/DM quando suportado
10. criar/atualizar Contact e Lead quando aplicável
11. aplicar ContactTag quando aplicável
12. mudar para COMPLETED ou FAILED
```

### 7.5 Capturar e-mail

```text
1. normalizar e validar e-mail
2. localizar Contact por (organizationId, emailNormalized)
3. criar ou atualizar Contact
4. criar Lead se ainda não existir
5. vincular provider, mode, automationId e executionId
6. aplicar tag configurada
```

O modelo não deve criar um fluxo paralelo para cada provider. O provider e o modo são metadados do mesmo fluxo normalizado.

## 8. Regras de integridade

- Nenhum registro do produto pode existir sem `organizationId`, exceto tabelas de infraestrutura do Better Auth.
- Toda FK para uma entidade do produto deve respeitar o mesmo workspace lógico.
- Conteúdo real, conexão e alvo de uma revisão devem pertencer à mesma Organization e usar o mesmo provider.
- `mode=REAL` exige conexão; `mode=SIMULATED` exige conexão nula.
- Uma conexão não ativa bloqueia novas publicações e execuções reais, sem apagar histórico.
- Um job não pode atualizar execução de outro workspace.
- Uma execução concluída não deve ser recalculada silenciosamente.
- Falhas devem manter `errorCode`, `errorMessage` sanitizada e timestamps.
- A criação de contato, lead e tag deve ser idempotente.
- Deletes físicos devem ser evitados no MVP para automações e execuções; preferir status/arquivamento.
- Tokens e payloads sensíveis devem ter política própria de retenção e redaction em logs.

## 9. Índices mínimos

```text
automation:            (organizationId, status), (organizationId, updatedAt)
automation_revision:   (automationId, status), UNIQUE (automationId, version)
automation_target:     UNIQUE (revisionId), (channelConnectionId, contentId)
automation_trigger:    UNIQUE (revisionId), (keywordNormalized)
automation_action:     UNIQUE (revisionId, position)
content:               (organizationId, provider, mode), (channelConnectionId, contentType, externalContentId)
channel_connection:    (organizationId, provider, status), UNIQUE (provider, externalAccountId)
automation_execution:  (organizationId, status), (automationId, createdAt), (provider, mode, channelConnectionId, sourceType, sourceExternalId)
conversation:          (organizationId, provider, mode, channelConnectionId, externalId), (organizationId, lastMessageAt)
message:               (conversationId, createdAt), (executionId), (provider, mode, externalId)
contact:               (organizationId, provider, mode, channelConnectionId, externalUserId), (organizationId, emailNormalized), (organizationId, lastInteractionAt)
lead:                  (organizationId, capturedAt), (organizationId, provider, mode)
external_event:        (provider, mode, channelConnectionId, externalEventId), (organizationId, receivedAt)
```

## 10. Mapeamento para requisitos

| Requisito | Entidades principais |
|---|---|
| FR-WORK-001 / FR-WORK-004 | `organization`, `member` |
| FR-AUTO-001 a FR-AUTO-014 | `automation`, `automation_revision`, `automation_target`, `automation_trigger`, `automation_action`, `content` |
| FR-SIM-001 a FR-SIM-008 | `external_event`, `automation_execution`, `conversation`, `message` |
| FR-DATA-001 a FR-DATA-006 | `conversation`, `message`, `contact`, `lead`, `tag`, `contact_tag` |
| FR-ANALYTICS-001 a FR-ANALYTICS-003 | dados de `automation_execution`, `message`, `lead` |
| FR-META-001 a FR-META-010 | `channel_connection`, `content`, `external_event`, `conversation`, `message`, `contact` |
| FR-CHANNEL-001 a FR-CHANNEL-009 | `channel_connection`, `content`, `automation_target`, `automation_execution` |

## 11. Impacto sobre o modelo implementado

O schema atual já possui `Content`, `Automation`, `AutomationRevision`, `AutomationTarget`, `AutomationTrigger` e `AutomationAction`, mas ainda não implementa conexões externas. A evolução necessária está documentada e não faz parte desta alteração exclusivamente documental:

| Área atual | Mudança necessária | Compatibilidade |
| --- | --- | --- |
| Prisma | Criar `ChannelConnection` e seus enums/índices. | Nova migration, sem alterar conexões inexistentes. |
| `Content` | Adicionar `channelConnectionId` opcional e relações/constraints condicionais. | Linhas atuais são simuladas e permanecem nulas. |
| `AutomationTarget` | Adicionar `channelConnectionId` opcional. | Alvos atuais permanecem simulados e nulos. |
| `AutomationExecution` futuro | Persistir `channelConnectionId` e snapshot sanitizado. | Simulações continuam com conexão nula. |
| Contratos/API | Expor projeção sanitizada de conexão e endpoints de `channel-connections`. | Endpoints atuais de automação permanecem; o patch do alvo é estendido. |
| Backend | Criar `Channels` e mover registry/capabilities para sua fronteira. | `Automations` passa a depender de portas; regras atuais de revisão permanecem. |
| Web | Adicionar gestão de integrações e seleção conexão → conteúdo. | O simulador aparece como opção virtual e mantém o fluxo atual. |

Nenhum token deve ser incluído em respostas, revisões, snapshots, jobs ou logs durante essa migração.

## 12. Decisões adiadas

- persistir métricas em tabelas próprias ou calcular sob demanda;
- usar soft delete ou apenas estados de arquivamento em cada agregado;
- separar `Lead` e `LeadCapture` quando houver múltiplas conversões;
- armazenar payload bruto completo de webhooks e sua política de retenção;
- estratégia de rotação e recriptografia de tokens por provider;
- catálogo de capacidades por provider e forma de versioná-lo;
- identidade compartilhada entre contatos de providers diferentes;
- particionamento de `message`, `external_event` e `automation_execution` em escala maior.

## 13. Critério de aprovação

Cada evolução deste modelo estará pronta para virar migration quando forem confirmados:

- nomes finais dos campos e enums;
- adapter e schema final do Better Auth;
- limites de tamanho de textos;
- política de retenção de payloads;
- decisão sobre métricas derivadas;
- decisão sobre soft delete/arquivamento.
