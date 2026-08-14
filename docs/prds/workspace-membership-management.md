# Gestão de workspaces e membros

## Source and Traceability

Esta PRD cobre a extensão de `EPIC-02`, especialmente `FR-WORK-001`, `FR-WORK-003` e `FR-WORK-005` em [REQUIREMENTS.md](../REQUIREMENTS.md), preservando `RN-001` e `RN-008`. Ela usa o Better Auth Organization Plugin já adotado pela Fase 2.

## Problem Statement

O produto possui workspace padrão e seletor, mas não permite criar um novo workspace, ver seus membros ou adicionar pessoas de modo seguro. A tela de usuários atual contém dados e convite simulados, sem relação com a Organization ativa.

## Goal and Scope

Permitir que usuários confirmados criem workspaces e que owners/admins gerenciem a entrada de pessoas no workspace ativo através de convites por e-mail. Cada lista e ação deve permanecer escopada à Organization ativa e validada no servidor.

Incluído: criação de workspace; definição do criador como owner e contexto ativo; listagem de membros do workspace ativo; convite como `member`; entrega assíncrona do convite; aceite pelo mesmo e-mail confirmado; UI real para membros e convite.

Não incluído: renomear/excluir workspace, remover membros, alterar papéis, criar convites para owner/admin, equipes, sincronizar sessões entre dispositivos ou provisionamento administrativo global.

## Actors and Permissions

- Usuário confirmado: cria workspace e vira seu owner.
- Owner/admin: consulta membros e convida pessoas como `member`.
- Member: usa o workspace, mas não gerencia membros ou convites.
- Convidado: aceita apenas convite destinado ao seu e-mail, depois de confirmar a conta.

## User Stories

1. As a confirmed user, I want to create a workspace, so that I can start a separate work context.
2. As an owner or admin, I want to see members of my active workspace, so that I know who has access.
3. As an owner or admin, I want to invite a person by email, so that they can join safely.
4. As an invited person, I want to accept my invitation after authenticating, so that I can access the workspace.

## Functional Behavior

1. Usuário confirmado informa nome de workspace; o servidor cria Organization pelo plugin, com slug único, owner e sessão ativa.
2. A UI troca imediatamente para o workspace retornado.
3. A área de pessoas consulta apenas a Organization ativa; owner/admin vê nomes, e-mails, papéis e estado de convite pendente.
4. Owner/admin informa e-mail e envia convite como `member`. O servidor nunca aceita `organizationId` do navegador como autorização.
5. Better Auth cria convite pendente e a API enfileira e-mail com URL de aceite.
6. O destinatário entra/cria a conta, confirma o mesmo e-mail e aceita o convite. Somente então a membership é criada.
7. Membership, convite repetido, papel inválido, convite vencido, destinatário incorreto e falta de permissão geram erro recuperável sem vazar outras Organizations.

## Domain Rules and Data

- Better Auth é a fonte de verdade para `organization`, `member` e `invitation`; não haverá gravação direta dessas tabelas pela aplicação.
- Apenas owner/admin pode criar `invitation`; toda nova pessoa recebe `member`.
- `activeOrganizationId` pertence à sessão atual. O criador do novo workspace passa a usar esse contexto na resposta da criação.
- Convite usa ID opaco e expiração do plugin; e-mail, token e URL não são registrados em logs.

## Contracts and Integrations

- `POST /api/v1/workspaces` cria workspace e devolve seu contexto seguro.
- `GET /api/v1/workspaces/active/members` lista membros permitidos; `POST /api/v1/workspaces/active/invitations` cria convite.
- O e-mail `organization-invitation` usa a fila `email-delivery`, Resend e o fallback local existentes.
- O aceite usa a rota Better Auth Organization Plugin, mantendo validação de sessão e do e-mail destinatário no servidor.

## Acceptance Criteria

- [ ] Usuário confirmado cria workspace com nome e slug válidos, torna-se owner e ele vira ativo na sessão atual.
- [ ] Owner/admin vê somente membros e convites do workspace ativo; member não acessa gestão.
- [ ] Owner/admin convida por e-mail como member; duplicata de membro/convite é tratada pelo plugin.
- [ ] Convite é entregue via fila e só é aceito por sessão confirmada com o e-mail destinatário.
- [ ] Tela de usuários deixa de usar dados/atraso simulados e trata loading, vazio, sucesso e erro.
- [ ] Testes verificam criação, escopo de lista, permissão, convite e aceite/negação de destinatário.

## Implementation Decisions

- Encapsular operações do plugin no módulo `workspaces` e aplicar guard/contexto no limite Nest.
- Adicionar schemas de contrato e DTOs para entrada pública; retornar somente dados seguros para o browser.
- No web, preservar a arquitetura de `features/users`: `services` concentra chamadas HTTP/Better Auth, `hooks` encapsula queries/mutations e invalidações, `views` compõe a página e `components` contém tabela, diálogos e ações.
- Reaproveitar composição visual shadcn Admin para seletor, tabela e diálogo, mas ligar a dados reais; os dados simulados e `setTimeout` deixam de fazer parte do fluxo.

## Testing Decisions

- TDD em fatias: criação; listagem autorizada; convite autorizado; bloqueio de member; aceite por destinatário.
- Testes de contrato para payload de convite e de worker para e-mail de convite.
- Typecheck, build, lint e formatter como gates.

## Out of Scope

Remoção, alteração de cargo, convite com cargos administrativos, gestão de equipes, auditoria avançada e automações de provisionamento.

## Decision Log

| ID | Decision | Status | Impact | Date |
| --- | --- | --- | --- | --- |
| DEC-01 | Usuário confirmado cria workspace; criador é owner e o novo contexto fica ativo somente na sessão atual. | RESOLVIDA | Permite múltiplos workspaces sem administração global. | 2026-08-14 |
| DEC-02 | Owner/admin convidam apenas como member; member não acessa gestão. | RESOLVIDA | Aplica menor privilégio. | 2026-08-14 |
| DEC-03 | Adição de pessoa exige convite e aceite pelo mesmo e-mail confirmado. | RESOLVIDA | Evita acesso sem prova de posse do endereço. | 2026-08-14 |

## Further Notes

Credenciais reais do Resend continuam necessárias apenas para smoke de produção; o fluxo local usa a caixa de saída de desenvolvimento.

## Documentation Links

- [Better Auth — Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Better Auth — criar Organization](https://www.better-auth.com/docs/plugins/organization#create-an-organization)
- [Better Auth — listar e definir Organization ativa](https://www.better-auth.com/docs/plugins/organization#list-users-organizations)
- [Better Auth — configuração e criação de convites](https://www.better-auth.com/docs/plugins/organization#invitations)
- [Better Auth — aceite de convite e validação do destinatário](https://www.better-auth.com/docs/plugins/organization#accept-invitation)
