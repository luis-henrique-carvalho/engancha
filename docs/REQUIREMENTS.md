# Engancha — Requisitos Funcionais

> Status: draft 0.1  
> Escopo: MVP navegável Instagram-first, com núcleo preparado para múltiplos providers  
> Documento de referência: [ARCHITECTURE.md](./ARCHITECTURE.md)

## 1. Objetivo do documento

Este documento define o comportamento funcional do MVP do Engancha e serve como base para decomposição em épicos, histórias de usuário e tarefas de implementação.

O MVP deve validar o fluxo:

```text
comentário com palavra-chave
        ↓
resposta pública
        ↓
DM
        ↓
link ou captura de e-mail
        ↓
tag e lead
```

Os eventos do Instagram serão simulados. O usuário não conectará uma conta real da Meta nesta fase, mas os contratos internos devem permanecer independentes do provider.

## 2. Perfis e atores

### 2.1 Usuário

Criador de conteúdo ou pequeno negócio que cria e acompanha automações.

### 2.2 Membro do workspace

Usuário pertencente a uma Organization do Better Auth. O MVP começa com um único usuário como owner, mas o modelo deve permitir membros futuros.

### 2.3 Administrador da plataforma

Usuário interno com acesso ao Bull Board e a informações operacionais. Não faz parte do fluxo comum do cliente.

### 2.4 Worker

Componente técnico que processa jobs assíncronos e atualiza o resultado das execuções.

### 2.5 Sistema externo

Resend, usado para envio de e-mails transacionais. A Meta/Instagram está fora da integração do MVP e será representada pelo simulador.

## 3. Convenções

- **MUST**: obrigatório para o MVP.
- **SHOULD**: importante, mas pode ser entregue depois do primeiro fluxo funcional.
- **COULD**: desejável e não bloqueia a validação do MVP.
- Prioridades: `P0` bloqueia o fluxo principal; `P1` é necessário para uma versão utilizável; `P2` pode ser posterior.

## 4. Escopo do MVP

### Incluído

- autenticação por e-mail/senha e Google;
- confirmação de e-mail;
- Organization Plugin como workspace;
- criação e seleção de workspace ativo;
- criação de automações por formulário passo a passo;
- gatilho por palavra-chave em comentário simulado;
- resposta pública simulada;
- DM simulada;
- envio de link ou captura de e-mail;
- tags de contatos;
- histórico de conversas e execuções;
- dashboard com métricas básicas;
- processamento assíncrono com BullMQ;
- monitoramento interno com Bull Board.

### Não incluído

- conexão real com Instagram/Meta;
- publicação ou leitura real de comentários;
- envio real de DMs pelo Instagram;
- WhatsApp, TikTok e Messenger;
- Flow Builder visual;
- IA;
- billing;
- CRM avançado;
- múltiplos canais;
- colaboração avançada entre membros.

Embora a integração real esteja fora do MVP, o simulador MUST usar os mesmos contratos normalizados, casos de uso e filas previstos para a integração Meta. A diferença deve ficar restrita ao adapter de entrada/saída do canal.

## 5. Requisitos funcionais

## Épico candidato A — Autenticação e acesso

### FR-AUTH-001 — Criar conta com e-mail e senha

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST permitir que um visitante crie uma conta informando nome, e-mail e senha.

Critérios de aceitação:

- o nome deve ser obrigatório;
- o e-mail deve ser válido e normalizado;
- a senha deve respeitar a política mínima do Better Auth;
- e-mail já cadastrado não deve criar uma segunda conta;
- após o cadastro, o sistema deve informar que a confirmação foi enviada;
- o usuário não deve acessar o dashboard como usuário confirmado antes de verificar o e-mail.

### FR-AUTH-002 — Entrar com e-mail e senha

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST permitir login com e-mail e senha.

Critérios de aceitação:

- credenciais inválidas devem retornar mensagem segura, sem revelar se o e-mail existe;
- conta não confirmada deve ser impedida de acessar o produto;
- o usuário deve poder solicitar o reenvio da confirmação;
- sessão válida deve ser criada em cookie HTTP-only.

### FR-AUTH-003 — Entrar com Google

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST permitir autenticação com Google OAuth.

Critérios de aceitação:

- o usuário deve ser redirecionado para o Google;
- o callback deve criar ou vincular a conta com segurança;
- e-mail Google não verificado não deve receber acesso;
- e-mail Google verificado deve permitir acesso;
- falhas ou cancelamentos do OAuth devem retornar o usuário à tela de login com mensagem adequada.

### FR-AUTH-004 — Confirmar endereço de e-mail

**Prioridade:** P0  
**Ator:** Usuário / Resend

O sistema MUST enviar um link de confirmação por e-mail usando Resend.

Critérios de aceitação:

- o link deve expirar;
- o token deve ser de uso controlado pelo Better Auth;
- o link válido deve marcar o e-mail como confirmado;
- o link inválido ou expirado deve mostrar estado de erro;
- o usuário deve poder solicitar novo link;
- o envio deve ser processado pela fila `email-delivery`.

### FR-AUTH-005 — Recuperar senha

**Prioridade:** P1  
**Ator:** Usuário / Resend

O sistema SHOULD permitir solicitar e concluir recuperação de senha por e-mail.

Critérios de aceitação:

- a solicitação deve usar resposta que não revele se a conta existe;
- o link deve expirar;
- a nova senha deve respeitar a política de segurança;
- sessões antigas devem seguir a política do Better Auth.

### FR-AUTH-006 — Encerrar sessão

**Prioridade:** P1  
**Ator:** Usuário

O sistema MUST permitir logout e invalidar a sessão atual.

## Épico candidato B — Organizations e workspaces

### FR-WORK-001 — Criar workspace padrão

**Prioridade:** P0  
**Ator:** Sistema

Após o primeiro acesso autorizado, o sistema MUST garantir que o usuário tenha uma Organization padrão.

Critérios de aceitação:

- a criação deve ser idempotente;
- o usuário deve ser owner da Organization;
- o workspace deve possuir nome e slug válidos;
- não devem ser criados workspaces duplicados em chamadas concorrentes;
- a Organization padrão só deve ser criada após autenticação válida.

### FR-WORK-002 — Exibir workspace ativo

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST exibir o workspace ativo no layout principal.

Critérios de aceitação:

- o usuário deve visualizar nome do workspace;
- toda informação do dashboard deve pertencer ao workspace ativo;
- ausência de workspace ativo deve ser tratada com estado de onboarding ou erro recuperável.

### FR-WORK-003 — Trocar workspace ativo

**Prioridade:** P2  
**Ator:** Usuário

O sistema COULD permitir alternar entre Organizations das quais o usuário é membro.

Critérios de aceitação:

- apenas Organizations do usuário podem ser selecionadas;
- a troca deve atualizar o contexto de todas as telas;
- dados do workspace anterior não podem aparecer no novo contexto.

### FR-WORK-004 — Isolar dados por workspace

**Prioridade:** P0  
**Ator:** Sistema

O sistema MUST impedir acesso a automações, contatos, conversas, leads e execuções pertencentes a outro workspace.

Critérios de aceitação:

- o backend deve validar sessão e membership;
- `organization_id` enviado pelo cliente não deve ser suficiente para autorização;
- consultas e mutações devem ser sempre escopadas pela Organization ativa;
- tentativa de acesso indevido deve retornar erro de autorização ou recurso não encontrado, conforme a política adotada.

### FR-WORK-005 — Preparar membros futuros

**Prioridade:** P2  
**Ator:** Sistema

O modelo MUST usar o Organization Plugin para não bloquear convites, membros e roles em versões futuras.

O gerenciamento de convites não faz parte do MVP inicial.

## Épico candidato C — Criação e gestão de automações

### FR-AUTO-001 — Listar automações

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST exibir as automações do workspace ativo.

Cada item deve mostrar, no mínimo:

- nome;
- status;
- palavra-chave;
- data de atualização;
- quantidade de execuções;
- quantidade de leads capturados, quando disponível.

### FR-AUTO-002 — Iniciar criação de automação

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST permitir iniciar uma automação por formulário passo a passo.

Etapas mínimas:

1. identificação da automação;
2. canal/conexão e conteúdo-alvo;
3. configuração do gatilho;
4. resposta pública;
5. DM;
6. ação final;
7. revisão e publicação.

No MVP simulado, a etapa de canal apresenta `Instagram — Simulador` como opção virtual e não exige uma conta externa. No modo real, a conexão deve ser escolhida antes de listar seus conteúdos.

### FR-AUTO-003 — Definir identificação da automação

**Prioridade:** P0  
**Ator:** Usuário

O usuário MUST informar nome da automação.

Critérios de aceitação:

- nome obrigatório;
- nome limitado a tamanho definido pelo produto;
- nome deve ser exclusivo apenas se essa regra for adotada; caso contrário, duplicidade é permitida;
- rascunho deve poder ser salvo sem publicação.

### FR-AUTO-004 — Configurar palavra-chave

**Prioridade:** P0  
**Ator:** Usuário

O usuário MUST configurar uma palavra-chave que dispara a automação.

Critérios de aceitação:

- palavra-chave obrigatória;
- espaços laterais devem ser removidos;
- comparação deve ter regra explícita de maiúsculas/minúsculas;
- palavra-chave vazia não pode ser publicada;
- o sistema deve impedir configuração inválida.

Regra recomendada para o MVP: comparação sem distinção entre maiúsculas e minúsculas, preservando a palavra original para exibição.

### FR-AUTO-005 — Configurar resposta pública

**Prioridade:** P0  
**Ator:** Usuário

O usuário MUST informar o texto da resposta pública simulada.

Critérios de aceitação:

- texto obrigatório para publicação;
- limite de tamanho definido pelo produto;
- pré-visualização da resposta;
- texto deve ser salvo junto à versão da automação.

### FR-AUTO-006 — Configurar DM automática

**Prioridade:** P0  
**Ator:** Usuário

O usuário MUST configurar o texto da DM simulada.

Critérios de aceitação:

- texto obrigatório para publicação;
- limite de tamanho definido pelo produto;
- pré-visualização da mensagem;
- mensagem deve ser salva como ação ordenada.

### FR-AUTO-007 — Configurar ação final de link

**Prioridade:** P0  
**Ator:** Usuário

O usuário MUST poder escolher envio de link como ação final.

Critérios de aceitação:

- URL deve ser validada;
- texto do botão ou chamada para ação deve ser configurável ou possuir valor padrão;
- execução deve registrar que o link foi entregue;
- o simulador deve exibir a mensagem como DM.

### FR-AUTO-008 — Configurar captura de e-mail

**Prioridade:** P0  
**Ator:** Usuário / Contato

O usuário MUST poder escolher captura de e-mail como ação final.

Critérios de aceitação:

- a automação deve solicitar o e-mail no fluxo simulado;
- entrada deve ser validada;
- e-mail válido deve criar ou atualizar um contato no workspace;
- o contato deve ser marcado como lead;
- o lead deve ser associado à automação e à execução correspondente.

### FR-AUTO-009 — Configurar tag

**Prioridade:** P1  
**Ator:** Usuário

O usuário SHOULD poder definir uma tag aplicada ao contato ou lead.

Critérios de aceitação:

- tag deve ser normalizada;
- mesma tag não deve ser duplicada no contato;
- tag deve pertencer ao workspace;
- aplicação da tag deve ser registrada na execução.

### FR-AUTO-010 — Salvar rascunho

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST permitir salvar uma automação incompleta como rascunho.

Critérios de aceitação:

- rascunho pode não possuir todos os campos publicáveis;
- rascunho deve aparecer na lista;
- usuário deve poder retomar a edição;
- rascunho não deve ser disparado pelo simulador até publicação.

### FR-AUTO-011 — Revisar automação

**Prioridade:** P0  
**Ator:** Usuário

Antes de publicar, o sistema MUST mostrar resumo do gatilho e das ações configuradas.

O resumo também deve identificar provider, modo, conteúdo-alvo e, quando real, a conexão selecionada sem exibir credenciais.

### FR-AUTO-012 — Publicar automação

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST permitir publicar uma automação válida.

Critérios de aceitação:

- todos os campos obrigatórios devem estar válidos;
- automação publicada deve possuir status `ACTIVE`;
- apenas automações ativas podem ser disparadas;
- publicação deve registrar data e versão configurada;
- publicação em modo real deve exigir uma conexão ativa do workspace e conteúdo pertencente a essa conexão;
- publicação em modo simulado deve exigir conexão nula e conteúdo explicitamente simulado.

### FR-AUTO-013 — Pausar automação

**Prioridade:** P1  
**Ator:** Usuário

O sistema SHOULD permitir pausar uma automação ativa.

Critérios de aceitação:

- automação pausada não deve aceitar novos disparos;
- execuções já iniciadas devem seguir política definida, preferencialmente concluir;
- status deve aparecer na lista e no detalhe.

### FR-AUTO-014 — Editar automação

**Prioridade:** P1  
**Ator:** Usuário

O usuário SHOULD poder editar uma automação existente.

A edição deve preservar o histórico das execuções anteriores e aplicar a nova configuração apenas a novas execuções.

## Épico candidato D — Simulação de comentários e automações

### FR-SIM-001 — Simular comentário

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST permitir informar autor, texto e identificador opcional de um comentário simulado.

Critérios de aceitação:

- texto do comentário obrigatório;
- usuário deve poder selecionar um provider disponível no simulador; no MVP, `Instagram` é a única opção;
- usuário não seleciona o modo de execução e o browser não envia esse campo; o backend sempre define `mode=SIMULATED`;
- o comentário é associado a um conteúdo e o worker encontra a automação ativa compatível pelo conteúdo-alvo e palavra-chave, sem seleção manual de automação;
- o sistema deve aceitar comentário que corresponde ou não à palavra-chave;
- no MVP, a execução persiste o provider selecionado e `mode=SIMULATED`;
- a solicitação deve retornar um `executionId`.

### FR-SIM-002 — Avaliar correspondência da palavra-chave

**Prioridade:** P0  
**Ator:** Worker

O worker MUST avaliar se o comentário corresponde ao trigger da automação.

Critérios de aceitação:

- correspondência deve seguir a regra definida para normalização;
- comentário sem correspondência deve ser registrado como ignorado ou sem match;
- comentário correspondente deve gerar as ações configuradas;
- resultado da avaliação deve ser persistido.

### FR-SIM-003 — Processar resposta pública

**Prioridade:** P0  
**Ator:** Worker

Quando houver correspondência, o sistema MUST criar uma resposta pública simulada.

### FR-SIM-004 — Processar DM

**Prioridade:** P0  
**Ator:** Worker

Quando houver correspondência, o sistema MUST criar uma DM simulada vinculada à execução. A criação de conversa pertence à Fase 5.

### FR-SIM-005 — Processar link

**Prioridade:** P0  
**Ator:** Worker

Quando a ação final for link, o sistema MUST registrar e exibir a entrega do link.

### FR-SIM-006 — Processar captura de e-mail

**Prioridade:** P0  
**Ator:** Worker / Usuário simulado

Quando a ação final for captura de e-mail, o sistema MUST registrar que a automação solicitou o e-mail ao seguidor simulado. A coleta do e-mail e a associação a contato e lead pertencem à Fase 5.

### FR-SIM-007 — Consultar status da execução

**Prioridade:** P0  
**Ator:** Usuário

O sistema MUST permitir consultar o estado de uma execução.

A interface MUST apresentar a atividade da automação como interações compreensíveis e atualizá-la em tempo real por SSE. O endpoint HTTP do estado da execução permanece disponível para carregamento e recuperação após reconexão.

Estados mínimos:

```text
PENDING
PROCESSING
COMPLETED
FAILED
IGNORED
```

### FR-SIM-008 — Reprocessar execução com falha

**Prioridade:** P1  
**Ator:** Usuário administrador / Sistema

O sistema SHOULD permitir reprocessar uma execução falha de forma idempotente, sem duplicar mensagens ou leads.

## Épico candidato E — Conversas, contatos e leads

### FR-DATA-001 — Registrar conversa

**Prioridade:** P0  
**Ator:** Sistema

O sistema MUST registrar comentário, resposta pública e DM como mensagens relacionadas a uma conversa simulada.

Cada conversa deve permitir identificar:

- workspace;
- contato ou autor;
- canal simulado;
- automação;
- execution;
- mensagens e timestamps.

### FR-DATA-002 — Listar conversas

**Prioridade:** P1  
**Ator:** Usuário

O usuário SHOULD poder consultar o histórico de conversas do workspace.

Filtros desejáveis:

- período;
- status da execução;
- automação;
- existência de lead;
- tag.

### FR-DATA-003 — Criar ou atualizar contato

**Prioridade:** P0  
**Ator:** Sistema

Ao capturar um e-mail, o sistema MUST criar um novo contato ou atualizar o contato existente dentro do mesmo workspace.

Critérios de aceitação:

- o e-mail deve ser normalizado;
- o mesmo e-mail não deve criar duplicata no workspace;
- contatos de workspaces diferentes permanecem isolados;
- atualização deve preservar histórico existente.

### FR-DATA-004 — Marcar lead

**Prioridade:** P0  
**Ator:** Sistema

O sistema MUST registrar quando um contato se torna lead.

O registro deve incluir, no mínimo:

- contato;
- workspace;
- automação;
- execution;
- data de captura;
- origem simulada.

### FR-DATA-005 — Listar contatos e leads

**Prioridade:** P1  
**Ator:** Usuário

O usuário SHOULD poder listar contatos e leads do workspace ativo.

### FR-DATA-006 — Aplicar e consultar tags

**Prioridade:** P1  
**Ator:** Usuário / Sistema

O sistema SHOULD permitir visualizar as tags de cada contato e aplicar tags através da automação.

## Épico candidato F — Dashboard e métricas

### FR-ANALYTICS-001 — Exibir resumo do workspace

**Prioridade:** P0  
**Ator:** Usuário

O dashboard MUST exibir métricas básicas do workspace ativo.

Métricas mínimas:

- automações ativas;
- comentários simulados processados;
- execuções concluídas;
- DMs simuladas enviadas;
- leads capturados;
- execuções falhas.

### FR-ANALYTICS-002 — Filtrar período

**Prioridade:** P1  
**Ator:** Usuário

O usuário SHOULD poder alterar o período das métricas.

### FR-ANALYTICS-003 — Atualizar métricas após execução

**Prioridade:** P0  
**Ator:** Sistema

Após conclusão de uma execução, as métricas relacionadas MUST refletir os dados persistidos.

## Épico candidato G — E-mails transacionais

### FR-EMAIL-001 — Enfileirar e-mail transacional

**Prioridade:** P0  
**Ator:** Sistema

O sistema MUST enfileirar e-mails de confirmação e, quando implementado, recuperação de senha e convite.

### FR-EMAIL-002 — Enviar e-mail via Resend

**Prioridade:** P0  
**Ator:** Worker / Resend

O worker MUST enviar e-mails pela API do Resend.

Critérios de aceitação:

- chave do Resend deve permanecer apenas no backend;
- falhas transitórias devem permitir retry;
- falha permanente deve marcar o job como falho;
- envio deve possuir logs sem conteúdo sensível desnecessário.

### FR-EMAIL-003 — Reenviar confirmação

**Prioridade:** P1  
**Ator:** Usuário

O usuário SHOULD poder solicitar novo e-mail de confirmação respeitando rate limit.

## Épico candidato H — Operação e monitoramento

### FR-OPS-001 — Visualizar filas

**Prioridade:** P1  
**Ator:** Administrador da plataforma

O administrador MUST poder visualizar filas BullMQ por meio do Bull Board.

Filas mínimas:

- `email-delivery`;
- `automation-execution`;
- `message-delivery`;
- `analytics`.

### FR-OPS-002 — Proteger Bull Board

**Prioridade:** P0  
**Ator:** Sistema

O acesso ao Bull Board MUST exigir autenticação e autorização administrativa.

### FR-OPS-003 — Inspecionar jobs

**Prioridade:** P1  
**Ator:** Administrador da plataforma

O administrador SHOULD poder consultar jobs pendentes, em processamento, concluídos, falhos e atrasados.

### FR-OPS-004 — Reprocessar ou remover job

**Prioridade:** P2  
**Ator:** Administrador da plataforma

O administrador COULD reprocessar ou remover jobs pelo Bull Board, com ações registradas em log.

## Épico futuro — Integração real com Instagram/Meta

Este épico não faz parte do MVP, mas a arquitetura deve permitir sua implementação sem alterar o motor de automações.

### FR-META-001 — Conectar conta profissional

O sistema MUST permitir que um usuário autorizado conecte uma conta profissional do Instagram por OAuth da Meta.

### FR-META-002 — Associar conta ao workspace

Após a conexão, a conta externa MUST ser associada ao workspace ativo e não poderá ser usada por outro workspace sem fluxo explícito de transferência.

### FR-META-003 — Armazenar credenciais com segurança

Tokens e credenciais da Meta MUST ser armazenados criptografados no backend, com status de validade e suporte a revogação/expiração.

### FR-META-004 — Receber comentários via webhook

O sistema MUST receber e validar webhooks da Meta, normalizar o evento e encaminhá-lo para o mesmo pipeline usado pelo simulador.

### FR-META-005 — Receber mensagens via webhook

O sistema MUST normalizar mensagens recebidas do Instagram e associá-las à conversa e ao contato corretos.

### FR-META-006 — Responder comentário

O sistema MUST enviar resposta pública ou private reply por meio do adapter Meta, respeitando permissões, janelas de atendimento e limites do canal.

### FR-META-007 — Enviar mensagem

O sistema MUST enviar mensagens diretas somente quando o contexto e as permissões da Meta permitirem.

### FR-META-008 — Deduplicar eventos externos

O sistema MUST impedir que reentregas do mesmo webhook criem execuções, mensagens, contatos ou leads duplicados.

### FR-META-009 — Desconectar conta

O usuário MUST poder desconectar a conta, interrompendo novos processamentos e invalidando credenciais armazenadas conforme a política de retenção.

### FR-META-010 — Exibir estado da integração

O sistema MUST exibir se a conta está conectada, ativa, com token expirado, com erro de permissão ou desconectada.

## 5.1 Contrato transversal de canais e providers

O MVP será Instagram-first, mas nenhuma regra central de automação deve depender de um enum ou contrato que combine provider e modo de execução.

### FR-CHANNEL-001 — Separar provider e modo de execução

O sistema MUST representar a plataforma e a origem da operação como dimensões independentes:

```text
provider: INSTAGRAM | FACEBOOK | TWITTER
mode:     SIMULATED | REAL
```

O MVP usará `provider=INSTAGRAM` e `mode=SIMULATED`. Valores compostos como `SIMULATED_INSTAGRAM` não devem ser criados.

No simulador, o usuário escolhe um provider dentre as opções disponibilizadas pelo sistema. O modo não é uma escolha de interface nem um campo confiável do request: o backend sempre define `mode=SIMULATED`. Inicialmente, apenas `INSTAGRAM` estará disponível nesse seletor.

### FR-CHANNEL-002 — Normalizar interações e mensagens

O sistema MUST converter payloads de providers para contratos internos normalizados:

```text
IncomingInteraction
IncomingMessage
PublicReply
PrivateReply
DirectMessage
```

O motor de automações, as filas e os casos de uso não devem receber payloads específicos da Meta, Facebook ou Twitter/X.

### FR-CHANNEL-003 — Declarar capacidades do canal

Cada provider MUST declarar, por meio de um `ChannelCapabilities`, se suporta:

- receber comentários;
- enviar resposta pública;
- enviar private reply;
- enviar mensagem direta;
- exigir janela de conversação.

Uma automação não poderá ser publicada ou executada com uma ação incompatível com as capacidades do provider selecionado.

### FR-CHANNEL-004 — Isolar adapters de provider

OAuth, webhooks, tokens, IDs externos, limites e formatos de payload devem ficar no adapter do provider. Adicionar Facebook ou Twitter/X deverá exigir um novo adapter e seus testes, sem duplicar o motor de automações.

### FR-CHANNEL-005 — Preservar rastreabilidade do canal

Conversas, mensagens, contatos, leads, eventos externos e execuções devem preservar `provider`, `mode` e, quando aplicável, `channelConnectionId`.

### FR-CHANNEL-006 — Separar provider de conexão

`Provider` MUST ser um catálogo técnico controlado pelo sistema. Uma conta externa cadastrada pelo usuário MUST ser representada por uma `ChannelConnection`, sem reutilizar a entidade `Account` do Better Auth.

### FR-CHANNEL-007 — Administrar conexões por workspace

O sistema MUST listar e administrar somente as conexões do workspace ativo. Cada conexão deve informar provider, nome de exibição e estado sanitizado, sem retornar tokens ou credenciais ao frontend.

Uma conta externa não pode ficar ativa em dois workspaces sem um fluxo explícito de transferência.

### FR-CHANNEL-008 — Direcionar revisão para uma conexão

Cada revisão de automação MUST possuir no máximo um alvo. No modo real, o alvo publicado deve referenciar exatamente uma `ChannelConnection` ativa e exatamente um conteúdo pertencente a ela.

Trocar a conexão deve remover uma seleção de conteúdo incompatível. Para usar a mesma configuração em mais de uma conta, o usuário deve criar ou duplicar outra automação.

### FR-CHANNEL-009 — Preservar simulação sem conexão fictícia

O modo simulado MUST funcionar com `channelConnectionId=null`. A opção `Instagram — Simulador` pode ser apresentada pela interface, mas não deve criar uma linha fictícia de conexão nem armazenar credenciais.

## 6. Regras de negócio transversais

### RN-001 — Isolamento por Organization

Todo dado de negócio deve pertencer a uma Organization e toda operação autenticada deve validar o membership do usuário.

### RN-002 — Automação publicada

Somente automações publicadas e ativas podem processar novos comentários.

### RN-003 — Histórico imutável de execução

Alterações posteriores na automação não devem modificar o resultado ou o conteúdo de execuções já concluídas.

### RN-004 — Idempotência

Reprocessar o mesmo evento ou job não deve duplicar conversas, mensagens, contatos, leads ou tags.

### RN-005 — Falha de uma execução

Uma falha em uma execução deve ser registrada sem derrubar o worker ou impedir o processamento de outros jobs.

### RN-006 — Fonte de verdade

PostgreSQL é a fonte de verdade para automações, execuções, conversas, contatos, leads e métricas derivadas.

### RN-007 — Simulação não representa provider real

Dados simulados devem ser identificáveis como simulação e não podem ser apresentados como mensagens realmente enviadas por um provider externo.

O provider pode ser selecionado no simulador, mas toda execução criada por esse fluxo deve ter `mode=SIMULATED` imposto pelo backend.

### RN-008 — Contexto ativo obrigatório

Operações de produto exigem usuário autenticado e Organization ativa, exceto endpoints públicos de autenticação e health check.

### RN-009 — Coerência do alvo da automação

Provider, modo, conexão e conteúdo de um alvo devem pertencer ao mesmo workspace e formar uma combinação coerente. No modo real, `AutomationTarget.channelConnectionId` deve corresponder a `Content.channelConnectionId`; no modo simulado, ambos devem ser nulos.

### RN-010 — Conexão utilizável

Uma automação real somente pode ser publicada ou iniciar nova execução quando sua conexão está `ACTIVE` e possui as capacidades exigidas pelas ações da revisão. Expiração, revogação ou desconexão não apaga revisões nem execuções históricas.

## 7. Estados funcionais

### 7.1 Automação

```text
DRAFT → ACTIVE → PAUSED
  └──────────────→ ARCHIVED
```

### 7.2 Execução

```text
PENDING → PROCESSING → COMPLETED
                    ├→ FAILED
                    └→ IGNORED
```

### 7.3 Contato/lead

```text
CONTACT → LEAD
```

Um contato pode existir sem ser lead. Um lead deve estar associado a uma captura válida.

## 8. Contratos mínimos de API

Os nomes abaixo são referências funcionais; os schemas finais serão definidos em `packages/contracts`.

### Autenticação

As rotas de Better Auth serão expostas sob:

```text
/api/auth/*
```

### Workspaces

```text
GET  /api/v1/workspaces
GET  /api/v1/workspaces/active
POST /api/v1/workspaces/active
```

### Conexões de canais — integração real

```text
GET    /api/v1/channel-connections
GET    /api/v1/channel-connections/:id
POST   /api/v1/channel-connections/:provider/connect
POST   /api/v1/channel-connections/:id/revalidate
POST   /api/v1/channel-connections/:id/disconnect
GET    /api/v1/channel-connections/:id/contents
```

Callbacks OAuth podem usar rotas específicas do provider, mas devem delegar ao módulo `Channels` e nunca expor tokens ao browser.

### Automações

```text
GET    /api/v1/automations
POST   /api/v1/automations
GET    /api/v1/automations/:id
PATCH  /api/v1/automations/:id
POST   /api/v1/automations/:id/publish
POST   /api/v1/automations/:id/pause
```

### Simulações

```text
POST /api/v1/simulations/comments
GET  /api/v1/simulations/executions/:id
POST /api/v1/simulations/executions/:id/retry
```

### Conversas e dados

```text
GET /api/v1/conversations
GET /api/v1/contacts
GET /api/v1/leads
```

### Dashboard

```text
GET /api/v1/analytics/summary
```

## 9. Critérios de aceite do MVP

O MVP será considerado funcional quando um usuário conseguir:

1. criar uma conta com e-mail/senha;
2. confirmar o e-mail;
3. acessar um workspace padrão;
4. criar uma automação pelo formulário;
5. configurar palavra-chave, resposta, DM e ação final;
6. publicar a automação;
7. simular um comentário correspondente;
8. visualizar o job sendo processado pelo worker;
9. visualizar resposta pública e DM simuladas;
10. capturar um e-mail ou entregar um link;
11. visualizar o contato/lead e a conversa;
12. visualizar as métricas atualizadas;
13. acessar o fluxo com Google em um ambiente configurado;
14. manter dados isolados por workspace;
15. consultar filas pelo Bull Board como administrador.

## 10. Épicos candidatos consolidados

### EPIC-01 — Autenticação e acesso

Requisitos: `FR-AUTH-001` a `FR-AUTH-006`.

### EPIC-02 — Workspaces e isolamento multi-tenant

Requisitos: `FR-WORK-001` a `FR-WORK-005` e `RN-001`, `RN-008`.

### EPIC-03 — Gestão de automações

Requisitos: `FR-AUTO-001` a `FR-AUTO-014`.

### EPIC-04 — Simulação do fluxo Instagram-first

Requisitos: `FR-SIM-001` a `FR-SIM-008` e `RN-002` a `RN-005`.

### EPIC-05 — Conversas, contatos e leads

Requisitos: `FR-DATA-001` a `FR-DATA-006`.

### EPIC-06 — Dashboard e métricas

Requisitos: `FR-ANALYTICS-001` a `FR-ANALYTICS-003`.

### EPIC-07 — E-mails transacionais

Requisitos: `FR-EMAIL-001` a `FR-EMAIL-003`.

### EPIC-08 — Operação e monitoramento de filas

Requisitos: `FR-OPS-001` a `FR-OPS-004`.

### EPIC-09 — Integração real com Instagram/Meta (primeiro provider real)

Requisitos: `FR-META-001` a `FR-META-010` e `FR-CHANNEL-006` a `FR-CHANNEL-009`.

Este épico reutiliza o motor de automações, os contratos normalizados, as capacidades e as filas do MVP. Sua implementação adiciona o módulo `Channels`, lifecycle de `ChannelConnection`, seleção de conta/conteúdo, OAuth, webhooks e um adapter real do Instagram/Meta, sem criar um segundo fluxo de automação. Facebook e Twitter/X poderão ser adicionados posteriormente seguindo o mesmo contrato.

## 11. Dependências entre épicos

```text
EPIC-01 Autenticação
       ↓
EPIC-02 Workspaces
       ↓
EPIC-03 Automações
       ↓
EPIC-04 Simulação
       ↓
EPIC-05 Conversas/Leads
       ↓
EPIC-06 Dashboard
```

Dependências paralelas:

- `EPIC-07 E-mails` começa junto com `EPIC-01`;
- `EPIC-08 Operação` começa junto com `EPIC-04`.
- `EPIC-09 Integração Meta` depende de `EPIC-03`, `EPIC-04`, `EPIC-05`, `EPIC-07` e da aprovação do aplicativo na Meta.

## 12. Decisões ainda necessárias antes das histórias

Estas decisões não impedem a criação dos épicos, mas devem ser definidas antes da implementação detalhada:

- limite exato de caracteres para nome, palavra-chave e mensagens;
- regra final de correspondência da palavra-chave;
- formato da ação de captura de e-mail na simulação;
- papéis administrativos para acesso ao Bull Board;
- estratégia de paginação e filtros;
- política de retenção de jobs BullMQ;
- provedor e domínio de envio do Resend;
- nomes finais das rotas de Better Auth e callback do Google.
