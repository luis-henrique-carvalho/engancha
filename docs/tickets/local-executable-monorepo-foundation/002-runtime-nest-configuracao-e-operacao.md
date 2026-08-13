---
title: "Runtime Nest, configuração e operação"
status: "done"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by:
  - "docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md"
user_stories: [1, 2]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre as User Stories 1 e 2 e os critérios de aceite de API/worker NestJS, configuração, prefixo, erros, logs e encerramento ordenado.

## What to build

Inicializar API e worker como processos NestJS independentes, com configuração validada na inicialização, prefixo público `/api/v1` na API, tratamento global de erros, logs estruturados sem segredos e graceful shutdown para interromper novas operações e fechar conexões de forma ordenada.

## Setup verificado nas documentações oficiais

Verificado em 2026-08-13:

- [NestJS — First steps](https://docs.nestjs.com/first-steps): exige Node.js `>=20`; o starter oficial usa TypeScript, ESLint, Prettier e scripts `start`, `start:dev`, `build` e `start:prod`.
- [NestJS CLI — Overview](https://docs.nestjs.com/cli/overview) e [CLI — Scripts](https://docs.nestjs.com/cli/scripts): a CLI pode ser usada via `npx` ou instalada localmente; os scripts de build/execução devem usar a CLI versionada do projeto.
- [NestJS CLI — Workspaces](https://docs.nestjs.com/cli/monorepo?url=https%3A%2F%2Fdocs.nestjs.com%2Fcli%2Fworkspaces): o modo monorepo do Nest é uma convenção própria, com `nest-cli.json`, `projects` e dependências/configuração compartilhadas; ele não é o mesmo que npm workspaces.
- [NestJS — Configuration](https://docs.nestjs.com/techniques/configuration): instalar `@nestjs/config`; `ConfigModule.forRoot()` aceita `isGlobal` e `validationSchema`/`validate`, falhando o bootstrap quando a validação lança erro.
- [NestJS — Validation](https://docs.nestjs.com/techniques/validation): `ValidationPipe` é globalizável e requer `class-validator` e `class-transformer` quando DTOs decorados forem usados.
- [NestJS — Exception filters](https://docs.nestjs.com/exception-filters): filtros podem ser registrados globalmente e controlam resposta e logging de exceções.
- [NestJS — Logger](https://docs.nestjs.com/techniques/logger): `ConsoleLogger({ json: true })` habilita logs JSON estruturados sem exigir uma biblioteca externa neste slice.
- [NestJS — Lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events): `enableShutdownHooks()` habilita sinais; a sequência é `onModuleDestroy` → `beforeApplicationShutdown` → fechamento das conexões → `onApplicationShutdown`.

## Decisões de instalação e topologia

- API e worker serão aplicações Nest em modo padrão, cada uma dentro de um npm workspace e com `package.json` próprio. Não usar o “Nest monorepo mode”: ele cria outra unidade de organização e, no modelo documentado, aplicações do monorepo Nest não têm `package.json` próprio.
- Instalar `@nestjs/cli` localmente como devDependency do root e chamar a CLI pelos scripts npm. A instalação global (`npm i -g @nestjs/cli`) fica opcional apenas para uso humano, não é pré-requisito do projeto.
- O root compartilhado fornece TypeScript, ESLint, Prettier e a versão da CLI. API e worker declaram em seus próprios manifests apenas os runtimes de que precisam.
- A configuração de ambiente deve usar `@nestjs/config` com schema Joi nesta fatia. `class-validator`/`class-transformer` só entram se houver DTOs decorados; a validação de payload do job continua pertencendo ao contrato Zod dos tickets posteriores.

## Implementation notes

### Dependências mínimas

API:

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config joi class-validator class-transformer reflect-metadata rxjs --workspace=@engancha/api
```

Worker:

```bash
npm install @nestjs/common @nestjs/core @nestjs/config joi reflect-metadata rxjs --workspace=@engancha/worker
```

Na raiz:

```bash
npm install --save-dev @nestjs/cli
```

Os scripts de cada workspace devem ser executáveis a partir da raiz e também dentro do próprio diretório:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "dev": "nest start --watch",
    "start:prod": "node dist/main.js"
  }
}
```

O `nest-cli.json` e o `tsconfig` de cada aplicação devem apontar para seu `src/main.ts` e não podem apontar API para código de bootstrap do worker, ou vice-versa. A resolução de um workspace a partir de outro deve acontecer somente via contratos compartilhados.

### Bootstrap da API

`apps/api/src/main.ts` deve:

1. criar a aplicação HTTP com `NestFactory.create(AppModule)`;
2. chamar `app.enableShutdownHooks()` antes de `listen`;
3. aplicar `app.setGlobalPrefix('api/v1')`;
4. instalar `ValidationPipe` global com `whitelist: true`, `forbidNonWhitelisted: true` e `transform: true` quando houver DTOs nesta ou nas próximas fatias;
5. instalar o filtro global de exceções;
6. usar logger JSON com contexto do serviço e emitir eventos de `bootstrap_started`, `ready` e `shutdown` sem valores de segredos;
7. escutar a porta configurada somente depois de a configuração ter sido validada.

O filtro global deve separar exceções HTTP conhecidas de erros inesperados, retornar um formato estável (`statusCode`, `code`, `message`, `requestId`, `timestamp` e `path`) e nunca retornar stack trace, credenciais, URLs com query sensível ou payload arbitrário. O log pode conter stack trace apenas quando sanitizado e sem dados sensíveis.

### Bootstrap do worker

`apps/worker/src/main.ts` deve criar um `NestApplicationContext`, habilitar shutdown hooks e registrar o worker como pronto somente após a configuração necessária ser validada. A abertura/fechamento de Redis, BullMQ e demais adapters será conectada nos tickets de infraestrutura e processamento; este ticket define o ciclo de vida e os eventos observáveis, não a semântica do job.

### Configuração validada

Cada processo deve ter schema explícito, sem ler `process.env` espalhado pelo código. O mínimo esperado nesta fundação é:

- API: `NODE_ENV`, `PORT`, `DATABASE_URL` e `REDIS_URL`;
- worker: `NODE_ENV` e `REDIS_URL`.

`PORT` deve ser número de porta válido; URLs devem ser validadas como URI; `NODE_ENV` deve aceitar apenas os ambientes documentados. Valores ausentes ou inválidos devem interromper o bootstrap com nome da variável e regra violada, mas sem imprimir o valor recebido. A configuração pode permitir chaves desconhecidas para não quebrar variáveis de ferramentas locais, sem transformar segredos em logs.

### Encerramento ordenado

Registrar hooks de ciclo de vida para que SIGINT/SIGTERM (e `app.close()` nos testes) sigam esta ordem:

```text
receber sinal
  → marcar API/worker como encerrando
  → impedir novas operações/consumos
  → aguardar operações seguras em andamento
  → fechar HTTP, filas e conexões
  → logar shutdown concluído
```

O worker não pode aceitar novos jobs depois de entrar em encerramento. Os adapters devem ser idempotentes ao fechar e erros de cleanup devem ser logados de forma segura sem mascarar a causa original. O teste de sinal deve documentar a limitação do Nest em Windows; Linux/macOS são o caminho de validação principal deste repositório.

## Acceptance criteria

- [ ] API e worker possuem manifests, `main.ts`, `nest-cli.json`/configs e scripts independentes; `npm run dev --workspace=...` e `npm run build --workspace=...` funcionam sem CLI global.
- [ ] O bootstrap usa Node.js `>=20`, `@nestjs/config` local e schema Joi explícito; configuração ausente, inválida ou com porta/URI inválida falha antes de aceitar tráfego/consumir filas.
- [ ] A API aplica o prefixo `/api/v1` aos endpoints públicos da aplicação, sem duplicar o prefixo em controllers.
- [ ] O filtro global converte exceções HTTP e inesperadas para resposta estruturada, preserva um identificador de correlação quando disponível e não expõe stack, credenciais, URLs sensíveis ou payload arbitrário.
- [ ] API e worker usam logs JSON com `service`, `event`, timestamp e correlação quando disponível, cobrindo bootstrap, prontidão, erro e shutdown.
- [ ] `app.enableShutdownHooks()` e hooks de ciclo de vida interrompem novas operações/consumos e fecham recursos de forma ordenada e idempotente.
- [ ] API e worker não importam bootstrap, controllers ou detalhes de runtime um do outro.
- [ ] Testes cobrem configuração ausente/inválida sem vazamento de valores, prefixo, resposta do filtro, logs sanitizados e graceful shutdown.

## Blocked by

`docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md`

## Result

Implementado o runtime Nest independente da API e do worker. A API agora possui `AppModule`, configuração Joi validada antes do `listen`, prefixo público `/api/v1`, `ValidationPipe` global, rota `GET /api/v1/status`, filtro global de exceções com resposta estável e correlação por `x-request-id`. O worker usa `NestApplicationContext`, valida `NODE_ENV`/`REDIS_URL` antes de ficar pronto e permanece vivo aguardando SIGINT/SIGTERM até que os adapters de infraestrutura sejam conectados.

Ambos os processos usam `ConsoleLogger({ json: true })` com eventos de bootstrap, prontidão, erro e encerramento. `enableShutdownHooks()` e serviços de ciclo de vida marcam o runtime como encerrando antes do cleanup; os hooks são idempotentes e não expõem valores de ambiente, stack trace ou payload arbitrário na resposta HTTP. Os adapters de Redis, BullMQ e banco permanecem fora do escopo deste ticket e serão ligados nos tickets de infraestrutura.

Arquivos principais: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/config/runtime-env.ts`, `apps/api/src/common/global-exception.filter.ts`, `apps/api/src/common/runtime-lifecycle.service.ts`, `apps/api/nest-cli.json`, e equivalentes do worker em `apps/worker/`.

Validações executadas:

- `npm test` — os arquivos de teste passaram, cobrindo configuração ausente/inválida sem vazamento, ciclo de vida e limites dos workspaces.
- `npm run lint`, `npm run format:check` e `npm run typecheck` — passaram.
- `npm run build --workspace=@engancha/api` e `npm run build --workspace=@engancha/worker` — passaram e geraram `dist/main.js` independentes.
- API real respondeu `GET /api/v1/status` com `200`, retornou erro estruturado para rota inexistente e registrou `shutdown_started`/`shutdown_completed` ao SIGINT.
- Worker real registrou `ready` e os mesmos eventos de shutdown ao SIGINT.
- Execuções com `PORT=70000`, URI inválida ou `NODE_ENV=staging` falharam antes do bootstrap, sem imprimir credenciais.
