# Troca segura de workspace

## Source and Traceability

Esta PRD estende a Fase 2 do [roadmap](../ROADMAP.md), o épico `EPIC-02` e `FR-WORK-003` de [requisitos](../REQUIREMENTS.md). Ela preserva as fronteiras de `RN-001` e `RN-008`, o vocabulário Organization/Workspace de [arquitetura](../ARCHITECTURE.md) e o modelo Better Auth de [dados](../DATA-MODEL.md).

## Problem Statement

O produto mostra apenas a Organization ativa. Um usuário que pertença a mais de uma Organization não consegue descobrir os workspaces disponíveis nem trocar o contexto ativo sem manipular dados de sessão fora do fluxo do produto.

## Goal and Scope

Permitir que um membro liste seus workspaces e selecione outro workspace do qual já é membro. A API deve validar o membership no servidor e atualizar somente a sessão corrente; a interface deve refletir o novo contexto em todas as áreas que dependem dele.

Incluído:

- listagem dos workspaces aos quais o usuário autenticado e confirmado pertence;
- troca da Organization ativa da sessão corrente, autorizada por membership atual;
- contratos de API seguros e respostas frontend-safe;
- TeamSwitcher baseado na composição de dropdown do shadcn Admin, com estados de carregamento, troca e erro;
- invalidação/refetch do contexto do workspace após uma troca concluída.

Não incluído:

- criar, renomear, excluir Organizations;
- convites, gestão de membros ou papéis;
- alteração de sessões em outros dispositivos;
- migração das futuras entidades de produto, que continuarão a depender do contexto ativo resolvido pelo guard.

Sucesso: um membro alterna apenas para um workspace próprio e, após a resposta, a interface e chamadas protegidas usam exclusivamente esse novo contexto.

## Actors and Permissions

- Membro confirmado: lista suas próprias memberships e troca a Organization ativa de sua sessão atual.
- Não-membro: não consegue descobrir nem tornar ativa uma Organization fora de sua membership; recebe `404`.
- Sessão inválida, não confirmada ou sem contexto utilizável: permanece bloqueada pelas políticas atuais de autenticação e guard.

## User Stories

1. As a workspace member, I want to see the workspaces I belong to, so that I can choose the correct data context.
2. As a workspace member, I want to change my active workspace, so that the application shows and requests data for that workspace.
3. As a workspace member, I want unauthorized workspace IDs to be rejected, so that membership boundaries remain private.

## Functional Behavior

1. Ao carregar a área autenticada, o frontend obtém o workspace ativo e a lista de memberships do usuário.
2. O TeamSwitcher exibe o workspace ativo e abre um dropdown adaptado do padrão shadcn Admin; cada item disponível mostra nome e papel.
3. Ao selecionar um workspace não ativo, o frontend envia apenas o identificador desejado para uma rota protegida.
4. A API resolve a sessão no servidor, confirma a membership atual para o identificador e atualiza `activeOrganizationId` somente para aquela sessão.
5. A resposta retorna o workspace agora ativo. O frontend substitui/invalida o contexto anterior e fecha o menu. Enquanto a troca ocorre, itens não podem disparar outra troca.
6. Se a troca falhar, o workspace anteriormente ativo continua visível; a interface apresenta erro recuperável e permite nova tentativa.
7. Uma Organization sem membership atual não é listada. Uma tentativa direta de selecioná-la retorna `404`, sem revelar sua existência.

## Domain Rules and Data

- `organization` e `member` continuam pertencendo ao Better Auth Organization Plugin; não haverá tabela paralela.
- A fonte de autorização é `member(userId, organizationId)` validada no servidor; o `organizationId` recebido é apenas uma solicitação de troca.
- A sessão é a dona de `activeOrganizationId`. A troca não propaga estado para outras sessões do mesmo usuário.
- A lista contém somente `id`, `name`, `slug` e `role`, ordenada por nome para experiência estável.

## Contracts and Integrations

- `GET /api/v1/workspaces` retorna uma coleção de workspaces que pertencem ao usuário da sessão.
- `POST /api/v1/workspaces/active` recebe `{ organizationId }`, valida o membership da sessão e devolve o workspace ativo resultante.
- Os schemas Zod em `packages/contracts` definem request e respostas sem tipos Nest/Prisma.
- A API usa o guard/contexto de autorização existente e a camada `workspaces`; o web usa o cliente REST já configurado com cookies.

## Acceptance Criteria

- [ ] Um usuário confirmado lista somente workspaces dos quais é membro, com nome, slug e papel.
- [ ] A solicitação de troca atualiza `activeOrganizationId` apenas na sessão corrente e retorna seu novo contexto.
- [ ] Uma solicitação para Organization sem membership retorna `404`; nenhum ID de cliente concede acesso por si só.
- [ ] O TeamSwitcher usa dropdown, responsividade e tokens do padrão shadcn Admin, exibindo seleção ativa, carregamento e erro acessível.
- [ ] Após uma troca bem-sucedida, cabeçalho, sidebar e próximas chamadas protegidas usam o novo workspace, sem mostrar dados do contexto anterior.
- [ ] Testes de API cobrem lista, troca autorizada, tentativa sem membership e isolamento por sessão; testes de web cobrem os estados do seletor.

## Implementation Decisions

- A mudança fica concentrada no módulo `workspaces`; controller valida a entrada em DTO/schema e service encapsula a leitura de memberships e a atualização da sessão, preservando DI e guard do Nest.
- A atualização é uma operação idempotente: selecionar a Organization já ativa devolve o mesmo contexto sem efeitos adicionais.
- O frontend não mantém uma cópia independente de Organization ativa: o estado derivado da resposta de API é a referência, propagada ao layout.
- O dropdown adapta apenas o padrão necessário do TeamSwitcher da referência: `DropdownMenu`, `SidebarMenuButton`, alinhamento responsivo e indicador visual; não inclui a ação "Add team".

## Testing Decisions

- Teste de integração/API para listagem filtrada por usuário, troca válida, troca inválida (`404`) e sessão distinta que preserva sua própria Organization ativa.
- Teste de componente/web para loading, item ativo, sucesso e erro do seletor.
- Build, typecheck, lint e formatter do web/API permanecem gates obrigatórios.

## Out of Scope

Convites, criação de workspaces, gerenciamento de roles, sincronização de sessão entre dispositivos e E2E real de Resend/Google.

## Decision Log

| ID | Decision | Status | Impact | Date |
| --- | --- | --- | --- | --- |
| DEC-01 | A troca só pode selecionar uma Organization com membership atual do usuário da sessão. | ACEITA COMO PADRÃO | Mantém `RN-001`; ID do cliente não é autorização. | 2026-08-14 |
| DEC-02 | Atualizar somente `activeOrganizationId` da sessão corrente. | ACEITA COMO PADRÃO | Evita alterar inesperadamente sessões em outros dispositivos. | 2026-08-14 |
| DEC-03 | Retornar `404` para tentativa de ativar Organization sem membership. | ACEITA COMO PADRÃO | Evita enumeração e preserva a política multi-tenant existente. | 2026-08-14 |
| DEC-04 | O seletor permite apenas listar e trocar workspaces já existentes; não cria ou convida. | RESOLVIDA | Mantém esta fatia compatível com o escopo solicitado. | 2026-08-14 |

## Further Notes

O roadmap ainda marca esta capacidade como adiada; esta PRD a antecipa explicitamente pela solicitação do usuário. Os testes E2E de isolamento e smokes com credenciais reais de Resend/Google permanecem itens independentes da Fase 2.
