---
title: "Monorepo executável e shell web"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by: []
user_stories: [1, 4]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre as User Stories 1 e 4 e os critérios de aceite do workspace, aplicações, pacote compartilhado e inicialização documentada.

## What to build

Criar a fundação do workspace npm com `apps/web`, `apps/api`, `apps/worker` e `packages/contracts`, configuração compartilhada de TypeScript, ESLint e Prettier, scripts independentes de execução e um shell mínimo do frontend TanStack Start que confirme a disponibilidade do ambiente sem depender da API ou do worker.

## Setup verificado nas documentações oficiais

Verificado em 2026-08-13:

- [npm workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces): os workspaces são declarados na propriedade `workspaces` do `package.json` raiz; `npm install` faz o link local e `npm run ... --workspace=<nome>` executa scripts de um pacote.
- [TanStack Start — Getting Started](https://tanstack.com/start/latest/docs/framework/react/getting-started): o CLI oficial é `npx @tanstack/cli@latest create`, mas o guia também oferece o setup manual.
- [TanStack Start — Build from Scratch](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch): para este monorepo, usar o setup manual dentro de `apps/web`, instalando `@tanstack/react-start`, `@tanstack/react-router`, React, Vite e TypeScript no workspace existente.
- [typescript-eslint — Getting Started](https://typescript-eslint.io/getting-started/): usar ESLint flat config com `eslint`, `@eslint/js`, `typescript` e `typescript-eslint` instalados localmente.
- [Prettier — Install](https://prettier.io/docs/install/): instalar Prettier localmente com versão exata, manter `.prettierrc` e validar com `prettier --check`.
- [Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy.html): `vite preview` serve apenas para validar localmente o build; não é servidor de produção.

### Decisões de instalação

- O gerenciador oficial deste slice é npm, com `package-lock.json` versionado. Não criar `npm-workspace.yaml`: esse arquivo não é lido pelo npm e a declaração deve ficar no `package.json` raiz.
- O runtime mínimo é Node.js `>=20`, coerente com o requisito do NestJS usado pelos demais tickets. TypeScript, ESLint, Prettier e CLIs ficam instalados localmente; não depender de instalações globais.
- O comando `npx @tanstack/cli@latest create` é uma alternativa para gerar um app isolado. Neste repositório, a implementação deve seguir o guia manual para não criar um segundo `package.json` raiz nem substituir a topologia npm existente.
- A documentação atual do TanStack Start marca o framework como Release Candidate; os manifests não devem usar `@latest` como dependência. A versão resolvida deve ficar registrada no `package-lock.json` e ser atualizada deliberadamente.
- O shell inicial usa Vite para desenvolvimento e preview local. O adapter de produção/SSR do TanStack Start não faz parte deste ticket.

## Implementation notes

### Topologia npm

O `package.json` raiz deve ser privado e declarar exatamente os padrões:

```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

Cada diretório abaixo precisa ter seu próprio `package.json`, com nome estável e dependências explícitas:

```text
@engancha/web       → apps/web
@engancha/api       → apps/api
@engancha/worker    → apps/worker
@engancha/contracts → packages/contracts
```

`web` não pode importar `apps/api` ou `apps/worker`; `api` e `worker` só podem compartilhar código por `@engancha/contracts`. O pacote `contracts` não deve depender de NestJS, Prisma, Redis ou BullMQ.

### Comandos de instalação e verificação

O resultado deve ser reproduzível a partir da raiz:

```bash
node --version                         # >= 20
node -p process.versions.icu           # deve imprimir uma versão, não undefined
npm install
npm ls --workspaces --depth=0
npm run dev --workspace=@engancha/web
npm run build --workspace=@engancha/web
npm run preview --workspace=@engancha/web
```

Os scripts raiz devem expor atalhos equivalentes sem esconder os comandos dos pacotes, por exemplo `web:dev`, `web:build` e `web:preview`. O preview só pode ser executado depois do build.

### Dependências e configuração compartilhada

- Instalar `typescript`, `eslint`, `@eslint/js` e `typescript-eslint` como devDependencies do root, usando o flat config recomendado.
- Instalar Prettier como devDependency do root com versão exata (`npm install --save-dev --save-exact prettier`), criar `.prettierrc` e `.prettierignore` e expor `format`/`format:check`.
- Manter `tsconfig.base.json` no root para opções compartilhadas e configs específicas por workspace que o estendam. Não ativar `verbatimModuleSyntax` no shell sem validar o bundle, pois o guia do TanStack Start alerta que isso pode vazar código server para o client.
- O lint precisa considerar `.ts`, `.tsx`, `.js` e `.mjs`, mas ignorar `node_modules`, `dist`, `.output`, cobertura e arquivos gerados pelo router.

### Shell TanStack Start

Dentro de `apps/web`, seguir a configuração manual oficial:

```bash
npm install @tanstack/react-start @tanstack/react-router react react-dom --workspace=@engancha/web
npm install --save-dev vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node --workspace=@engancha/web
```

O `apps/web/package.json` deve usar ESM e conter, no mínimo:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

`vite.config.ts` deve configurar `tanstackStart()` antes de `viteReact()`, habilitar resolução de paths do TypeScript e reservar uma porta documentada. A configuração mínima de TypeScript deve manter `jsx: "react-jsx"`, `moduleResolution: "Bundler"`, `module: "ESNext"`, `target: "ES2022"`, `skipLibCheck: true` e `strictNullChecks: true`.

O shell deve conter a configuração de router, `src/routes/__root.tsx` e uma rota `/` que renderize uma mensagem estática de disponibilidade do ambiente. `routeTree.gen.ts` é artefato gerado pelo TanStack Router e não deve ser editado manualmente. Nenhum módulo, alias ou import de API/worker pode aparecer no bundle do web.

## Acceptance criteria

- [ ] O `package.json` raiz declara `workspaces: ["apps/*", "packages/*"]`, é privado e o `npm install` cria o link dos quatro pacotes sem `npm-workspace.yaml`.
- [ ] `package-lock.json` é criado/atualizado e `npm ls --workspaces --depth=0` reconhece `web`, `api`, `worker` e `contracts`.
- [ ] Cada pacote possui `package.json` próprio; `web` não possui dependência ou import de `api`/`worker`, e `contracts` não possui dependência de runtime proibida.
- [ ] TypeScript, ESLint flat config e Prettier são dependências locais com scripts raiz de typecheck, lint e `format:check` reproduzíveis.
- [ ] Web, API e worker possuem comandos independentes de desenvolvimento e execução/preview, e o web comprova `dev`, `build` e `preview`.
- [ ] A aplicação web inicia e renderiza a rota `/` sem importar módulos internos da API ou do worker.
- [ ] A configuração Vite respeita a ordem `tanstackStart()` → `viteReact()`, e o build do web termina sem erro de TypeScript ou bundle.
- [ ] `.env.example` e instruções básicas de instalação e inicialização são incluídos sem colocar segredos no pacote web.
- [ ] Testes ou validações automatizadas cobrem a configuração do workspace, as fronteiras de dependência e a inicialização/build mínimo do web.

## Blocked by

None - can start immediately.

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
