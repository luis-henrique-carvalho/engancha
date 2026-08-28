# Engancha — Roadmap

> Versão: 0.1  
> Status geral: planejamento aprovado  
> Produto: MVP Instagram-first de automação de interações, comentários e DMs  
> Referências: [ARCHITECTURE.md](./ARCHITECTURE.md) · [REQUIREMENTS.md](./REQUIREMENTS.md)

## Como usar este roadmap

- Marque uma tarefa como concluída usando `[x]`.
- Mantenha apenas uma fase como `EM ANDAMENTO` por vez.
- Registre bloqueios na seção da fase correspondente.
- Alterações relevantes de arquitetura devem ser registradas no `ARCHITECTURE.md`.
- Novos requisitos devem ser registrados no `REQUIREMENTS.md` antes de virar tarefa.

## Status atual

| Item                  | Status                                        |
| --------------------- | --------------------------------------------- |
| Arquitetura           | ✅ Aprovada — versão 1.1                      |
| Requisitos funcionais | ✅ Definidos — revisão contínua               |
| Roadmap               | ✅ Criado                                     |
| Código                | 🟡 Fase 3 concluída localmente; Fase 2 em validação externa |
| Meta/Instagram real   | ⏸️ Futuro — EPIC-09                           |
| Outros providers      | ⏸️ Posterior — mesmos contratos e capacidades |

## Visão geral das fases

```text
Fase 0 — Preparação
        ↓
Fase 0.5 — Validação do modelo de dados
        ↓
Fase 1 — Fundação do monorepo e infraestrutura
        ↓
Fase 2 — Autenticação e workspaces
        ↓
Fase 3 — Gestão de automações
        ↓
Fase 4 — Simulação ponta a ponta
        ↓
Fase 5 — Conversas, contatos e leads
        ↓
Fase 6 — Dashboard e experiência do produto
        ↓
Fase 7 — Operação, testes e release do MVP
        ↓
Fase futura — Integração real com Instagram/Meta
```

---

## Fase 0 — Preparação

**Status:** ✅ CONCLUÍDA  
**Objetivo:** alinhar o produto antes da implementação.

- [x] Definir público inicial: criadores e pequenos negócios.
- [x] Definir canal inicial: Instagram.
- [x] Separar `provider` de `mode` (`INSTAGRAM` + `SIMULATED` no MVP).
- [x] Definir contratos normalizados e capacidades de canal.
- [x] Definir fluxo central: comentário → resposta → DM → link/lead.
- [x] Definir escopo do MVP simulado.
- [x] Aprovar arquitetura.
- [x] Criar requisitos funcionais.
- [x] Definir épicos candidatos.
- [x] Registrar caminho futuro para microserviços.
- [x] Registrar caminho futuro para Instagram/Meta real.

**Saída:** arquitetura, requisitos e roadmap aprovados.

---

## Fase 0.5 — Validação do modelo de dados

**Status:** ✅ CONCLUÍDA  
**Artefato:** [DATA-MODEL.md](./DATA-MODEL.md)  
**Objetivo:** validar o modelo lógico antes de transformá-lo em Prisma, migrations ou código.

### Checklist de validação

- [x] Confirmar entidades e responsabilidades.
- [x] Confirmar separação entre tabelas do Better Auth e tabelas do produto.
- [x] Confirmar uso de `organizationId` em todas as entidades de negócio.
- [x] Confirmar relações entre automações, triggers e actions.
- [x] Confirmar snapshot da automação em `AutomationExecution`.
- [x] Confirmar estados e transições das entidades.
- [x] Confirmar regras de idempotência.
- [x] Confirmar estratégia de IDs externos por provider e modo.
- [x] Confirmar associação de automações a uma `ChannelConnection` específica.
- [x] Confirmar catálogo inicial de `ChannelCapabilities`.
- [x] Confirmar constraints e índices principais.
- [x] Definir limites de tamanho dos textos.
- [x] Definir política de retenção de payloads e eventos.
- [x] Decidir estratégia de arquivamento/soft delete.
- [x] Decidir se métricas serão calculadas sob demanda ou persistidas.
- [x] Registrar ajustes aprovados no `DATA-MODEL.md`.
- [x] Marcar o `DATA-MODEL.md` como aprovado.

### Gate de aprovação

Nenhuma destas tarefas pode começar antes da conclusão desta fase:

- criação do `schema.prisma`;
- criação de migrations;
- criação de repositories;
- criação de entidades persistentes;
- criação de seed dependente do modelo;
- implementação de casos de uso que persistam dados.

**Critério de conclusão:** o modelo foi revisado, as decisões adiadas foram resolvidas ou explicitamente aceitas, e o documento está marcado como aprovado.

**Decisão:** modelo aprovado pelo usuário em 13/08/2026. As decisões adiadas no documento foram aceitas como decisões de MVP e podem ser refinadas posteriormente sem bloquear a fundação.

**Evolução aprovada em 27/08/2026:** a associação da automação a uma conexão específica foi fechada pela PRD [Conexões de canais e direcionamento de automações](./prds/channel-connections-automation-targeting.md). O modelo simulado permanece com conexão nula; a implementação real será feita no `EPIC-09` por migration aditiva.

---

## Fase 1 — Fundação do monorepo e infraestrutura

**Status:** ✅ CONCLUÍDA
**Épicos:** base técnica compartilhada  
**Objetivo:** criar uma base executável com web, API, worker, banco e filas.

> A infraestrutura pode ser criada nesta fase, mas o `schema.prisma` e qualquer migration dependente do domínio ficam bloqueados até a aprovação da Fase 0.5.

### Monorepo

- [x] Criar workspace npm.
- [x] Criar `apps/web`.
- [x] Criar `apps/api`.
- [x] Criar `apps/worker`.
- [x] Criar `packages/contracts`.
- [x] Configurar TypeScript, ESLint e Prettier.
- [x] Definir aliases e regras de dependência entre pacotes.

### Frontend base

- [x] Inicializar TanStack Start.
- [x] Configurar TanStack Router.
- [x] Configurar Tailwind CSS.
- [x] Criar shell estático mínimo e independente da API e do worker.

`shadcn/ui`, o port do layout da referência Satnaing e o shell de produto com sidebar, header e tema foram adiados para tickets de frontend. A referência local do `shadcn-admin` e seu grafo separado estão disponíveis para orientar essa implementação, sem se tornarem dependências do monorepo.

### Backend base

- [x] Inicializar NestJS API.
- [x] Inicializar NestJS worker.
- [x] Configurar `ConfigModule` e validação de ambiente.
- [x] Configurar prefixo `/api/v1`.
- [x] Configurar tratamento global de erros.
- [x] Configurar logging estruturado básico.
- [x] Configurar graceful shutdown.

### Dados e infraestrutura local

- [x] Configurar PostgreSQL no Docker Compose.
- [x] Configurar Redis no Docker Compose.
- [x] Configurar BullMQ.
- [x] Criar filas iniciais:
  - [x] `email-delivery`.
  - [x] `automation-execution`.
  - [x] `message-delivery`.
  - [x] `analytics`.
- [x] Criar health checks da API, worker, PostgreSQL e Redis.
- [x] Criar `.env.example`.

Prisma, schema e migrations permanecem deliberadamente adiados até existir persistência de domínio; serão tratados nas fases de autenticação e automações.

### Contratos

- [x] Criar schemas base com Zod.
- [x] Criar contratos de eventos versionados.
- [x] Criar contratos de jobs BullMQ.
- [x] Criar convenções de erro da API.

**Critério de conclusão:** ✅ `web`, `api` e `worker` iniciam localmente com Docker Compose, conectam ao PostgreSQL/Redis e executam um job de teste.

**Bloqueios:** nenhum. A PRD [Fundação executável local do monorepo](./prds/local-executable-monorepo-foundation.md) e os tickets `001`–`008` foram concluídos em 2026-08-13. A validação final registrou 30 testes aprovados, typecheck e lint aprovados; o format check global possui duas divergências preexistentes no worker, fora da fundação funcional.

---

## Fase 2 — Autenticação e workspaces

**Status:** 🟡 EM VALIDAÇÃO EXTERNA
**Épicos:** EPIC-01 e EPIC-02  
**Objetivo:** permitir acesso seguro e isolamento por Organization.

### Better Auth

- [ ] Configurar Better Auth no backend.
- [ ] Configurar sessão por cookie HTTP-only.
- [ ] Habilitar e-mail/senha.
- [ ] Habilitar Google OAuth.
- [ ] Configurar account linking seguro.
- [ ] Configurar confirmação de e-mail obrigatória.
- [ ] Configurar recuperação de senha.
- [ ] Criar rotas de autenticação no frontend.
- [ ] Criar estados de loading, erro e sucesso.
- [ ] Criar logout.

### Resend

- [ ] Criar adapter de e-mail transacional.
- [ ] Configurar templates de confirmação.
- [ ] Enfileirar e-mails na `email-delivery`.
- [ ] Processar envio no worker.
- [ ] Configurar retry e falha permanente.
- [ ] Criar reenvio de confirmação com rate limit.

### Organization Plugin

- [ ] Habilitar Organization Plugin.
- [ ] Gerar/aplicar schema do Better Auth.
- [ ] Criar Organization padrão de forma idempotente.
- [ ] Definir usuário como owner.
- [ ] Criar contexto de Organization ativa.
- [ ] Criar guard de membership.
- [ ] Escopar todas as consultas por Organization.
- [ ] Criar seletor visual de workspace, mesmo que exista apenas um no MVP.

**Critério de conclusão:** usuário consegue cadastrar, confirmar e-mail, entrar com e-mail/senha ou Google e acessar um workspace isolado.

**Bloqueios:** os fluxos locais são cobertos por `npm run test:e2e`. Ainda são necessárias credenciais OAuth do Google e credenciais/domínio autorizados do Resend para os smoke tests externos.

---

## Fase 3 — Gestão de automações

**Status:** ✅ CONCLUÍDA  
**Épico:** EPIC-03  
**Objetivo:** criar, editar, publicar e pausar automações pelo formulário guiado.

### Domínio e persistência

- [x] Modelar `Automation`.
- [x] Modelar `AutomationTrigger`.
- [x] Modelar `AutomationAction`.
- [x] Modelar status e versão da automação.
- [x] Criar repositories por domínio.
- [x] Criar migrations Prisma.
- [x] Implementar isolamento por Organization.
- [x] Manter conteúdos e alvos do MVP sem referência a conexão externa; nenhuma `ChannelConnection` é persistida na Fase 3.

### API

- [x] `GET /api/v1/automations`.
- [x] `POST /api/v1/automations`.
- [x] `GET /api/v1/automations/:id`.
- [x] `PATCH /api/v1/automations/:id`.
- [x] `POST /api/v1/automations/:id/publish`.
- [x] `POST /api/v1/automations/:id/pause`.
- [x] Validar DTOs/schemas.
- [x] Criar respostas serializadas.
- [x] Restringir o contrato do MVP a `INSTAGRAM` em modo `SIMULATED`; conteúdo real e outros providers ficam para o EPIC-09.

### Formulário web

- [x] Etapa de identificação.
- [x] Etapa de canal e conteúdo-alvo, exibindo `Instagram — Simulador` como opção virtual no MVP.
- [x] Etapa de palavra-chave.
- [x] Etapa de resposta pública.
- [x] Etapa de DM.
- [x] Etapa de link ou captura de e-mail.
- [x] Manter a etapa de tag fora do escopo da Fase 3; ela depende das entidades de contato/lead da Fase 5.
- [x] Etapa de revisão.
- [x] Salvar rascunho.
- [x] Publicar automação.
- [x] Exibir erros de validação.

**Critério de conclusão:** usuário consegue criar uma automação válida para `Instagram — Simulador`, salvá-la como rascunho, publicar e pausar, sem cadastrar ou selecionar uma conta externa.

**Bloqueios:** nenhum esperado após conclusão da Fase 2.

**Validação de encerramento (2026-08-27):** `npm run verify` aprovado; 10 testes de integração de automações e 189 testes web aprovados.

---

## Fase 4 — Simulação ponta a ponta

**Status:** ⏳ NÃO INICIADA  
**Épico:** EPIC-04  
**Objetivo:** processar uma interação simulada do Instagram usando o mesmo pipeline previsto para o Instagram real e providers futuros.

### Abstração de canal

- [ ] Definir `ChannelProvider`.
- [ ] Definir `Provider` e `ExecutionMode` como dimensões independentes.
- [ ] Definir `IncomingInteraction`.
- [ ] Definir `IncomingMessage`.
- [ ] Definir `PublicReply`.
- [ ] Definir `PrivateReply`.
- [ ] Definir `DirectMessage`.
- [ ] Definir `ChannelCapabilities`.
- [ ] Implementar adapter do Instagram em modo `SIMULATED`.
- [ ] Garantir que o simulador não chame diretamente o motor de automação.

### Eventos e filas

- [ ] Criar evento normalizado `interaction.received.v1`.
- [ ] Criar job `automation-execution`.
- [ ] Implementar `AutomationExecutionProcessor`.
- [ ] Implementar normalização de palavra-chave.
- [ ] Implementar matching case-insensitive.
- [ ] Implementar idempotência por evento/comentário.
- [ ] Persistir status `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` e `IGNORED`.
- [ ] Configurar retries e backoff.

### API e interface

- [ ] `POST /api/v1/simulations/comments`.
- [ ] `GET /api/v1/simulations/executions/:id`.
- [ ] Criar simulador de comentário.
- [ ] Exibir status de processamento.
- [ ] Exibir resultado da execução.
- [ ] Exibir falha de forma compreensível.

**Critério de conclusão:** um comentário simulado percorre API → Redis/BullMQ → worker → PostgreSQL e retorna um resultado observável na interface.

**Bloqueios:** nenhum esperado.

---

## Fase 5 — Conversas, contatos e leads

**Status:** ⏳ NÃO INICIADA  
**Épico:** EPIC-05  
**Objetivo:** transformar execuções em histórico, contatos e leads úteis.

### Persistência

- [ ] Modelar `Conversation`.
- [ ] Modelar `Message`.
- [ ] Modelar `Contact`.
- [ ] Modelar `Lead`.
- [ ] Modelar `Tag` e associação com contato.
- [ ] Adicionar `provider`, `mode`, IDs externos e `channelConnectionId` ao modelo.
- [ ] Persistir provider e modo em conversas, mensagens, contatos, leads e eventos.
- [ ] Criar migrations e índices.

### Worker

- [ ] Criar resposta pública simulada.
- [ ] Criar DM simulada.
- [ ] Criar ação de entrega de link.
- [ ] Criar ação de captura de e-mail.
- [ ] Normalizar e-mail.
- [ ] Criar/atualizar contato de forma idempotente.
- [ ] Criar lead associado à execução.
- [ ] Aplicar tag sem duplicidade.

### Interface

- [ ] Lista de conversas.
- [ ] Detalhe de conversa.
- [ ] Lista de contatos.
- [ ] Lista de leads.
- [ ] Visualização de tags.
- [ ] Filtros básicos.

**Critério de conclusão:** um comentário correspondente gera conversa, resposta, DM e lead quando o fluxo de captura é escolhido.

**Bloqueios:** depende da conclusão da Fase 4.

---

## Fase 6 — Dashboard e métricas

**Status:** ⏳ NÃO INICIADA  
**Épico:** EPIC-06  
**Objetivo:** permitir entender rapidamente o desempenho das automações.

- [ ] Criar endpoint de resumo.
- [ ] Calcular automações ativas.
- [ ] Calcular comentários processados.
- [ ] Calcular execuções concluídas.
- [ ] Calcular DMs enviadas.
- [ ] Calcular leads capturados.
- [ ] Calcular falhas.
- [ ] Adicionar filtro de período.
- [ ] Adicionar cards de métricas.
- [ ] Adicionar tabela/resumo de automações.
- [ ] Atualizar dados após execução concluída.
- [ ] Configurar cache apenas para leituras adequadas.

**Critério de conclusão:** o dashboard apresenta métricas coerentes com os dados persistidos e muda após uma simulação concluída.

**Bloqueios:** depende da conclusão da Fase 5.

---

## Fase 7 — Operação, testes e release do MVP

**Status:** ⏳ NÃO INICIADA  
**Épicos:** EPIC-08 e qualidade transversal  
**Objetivo:** tornar o MVP executável, verificável e operável.

### Bull Board

- [ ] Integrar `@bull-board/api`.
- [ ] Integrar `@bull-board/express`.
- [ ] Integrar `@bull-board/nestjs`.
- [ ] Montar `/internal/queues`.
- [ ] Proteger com autenticação.
- [ ] Proteger com autorização administrativa.
- [ ] Habilitar modo somente leitura em produção.
- [ ] Registrar ações administrativas.

### Testes

- [ ] Unitários dos casos de uso.
- [ ] Unitários de matching de palavra-chave.
- [ ] Unitários de idempotência.
- [ ] Integração com Prisma.
- [ ] Integração com filas.
- [ ] E2E de autenticação.
- [ ] E2E de Organization.
- [ ] E2E de criação e publicação.
- [ ] E2E do fluxo simulado completo.
- [ ] Testes de falha e retry do worker.
- [ ] Testes de contratos compartilhados.

### Segurança e operação

- [ ] Validar todas as variáveis obrigatórias no startup.
- [ ] Configurar rate limiting.
- [ ] Revisar CORS e cookies.
- [ ] Revisar isolamento por Organization.
- [ ] Revisar logs para não expor segredos.
- [ ] Configurar health/readiness.
- [ ] Testar graceful shutdown.
- [ ] Documentar comandos locais.
- [ ] Documentar setup de Google e Resend.
- [ ] Criar Dockerfiles de `web`, `api` e `worker`.
- [ ] Validar Docker Compose de produção inicial.

### Release

- [ ] Criar ambiente de staging.
- [ ] Executar migrations em staging.
- [ ] Validar fluxo de cadastro.
- [ ] Validar fluxo de automação.
- [ ] Validar fluxo de lead.
- [ ] Validar Bull Board.
- [ ] Corrigir bugs bloqueadores.
- [ ] Publicar MVP interno.

**Critério de conclusão:** o MVP pode ser executado por um usuário real de teste, com dados persistidos, filas observáveis e fluxo principal coberto por testes.

---

## Fase futura — Integração real com Instagram/Meta

**Status:** ⏸️ PLANEJADA  
**Épico:** EPIC-09  
**Objetivo:** substituir o adapter simulado do Instagram por integração real sem duplicar o motor de automações.

**PRD:** [Conexões de canais e direcionamento de automações](./prds/channel-connections-automation-targeting.md)

### Fundação de canais e conexões

- [ ] Criar o módulo `Channels` e suas portas de consulta.
- [ ] Mover registry/capabilities de provider para a fronteira `Channels`.
- [ ] Criar `ChannelConnection` com isolamento por Organization e respostas sanitizadas.
- [ ] Adicionar `channelConnectionId` opcional a `Content` e `AutomationTarget` por migration aditiva.
- [ ] Inicializar os dados simulados existentes com conexão nula na migration, sem criar conexões artificiais.
- [ ] Implementar endpoints de listagem, detalhe, revalidação, desconexão e conteúdos da conexão.
- [ ] Adicionar tela de integrações e estados vazio, ativo, expirado, erro e desconectado.
- [ ] Adicionar seleção conexão → conteúdo ao editor de automações reais.
- [ ] Validar conexão ativa, provider, workspace, conteúdo e capabilities na publicação.
- [ ] Preservar `channelConnectionId` no snapshot de execuções reais sem copiar credenciais.

### Adapter Meta e entrega real

- [ ] Criar app na Meta for Developers.
- [ ] Definir callback OAuth.
- [ ] Implementar conexão de conta profissional.
- [ ] Solicitar permissões necessárias.
- [ ] Persistir tokens criptografados.
- [ ] Implementar renovação/validação de tokens.
- [ ] Implementar webhooks de comentários.
- [ ] Implementar webhooks de mensagens.
- [ ] Validar assinatura dos webhooks.
- [ ] Implementar adapter real do Instagram/Meta.
- [ ] Mapear IDs externos.
- [ ] Reutilizar `interaction.received.v1`.
- [ ] Reutilizar `automation-execution`.
- [ ] Implementar resposta pública real.
- [ ] Implementar private reply real.
- [ ] Respeitar janelas e limitações do Instagram.
- [ ] Implementar desconexão e revogação.
- [ ] Solicitar App Review/Advanced Access quando necessário.
- [ ] Criar testes com conta de teste da Meta.

**Critério de conclusão:** uma conta profissional conectada recebe comentário real, executa automação existente e envia a resposta permitida pela API da Meta.

**Dependências:** Fases 3, 4, 5 e 7 concluídas.

---

## Extensões futuras — novos providers

**Status:** ⏸️ POSTERIOR
**Objetivo:** adicionar providers sem alterar o motor de automações, o modelo de execução ou o pipeline de filas.

- [ ] Implementar `FacebookProvider` usando os contratos normalizados.
- [ ] Implementar `TwitterProvider` usando os contratos normalizados.
- [ ] Declarar capacidades específicas de cada provider.
- [ ] Implementar adapters de OAuth, webhook e saída por provider.
- [ ] Criar testes de contrato compartilhados para todos os providers.
- [ ] Validar ações incompatíveis antes da publicação da automação.
- [ ] Adicionar filtros de provider e conexão no dashboard.

**Critério de conclusão:** um novo provider consegue receber uma interação, executar uma automação existente e produzir uma saída compatível sem criar um segundo motor de automações.

---

## Backlog posterior

Itens deliberadamente adiados:

- [ ] Troca entre múltiplos workspaces na interface.
- [ ] Convites e membros do workspace.
- [ ] Roles e permissões avançadas.
- [ ] Flow Builder visual.
- [ ] IA para criação de automações.
- [ ] WhatsApp.
- [ ] TikTok.
- [ ] Messenger.
- [ ] Billing e planos.
- [ ] Limites de uso por plano.
- [ ] CRM avançado.
- [ ] Analytics avançado.
- [ ] WebSockets para atualização em tempo real.
- [ ] Extração de serviços independentes.

## Dependências críticas

```text
Fase 1 → todas as fases técnicas
Fase 2 → Fases 3, 4, 5 e 6
Fase 3 → Fase 4
Fase 4 → Fase 5
Fase 5 → Fase 6
Fases 4 e 5 → Fase 7
Fases 3, 4, 5 e 7 → Integração Meta
```

## Definição de pronto — funcionalidade

Uma funcionalidade só deve ser marcada como concluída quando:

- [ ] requisito correspondente está implementado;
- [ ] dados estão isolados por Organization;
- [ ] entrada está validada;
- [ ] erros esperados possuem tratamento;
- [ ] estados de loading, vazio e erro existem no frontend;
- [ ] testes relevantes foram adicionados;
- [ ] contratos compartilhados foram atualizados;
- [ ] logs não expõem dados sensíveis;
- [ ] documentação necessária foi atualizada.

## Registro de decisões do roadmap

| Data       | Decisão                                                                            | Impacto                                                     |
| ---------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 2026-08-13 | Simulador e Meta real usarão os mesmos contratos e pipeline                        | Evita reescrita na futura integração                        |
| 2026-08-13 | API e worker serão deployables separados                                           | Permite escala e deploy independentes                       |
| 2026-08-13 | Better Auth Organization Plugin representará workspaces                            | Prepara membros e roles futuros                             |
| 2026-08-13 | PostgreSQL será a fonte de verdade                                                 | Redis fica restrito a cache e filas                         |
| 2026-08-13 | Instagram será o primeiro provider, com `provider`, `mode` e capacidades separados | Permite adicionar Facebook e Twitter/X sem duplicar o motor |
| 2026-08-27 | Cada revisão real aponta para uma `ChannelConnection` e conteúdo da mesma conta; simulação usa conexão nula | Torna o roteamento multi-conta inequívoco sem criar conexões fictícias |
