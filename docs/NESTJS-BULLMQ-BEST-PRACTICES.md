# Boas práticas de NestJS com BullMQ

Este repositório usa a integração oficial `@nestjs/bullmq`. A configuração e o ciclo de vida de filas devem seguir o padrão do NestJS e não criar instâncias de `Queue` ou `Worker` manualmente em factories da aplicação.

Referências oficiais:

- [NestJS Queues](https://docs.nestjs.com/techniques/queues)
- [NestJS Lifecycle Events](https://docs.nestjs.com/fundamentals/lifecycle-events)

## Regras do projeto

### Configuração

- Configure Redis uma vez com `BullModule.forRootAsync()` e injete `ConfigService`.
- Registre cada fila com `BullModule.registerQueue({ name })`.
- Use os nomes centralizados em `packages/contracts`; não repita literais de fila em controllers, services ou processors.
- Não use `sharedConnection`; essa opção é incompatível com as práticas atuais do BullMQ 5+.

### Produtores

- Injete filas com `@InjectQueue(queueName)` em um service de aplicação.
- Valide o payload com o contrato compartilhado antes de chamar `queue.add()`.
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

- A API configura e registra a fila em `apps/api/src/app.module.ts` e injeta a fila em `VerificationService`.
- O worker configura a mesma fila em `apps/worker/src/app.module.ts`.
- O consumidor está em `apps/worker/src/verification/verification.worker.ts`.
- A lógica validável sem boot do NestJS está em `apps/worker/src/verification/verification.job.ts`.
- O contrato continua em `packages/contracts`, sem dependência de NestJS, Redis ou BullMQ.
