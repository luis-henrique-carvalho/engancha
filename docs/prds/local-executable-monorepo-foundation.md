# Fundação executável local do monorepo

## Source and Traceability

Fonte: Fase 1 — Fundação do monorepo e infraestrutura do `ROADMAP.md`.

Referências: `ARCHITECTURE.md` (seções 5, 6, 7, 9 e 15), `DATA-MODEL.md` (modelo aprovado) e `REQUIREMENTS.md` (critérios de aceite do MVP).

Decisões cobertas: DEC-01 a DEC-04.

## Problem Statement

O produto possui arquitetura, requisitos e modelo de dados aprovados, mas ainda não tem código ou um ambiente local que permita validar a comunicação entre frontend, API, filas, worker e infraestrutura. Sem essa base, cada épico posterior começaria por configuração repetida e não haveria um caminho verificável para o fluxo assíncrono central do MVP.

## Goal and Scope

Criar uma fundação de monorepo que possa ser iniciada localmente e demonstre um percurso assíncrono mínimo: a API aceita uma solicitação de teste, enfileira um job validado no Redis e o worker o processa, com observabilidade suficiente para confirmar a execução.

Incluído:

- workspace npm com `apps/web`, `apps/api`, `apps/worker` e `packages/contracts`;
- frontend TanStack Start inicializável, com uma página/shell mínimo que confirme a disponibilidade do ambiente;
- API NestJS com prefixo `/api/v1`, configuração validada, logs estruturados, tratamento global de erros, health check e graceful shutdown;
- worker NestJS separado, configurado para Redis, com graceful shutdown e consumo de um job de verificação;
- PostgreSQL e Redis fornecidos por Docker Compose, com health checks;
- BullMQ e contrato Zod versionado para um job de verificação em `packages/contracts`;
- filas iniciais declaradas: `email-delivery`, `automation-execution`, `message-delivery` e `analytics`;
- referência local opcional do `shadcn-admin`, clonada fora do repositório do produto e indexada em um grafo `graphify` separado para consulta de componentes e padrões visuais;
- `.env.example` e instruções locais para executar e verificar o slice.

Não incluído:

- `schema.prisma`, migrations, seed ou persistência de entidades de domínio;
- Better Auth, Resend, OAuth, filas de negócio e processors de domínio;
- layout final, autenticação ou páginas de produto;
- Dockerfiles e Docker Compose de produção.

O código do `shadcn-admin` não será incorporado automaticamente ao monorepo. Ele será consultado como referência, e os componentes necessários serão portados ou adaptados para `apps/web` quando os tickets de frontend forem implementados.

O sucesso é verificável quando web, API, worker, PostgreSQL e Redis iniciam localmente; a API e os serviços de infraestrutura respondem a health checks; e um job de verificação passa de API para BullMQ e é consumido pelo worker.

## Actors and Permissions

- Desenvolvedor local: inicia a infraestrutura e aplicações, consulta health checks e dispara o job de verificação.
- Nenhum usuário final, sessão, Organization ou dado de negócio é criado nesta fatia.

As interfaces de diagnóstico desta fundação não devem expor segredos, URLs com credenciais ou payloads arbitrários. O endpoint de teste é exclusivamente de desenvolvimento e deve ter escopo explícito de ambiente.

## User Stories

1. As a developer, I want to install and run every runtime component with documented commands, so that I can start feature work from a reproducible environment.
2. As a developer, I want to verify API, worker, PostgreSQL and Redis health, so that I can identify an unavailable dependency quickly.
3. As a developer, I want the API to enqueue a typed verification job that the worker consumes, so that the first asynchronous integration is proven before domain features are added.
4. As a developer, I want shared contracts to be independent of NestJS, Prisma, Redis and BullMQ, so that applications retain the prescribed dependency boundaries.

## Functional Behavior

### Local startup

1. O desenvolvedor copia `.env.example` para o ambiente local e sobe PostgreSQL e Redis pelo Docker Compose.
2. O workspace instala dependências e oferece comandos independentes para web, API e worker, além de um comando de desenvolvimento coordenado quando aplicável.
3. A inicialização valida as variáveis obrigatórias de cada aplicação antes de aceitar tráfego ou consumir filas.
4. O frontend mostra uma superfície mínima sem depender de módulos internos da API ou do worker.
5. Quando a referência local estiver disponível, o desenvolvedor pode consultar o grafo separado do `shadcn-admin` para localizar padrões de sidebar, tema, navegação e componentes, sem misturá-los ao grafo do Engancha.

### Health and verification flow

1. A API expõe health check que evidencia a disponibilidade da própria aplicação, PostgreSQL e Redis sem vazar configuração sensível.
2. O worker inicia somente após validar sua conexão com Redis e registra seu estado de prontidão.
3. Em desenvolvimento, a API recebe uma solicitação de verificação, valida o payload pelo contrato compartilhado e a adiciona a uma fila BullMQ.
4. O worker consome o job, valida novamente o payload compartilhado e registra a execução estruturadamente.
5. A API retorna uma confirmação que permita correlacionar o job sem revelar dados sensíveis.

### Failures and recovery

- Variáveis ausentes ou inválidas interrompem a inicialização com erro acionável e sem imprimir segredos.
- Redis ou PostgreSQL indisponíveis causam falha visível no health check e impedem o comportamento que depende do serviço.
- O job de verificação usa tentativas e backoff explícitos; falhas definitivas ficam observáveis nos logs e na fila.
- Encerramento de API ou worker interrompe novas operações, aguarda atividades seguras em curso e encerra conexões de forma ordenada.

## Domain Rules and Data

Esta fatia não cria tabelas do produto nem tabelas do Better Auth. PostgreSQL é inicializado somente como dependência disponível e apta a receber Prisma em ticket posterior.

O único payload compartilhado é técnico e versionado. Ele deve possuir um identificador de correlação e campos mínimos necessários para testar o transporte; não representa `Automation`, `Execution`, `Organization` ou qualquer evento de negócio.

As quatro filas iniciais são declaradas com nomes centralizados. Somente a verificação técnica é processada nesta fatia; jobs de automação, mensagem, e-mail e analytics não têm semântica de negócio implementada.

## Contracts and Integrations

- `packages/contracts` contém schemas Zod independentes de runtimes e exporta o contrato versionado do job de verificação.
- A API usa o contrato para validar a entrada antes de enfileirar.
- O worker usa o mesmo contrato antes de processar.
- Redis é a infraestrutura de BullMQ, não fonte de verdade.
- PostgreSQL é provisionado e verificado, sem schema de domínio.
- A API mantém o prefixo público `/api/v1`; endpoints técnicos permanecem claramente separados de contratos de produto futuros.
- O grafo do projeto continua em `insta-flow/graphify-out/`; a referência do `shadcn-admin` mantém seu próprio `graphify-out/` em um clone local externo ao monorepo. Consultas combinadas só devem ser criadas temporariamente para comparação explícita.

## Acceptance Criteria

- [ ] O repositório possui workspace npm e os quatro pacotes previstos pela arquitetura, com dependências respeitando as fronteiras entre web, API, worker e contracts.
- [ ] PostgreSQL e Redis sobem por Docker Compose e possuem health checks funcionais.
- [ ] Web, API e worker podem ser iniciados por comandos documentados; API e worker são processos NestJS independentes.
- [ ] A API aplica prefixo `/api/v1`, valida configuração de ambiente, registra erros de forma estruturada e encerra ordenadamente.
- [ ] A API oferece health check que reflete disponibilidade de PostgreSQL e Redis sem expor segredos.
- [ ] `packages/contracts` exporta schema Zod versionado para o job de verificação sem depender de NestJS, Prisma, Redis ou BullMQ.
- [ ] A API valida e enfileira um job de verificação no BullMQ, e o worker o consome com logs correlacionáveis.
- [ ] As filas `email-delivery`, `automation-execution`, `message-delivery` e `analytics` estão centralmente declaradas para uso futuro.
- [ ] A documentação registra como manter o clone opcional do `shadcn-admin` fora do monorepo, gerar seu grafo separado e consultá-lo sem contaminar o grafo do Engancha.
- [ ] Uma configuração local incompleta ou uma dependência indisponível falha de forma clara e segura.
- [ ] Há validações automatizadas adequadas para contratos e para o percurso API → fila → worker, além de instruções de execução manual.

## Implementation Decisions

- O monorepo usa npm workspaces; cada aplicação possui runtime e comandos próprios.
- `packages/contracts` é o único pacote compartilhado inicial e contém apenas contratos transportáveis; código de domínio só será extraído quando uma necessidade real surgir.
- A API e o worker são deployables e processos separados desde o início. Eles se comunicam por PostgreSQL e Redis/BullMQ, não por imports internos.
- A infraestrutura local usa Docker Compose para PostgreSQL e Redis. Aplicações podem executar localmente durante o desenvolvimento.
- A API concentra configuração, tratamento global de exceções, logging e endpoint de health; o worker concentra processors e observabilidade de consumo.
- As configurações de retry, backoff e retenção do job técnico devem ser explícitas e conservadoras, sem antecipar políticas definitivas dos jobs de domínio.
- O `shadcn-admin` é uma referência visual e técnica opcional. O clone deve ficar em diretório irmão ou outro diretório externo ao repositório, preferencialmente com histórico superficial (`--depth 1`) e sem instalação de dependências apenas para consulta.
- O grafo do template deve ser construído e atualizado no próprio diretório da referência. O grafo do Engancha não deve indexar esse clone por padrão.

## Testing Decisions

- Testes unitários verificam os schemas Zod e a rejeição de payloads inválidos.
- Testes de integração verificam configuração, health checks e conexão das aplicações com Redis e PostgreSQL em ambiente controlado.
- Um teste de integração de fila verifica o percurso de enfileiramento pela API e consumo pelo worker usando o contrato compartilhado.
- A verificação manual documentada confirma inicialização, health checks e logs correlacionáveis em Docker Compose.

## Out of Scope

- Modelagem e migrations Prisma, inclusive as tabelas do Better Auth.
- Endpoints de automações, simulações, conversas, contatos, leads ou analytics.
- Tela de autenticação, shell visual definitivo e portabilidade dos componentes do template Satnaing; nesta fatia, o template é somente referência para iniciar web.
- Bull Board, rate limiting e monitoramento de produção.
- Integrações reais com Instagram/Meta, Google ou Resend.

## Decision Log

| ID     | Decisão                                                                                                                        | Status             | Impacto                                                                                                | Data       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------ | ---------- |
| DEC-01 | A fundação é um único slice técnico verificável por health checks e por um job de verificação API → BullMQ → worker.           | ACEITA COMO PADRÃO | Entrega uma base demonstrável sem introduzir regras de produto.                                        | 2026-08-13 |
| DEC-02 | O escopo contém web, API, worker, contracts, PostgreSQL, Redis e Docker Compose; schema/migrations de domínio permanecem fora. | RESOLVIDA          | Respeita a Fase 0.5 concluída e mantém a próxima fatia de persistência separada.                       | 2026-08-13 |
| DEC-03 | npm, TanStack Start, NestJS, Zod, PostgreSQL, Redis e BullMQ seguem as escolhas aprovadas na arquitetura.                      | RESOLVIDA          | Evita reabrir decisões técnicas já documentadas.                                                       | 2026-08-13 |
| DEC-04 | O endpoint de verificação é técnico, limitado ao desenvolvimento e sem semântica de domínio.                                   | ACEITA COMO PADRÃO | Evita expor uma superfície operacional desnecessária no produto.                                       | 2026-08-13 |
| DEC-05 | O `shadcn-admin` será mantido como referência local opcional, fora do monorepo, com grafo `graphify` separado.                 | RESOLVIDA          | Facilita consultas e reduz leitura de tokens sem misturar código de referência com o grafo do produto. | 2026-08-13 |

## Further Notes

- O modelo lógico de dados está aprovado, mas a criação de `schema.prisma` e migrations deve ocorrer em uma fatia posterior, com necessidade de persistência real.
- A escolha de versões específicas de bibliotecas deve priorizar versões estáveis compatíveis no momento da implementação; ela não altera os contratos de produto.
- O acesso a Docker e a disponibilidade das portas locais são pré-requisitos do ambiente de desenvolvimento e precisam ser registrados caso bloqueiem a execução.
- O clone de referência não é pré-requisito para iniciar API, worker, web ou infraestrutura; sua ausência deve apenas impedir consultas locais ao template.

## Ticket Map

- [001 — Monorepo executável e shell web](../tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md)
- [002 — Runtime Nest, configuração e operação](../tickets/local-executable-monorepo-foundation/002-runtime-nest-configuracao-e-operacao.md)
- [003 — Infraestrutura local e health checks](../tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md)
- [004 — Contrato do job e registro de filas](../tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md)
- [005 — API enfileira job de verificação](../tickets/local-executable-monorepo-foundation/005-api-enfileira-job-de-verificacao.md)
- [006 — Worker processa job de verificação](../tickets/local-executable-monorepo-foundation/006-worker-processa-job-de-verificacao.md)
- [007 — Validação e documentação do slice local](../tickets/local-executable-monorepo-foundation/007-validacao-e-documentacao-do-slice-local.md)
- [008 — Referência local do shadcn-admin e grafo separado](../tickets/local-executable-monorepo-foundation/008-referencia-local-shadcn-admin-e-grafo-separado.md)
