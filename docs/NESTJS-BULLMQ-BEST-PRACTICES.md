# Boas práticas de NestJS com BullMQ

Este repositório usa a integração oficial `@nestjs/bullmq`. A configuração e o ciclo de vida de filas devem seguir o padrão do NestJS e não criar instâncias de `Queue` ou `Worker` manualmente em factories da aplicação.

Referências oficiais:

- [NestJS Modules](https://docs.nestjs.com/modules)
- [NestJS Queues](https://docs.nestjs.com/techniques/queues)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [NestJS Lifecycle Events](https://docs.nestjs.com/fundamentals/lifecycle-events)

## Regras do projeto

### Configuração

- Mantenha `AppModule` como composição: ele configura recursos globais e importa módulos de feature; não registre controllers ou providers de features diretamente nele.
- Cada feature expõe seu próprio `*.module.ts`, com controllers e providers relacionados; exporte somente providers consumidos por outros módulos.
- Configure Redis uma vez com `BullModule.forRootAsync()` e injete `ConfigService`.
- Registre cada fila com `BullModule.registerQueue({ name })`.
- Use os nomes centralizados em `packages/contracts`; não repita literais de fila em controllers, services ou processors.
- Não use `sharedConnection`; essa opção é incompatível com as práticas atuais do BullMQ 5+.

### Produtores

- Injete filas com `@InjectQueue(queueName)` em um service de aplicação.
- Valide o corpo HTTP em um `PipeTransform` baseado no contrato compartilhado e valide novamente antes de chamar `queue.add()` para preservar o limite quando o service for reutilizado fora do HTTP.
- Mantenha retry, backoff e retenção explícitos nas opções padrão registradas em `BullModule.registerQueue()`; use opções no `add()` somente para exceções específicas do job.
- Retorne apenas identificadores seguros para HTTP; não devolva payloads arbitrários ou credenciais.

### Consumidores

- Declare o consumidor com `@Processor(queueName)` e estenda `WorkerHost`.
- Implemente o processamento em `process(job)`; o método deve ser assíncrono e lançar erros para que o BullMQ controle retry.
- Revalide o payload no limite de consumo, mesmo que a API já tenha validado a mensagem.
- Use `UnrecoverableError` para mensagens inválidas que não devem ser repetidas.
- Use `@OnWorkerEvent()` para observabilidade de `completed`, `failed` e `error`.
- Inclua `jobId` e `correlationId` nos logs e nunca registre payloads sensíveis.

### Ciclo de vida

- Chame `app.enableShutdownHooks()` no bootstrap.
- Deixe `@nestjs/bullmq` fechar workers e filas através dos hooks do NestJS.
- Não crie listeners de sinal que fechem o mesmo worker manualmente; isso pode duplicar o shutdown.
- Processadores devem ser idempotentes, pois jobs podem ser reentregues após falha, retry ou perda de lock.

### Testes

- Teste a lógica de validação e processamento por uma função pequena e independente do runtime NestJS.
- Mantenha pelo menos um teste de contrato válido, um de payload inválido e testes para retry/falha definitiva.
- Para testes de integração, use Redis isolado e feche explicitamente o `TestingModule` ao final.

## Aplicação neste monorepo

- `apps/api/src/app.module.ts` é a composição da API: configura recursos globais e importa `PlatformModule`, os módulos de infraestrutura/health e os módulos de negócio.
- `apps/api/src/platform/platform.module.ts` disponibiliza logging, lifecycle, middleware de contexto HTTP, filtro global de exceções e guard de shutdown.
- `apps/api/src/platform/database/` encapsula Prisma; `apps/api/src/platform/health/` reúne os probes de PostgreSQL/Redis e exporta `InfrastructureHealthService`.
- Adaptadores de serviços externos ficam em `apps/api/src/integrations/`, por exemplo Better Auth em `integrations/auth/` e despacho de e-mail em `integrations/email/`.
- A documentação OpenAPI usa schemas Zod como fonte dos corpos, parâmetros e respostas. `apps/api/src/platform/http/openapi.ts` aplica somente as políticas globais e serve Swagger em desenvolvimento/teste; cada contexto registra suas operações ao lado dos controllers, em `modules/<contexto>/api/http/openapi.ts`.
- Cada contexto de negócio fica em `apps/api/src/modules/<contexto>/`. Controllers HTTP pertencem a `api/http/`, casos de uso a `application/`, contratos e portas a `domain/`, e adaptadores próprios a `infrastructure/`.
- `apps/api/src/modules/health/health.module.ts` reúne o health controller e suas dependências de infraestrutura/lifecycle.
- `apps/api/src/modules/verification/verification.module.ts` registra a fila técnica, o controller, o pipe Zod e `VerificationService`; o service injeta a fila com `@InjectQueue`.
- `apps/api/src/modules/automations/` aplica a mesma divisão: portas de repositório/provider em `domain/ports`, implementações Prisma e Instagram em `infrastructure/`, e casos de uso em `application/`.
- O worker configura a mesma fila em `apps/worker/src/app.module.ts`.
- O consumidor está em `apps/worker/src/verification/verification.worker.ts`.
- A lógica validável sem boot do NestJS está em `apps/worker/src/verification/verification.job.ts`.
- O contrato continua em `packages/contracts`, sem dependência de NestJS, Redis ou BullMQ.
