# Engancha

O Engancha transforma interações em canais sociais em jornadas automatizadas, histórico de relacionamento e oportunidades identificáveis dentro de um workspace.

## Language

**Workspace**:
Escopo de negócio e isolamento de todos os dados de produto de uma Organization ativa.
_Avoid_: conta, tenant, organização do usuário

**Contato**:
Pessoa que interagiu com um workspace, identificada no contexto de um provider e modo, mesmo antes de fornecer e-mail.
_Avoid_: usuário, seguidor, cliente

**Conversa**:
Histórico ordenado das mensagens trocadas entre um contato e um workspace no mesmo provider, modo e conexão de canal.
_Avoid_: execução, atividade, chat isolado

**Mensagem**:
Interação de entrada ou saída visível no histórico de uma conversa, com direção, tipo, canal, modo e momento próprios.
_Avoid_: evento, saída de job, log de execução

**Solicitação de captura de e-mail**:
Pedido feito por uma automação para que um contato informe seu e-mail; no máximo uma permanece pendente por conversa.
_Avoid_: execução pendente, lead pendente, formulário

**Lead**:
Contato que forneceu um e-mail válido e entrou no funil do workspace; não é uma pessoa separada nem uma nova identidade.
_Avoid_: contato, captura, conversão repetida

**Tag**:
Etiqueta normalizada do workspace aplicada a um contato para representar segmentação ou origem de interesse.
_Avoid_: status, categoria global, etiqueta de lead

**Execução de automação**:
Aplicação imutável de uma revisão publicada a uma interação recebida; seu término não depende de uma resposta futura do contato.
_Avoid_: conversa, solicitação de captura, job
