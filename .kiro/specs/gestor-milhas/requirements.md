# Documento de Requisitos — Gestor Milhas

## Introdução

Sistema web para gestão individual de milhas e pontos de programas de fidelidade, com suporte administrativo para controle de múltiplos usuários. O sistema permite o acompanhamento de saldos, preço médio, movimentações (compras, transferências, bonificações), emissão de passagens, clubes de milhas e agendamentos automáticos. Possui dois perfis de acesso: Admin e Usuário.

## Glossário

- **Sistema**: O sistema web Gestor Milhas como um todo
- **Admin**: Usuário com perfil administrativo que gerencia outros usuários, catálogos e dados globais
- **Usuário**: Pessoa cadastrada pelo Admin que gerencia seus próprios dados de milhas
- **Programa**: Programa de fidelidade (tipo banco ou companhia aérea) onde milhas/pontos são acumulados
- **Companhia_Aérea**: Entidade representando uma companhia aérea associada a programas do tipo aéreo
- **Banco**: Instituição bancária associada a cartões de crédito
- **Conta_Fidelidade**: Registro do saldo de milhas de um Usuário em um Programa específico
- **Cartão**: Cartão de crédito vinculado a um Usuário
- **Clube**: Assinatura de clube de milhas vinculada a um Programa
- **Movimentação**: Operação de entrada ou saída de milhas (compra, bônus, pontos de cartão, ajuste)
- **Compra_Bonificada**: Compra de produto que gera pontos proporcionais ao valor gasto
- **Transferência**: Movimentação de milhas entre dois Programas, podendo incluir bônus e bumerangue
- **Emissão**: Resgate de milhas para emissão de passagem aérea
- **Agendamento**: Tarefa programada para execução futura baseada em data (timezone America/Sao_Paulo)
- **Preço_Médio**: Custo por milheiro calculado pela fórmula `valor_total / (milhas / 1000)`
- **Custo_Total_Emissão**: Custo total de uma emissão calculado por `(milhas/1000 * preço_médio) + valor_dinheiro`
- **Economia**: Diferença entre o valor real da passagem e o Custo_Total_Emissão
- **Landing_Page**: Página pública de apresentação do sistema
- **Dashboard**: Painel principal com métricas e resumos após login
- **Formulário_Contato**: Formulário público para envio de mensagens
- **Pagamento**: Registro financeiro associado a uma Movimentação ou Clube

## Requisitos

### Requisito 1: Autenticação e Controle de Acesso

**User Story:** Como Admin, eu quero criar e gerenciar contas de usuários com login por email e senha, para que apenas pessoas autorizadas acessem o sistema.

#### Critérios de Aceitação

1. THE Sistema SHALL autenticar Usuários e Admins por email e senha.
2. THE Sistema SHALL impedir o auto cadastro de novos Usuários.
3. WHEN um Admin cria um novo Usuário, THE Sistema SHALL registrar o Usuário com status pendente de completar cadastro.
4. WHEN um Usuário realiza o primeiro login, THE Sistema SHALL redirecionar o Usuário para o fluxo obrigatório de completar cadastro.
5. WHILE um Usuário possui cadastro incompleto, THE Sistema SHALL bloquear o acesso às demais funcionalidades até a conclusão do cadastro.
6. THE Sistema SHALL restringir o acesso de cada Usuário apenas aos seus próprios dados.
7. THE Sistema SHALL permitir que o Admin acesse e insira dados em nome de qualquer Usuário sob sua gestão.

### Requisito 2: Páginas Públicas

**User Story:** Como visitante, eu quero acessar páginas públicas do sistema, para que eu conheça os benefícios e funcionalidades antes de fazer login.

#### Critérios de Aceitação

1. THE Sistema SHALL exibir uma Landing_Page com apresentação do sistema e seus benefícios.
2. THE Sistema SHALL exibir uma página de funcionalidades com explicação das features disponíveis.
3. THE Sistema SHALL exibir uma página com Formulário_Contato para envio de mensagens.
4. THE Sistema SHALL exibir um botão de login no canto superior direito de todas as páginas públicas.
5. WHEN um visitante submete o Formulário_Contato com dados válidos, THE Sistema SHALL registrar a mensagem.
6. IF um visitante submete o Formulário_Contato com dados inválidos, THEN THE Sistema SHALL exibir mensagens de erro específicas por campo.

### Requisito 3: Cadastro do Usuário

**User Story:** Como Usuário, eu quero completar meu cadastro com dados pessoais e endereço, para que eu possa utilizar o sistema.

#### Critérios de Aceitação

1. THE Sistema SHALL coletar os seguintes dados pessoais do Usuário: nome completo, CPF, data de nascimento, email e telefone.
2. THE Sistema SHALL coletar os seguintes dados de endereço do Usuário: CEP, estado, cidade, rua, número, complemento e bairro.
3. WHEN o Usuário informa um CEP válido, THE Sistema SHALL preencher automaticamente os campos de estado, cidade, rua e bairro.
4. IF o Usuário informa um CEP inválido, THEN THE Sistema SHALL exibir uma mensagem de erro indicando CEP não encontrado.
5. THE Sistema SHALL validar o formato do CPF informado.
6. THE Sistema SHALL validar o formato do email informado.

### Requisito 4: Programas de Fidelidade

**User Story:** Como Admin, eu quero cadastrar e gerenciar programas de fidelidade, para que os Usuários possam vincular suas milhas a programas específicos.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir que o Admin cadastre Programas com os campos: nome, tipo (banco ou companhia aérea), companhia aérea associada, limite de CPF para emissão e status ativo/inativo.
2. WHEN o tipo do Programa é "companhia aérea", THE Sistema SHALL exigir a associação a uma Companhia_Aérea.
3. WHEN o tipo do Programa é "banco", THE Sistema SHALL ocultar o campo de Companhia_Aérea.
4. THE Sistema SHALL permitir que o Admin ative ou desative um Programa.
5. IF o Admin tenta cadastrar um Programa do tipo "companhia aérea" sem associar uma Companhia_Aérea, THEN THE Sistema SHALL exibir uma mensagem de erro solicitando a associação.

### Requisito 5: Conta de Fidelidade (Controle de Milhas por Usuário)

**User Story:** Como Usuário, eu quero visualizar e acompanhar meu saldo de milhas por programa, para que eu saiba quanto tenho disponível e o custo médio.

#### Critérios de Aceitação

1. THE Sistema SHALL manter uma Conta_Fidelidade para cada combinação de Usuário e Programa, contendo: quantidade de milhas, preço médio (R$/milheiro) e quantidade de CPFs disponíveis.
2. THE Sistema SHALL calcular o Preço_Médio usando a fórmula `valor_total / (milhas / 1000)`.
3. WHEN uma Movimentação, Transferência, Clube ou Compra_Bonificada altera o saldo de milhas, THE Sistema SHALL recalcular o Preço_Médio da Conta_Fidelidade correspondente.
4. THE Sistema SHALL exibir o saldo atual de milhas, o Preço_Médio e os CPFs disponíveis por Programa para o Usuário.

### Requisito 6: Cartões de Crédito

**User Story:** Como Usuário, eu quero cadastrar meus cartões de crédito, para que eu possa acompanhar limites, vencimentos e status.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir que o Usuário cadastre Cartões com os campos: banco, nome do cartão, dia de fechamento, dia de vencimento, limite, anuidade e status (ativo/inativo).
2. THE Sistema SHALL permitir que o Admin cadastre campos adicionais do Cartão: renda mínima, pontuação, bandeira, programa sala VIP e observação.
3. THE Sistema SHALL permitir que o Usuário ative ou desative um Cartão.
4. WHEN o Usuário lista seus Cartões, THE Sistema SHALL exibir todos os Cartões vinculados ao Usuário com seus respectivos dados.

### Requisito 7: Clubes de Milhas

**User Story:** Como Usuário, eu quero cadastrar assinaturas de clubes de milhas, para que o sistema gerencie automaticamente a entrada mensal de milhas e despesas.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir o cadastro de Clube com os campos: programa, plano, milhas por mês, valor mensal, data de início, data de fim, dia de cobrança e forma de pagamento.
2. WHEN a data de cobrança mensal de um Clube é atingida, THE Sistema SHALL gerar automaticamente uma entrada de milhas na Conta_Fidelidade correspondente.
3. WHEN a data de cobrança mensal de um Clube é atingida, THE Sistema SHALL criar automaticamente um registro de despesa (Pagamento) associado.
4. WHEN a entrada de milhas do Clube é processada, THE Sistema SHALL recalcular o Preço_Médio da Conta_Fidelidade correspondente.
5. THE Sistema SHALL criar Agendamentos mensais para cada Clube ativo, baseados no dia de cobrança.
6. WHILE um Clube está dentro do período entre data de início e data de fim, THE Sistema SHALL manter os Agendamentos mensais ativos.
7. WHEN a data de fim de um Clube é atingida, THE Sistema SHALL encerrar os Agendamentos mensais do Clube.

### Requisito 8: Movimentações — Compra de Pontos

**User Story:** Como Usuário, eu quero registrar compras de pontos/milhas, para que meu saldo e preço médio sejam atualizados corretamente.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir o registro de Movimentação com os campos: programa, quantidade de milhas, data e tipo (compra, bônus, pontos do cartão ou ajuste manual).
2. THE Sistema SHALL aceitar o valor da Movimentação em dois formatos: valor total (VT) ou valor por milheiro (VM).
3. WHEN uma Movimentação é registrada com valor no formato VM, THE Sistema SHALL calcular o valor total como `VM * (milhas / 1000)`.
4. WHEN uma Movimentação é registrada com valor no formato VT, THE Sistema SHALL calcular o valor por milheiro como `VT / (milhas / 1000)`.
5. WHEN uma Movimentação é registrada, THE Sistema SHALL atualizar o saldo de milhas da Conta_Fidelidade correspondente.
6. WHEN uma Movimentação é registrada, THE Sistema SHALL recalcular o Preço_Médio da Conta_Fidelidade correspondente.
7. WHEN uma Movimentação é registrada, THE Sistema SHALL criar um registro de Pagamento associado.

### Requisito 9: Movimentações — Compra Bonificada

**User Story:** Como Usuário, eu quero registrar compras bonificadas, para que os pontos gerados sejam agendados e creditados automaticamente na data correta.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir o registro de Compra_Bonificada com os campos: programa, produto, loja, pontos por real, valor total, data da compra, data de recebimento do produto e data de recebimento dos pontos.
2. WHEN uma Compra_Bonificada é registrada, THE Sistema SHALL calcular a quantidade de pontos como `pontos_por_real * valor_total`.
3. WHEN uma Compra_Bonificada é registrada, THE Sistema SHALL criar um Agendamento para creditar os pontos na data de recebimento dos pontos.
4. WHEN a data de recebimento dos pontos de uma Compra_Bonificada é atingida, THE Sistema SHALL atualizar o saldo de milhas da Conta_Fidelidade correspondente.
5. WHEN a data de recebimento dos pontos de uma Compra_Bonificada é atingida, THE Sistema SHALL recalcular o Preço_Médio da Conta_Fidelidade correspondente.

### Requisito 10: Movimentações — Transferência

**User Story:** Como Usuário, eu quero transferir milhas entre programas, para que eu possa consolidar pontos e aproveitar bônus de transferência.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir o registro de Transferência com os campos: programa de origem, programa de destino, quantidade de milhas, percentual de bônus, data da transferência, data de recebimento e data de recebimento do bônus.
2. WHEN uma Transferência é registrada, THE Sistema SHALL debitar as milhas do programa de origem imediatamente.
3. WHEN uma Transferência é registrada, THE Sistema SHALL criar um Agendamento para creditar as milhas no programa de destino na data de recebimento.
4. WHEN o percentual de bônus da Transferência é maior que zero, THE Sistema SHALL calcular as milhas de bônus como `quantidade * (percentual_bônus / 100)`.
5. WHEN a data de recebimento do bônus é atingida, THE Sistema SHALL creditar as milhas de bônus na Conta_Fidelidade do programa de destino.
6. WHEN milhas são creditadas no programa de destino, THE Sistema SHALL recalcular o Preço_Médio da Conta_Fidelidade de destino considerando o custo proporcional da origem.
7. WHERE a opção "compra no carrinho" está habilitada, THE Sistema SHALL adicionar o custo da compra ao custo total da Transferência para cálculo do Preço_Médio.
8. WHERE a opção "bumerangue" está habilitada, THE Sistema SHALL criar um Agendamento separado para retornar parte dos pontos ao programa de origem.

### Requisito 11: Emissão de Passagem

**User Story:** Como Usuário, eu quero registrar emissões de passagens aéreas com milhas, para que o sistema calcule o custo real e a economia obtida.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir o registro de Emissão com os campos: programa, data, CPF utilizado, milhas usadas, valor pago em dinheiro, localizador, passageiro, valor real da passagem e observação.
2. WHEN uma Emissão é registrada, THE Sistema SHALL debitar as milhas usadas da Conta_Fidelidade do programa correspondente.
3. WHEN uma Emissão é registrada em um programa de companhia aérea, THE Sistema SHALL decrementar a quantidade de CPFs disponíveis na Conta_Fidelidade correspondente.
4. THE Sistema SHALL calcular o Custo_Total_Emissão usando a fórmula `(milhas / 1000 * preço_médio) + valor_dinheiro`.
5. THE Sistema SHALL calcular a Economia da Emissão usando a fórmula `valor_real_passagem - Custo_Total_Emissão`.
6. IF o saldo de milhas da Conta_Fidelidade é insuficiente para a Emissão, THEN THE Sistema SHALL exibir uma mensagem de erro indicando saldo insuficiente.
7. IF a quantidade de CPFs disponíveis é zero para um programa de companhia aérea, THEN THE Sistema SHALL exibir uma mensagem de erro indicando limite de CPF atingido.

### Requisito 12: Sistema de Agendamentos

**User Story:** Como Usuário, eu quero que o sistema processe automaticamente operações agendadas, para que saldos e despesas sejam atualizados nas datas corretas.

#### Critérios de Aceitação

1. THE Sistema SHALL suportar Agendamentos para as seguintes operações: cobranças de Clube, créditos de Compra_Bonificada, créditos de Transferência, créditos de bônus de Transferência e retornos de bumerangue.
2. THE Sistema SHALL processar Agendamentos diariamente utilizando o timezone America/Sao_Paulo.
3. WHEN a data de execução de um Agendamento é atingida, THE Sistema SHALL executar a operação associada ao Agendamento.
4. WHEN um Agendamento é executado com sucesso, THE Sistema SHALL marcar o Agendamento como concluído.
5. IF um Agendamento falha durante a execução, THEN THE Sistema SHALL registrar o erro e manter o Agendamento como pendente para reprocessamento.
6. THE Sistema SHALL permitir que o Usuário visualize seus Agendamentos pendentes com data prevista e tipo de operação.

### Requisito 13: Dashboard do Usuário

**User Story:** Como Usuário, eu quero visualizar um painel com resumo das minhas milhas e finanças, para que eu tenha uma visão geral rápida da minha situação.

#### Critérios de Aceitação

1. THE Sistema SHALL exibir no Dashboard do Usuário o total de milhas agrupado por Programa.
2. THE Sistema SHALL exibir no Dashboard do Usuário o Preço_Médio por Programa.
3. THE Sistema SHALL exibir no Dashboard do Usuário o total investido em milhas.
4. THE Sistema SHALL exibir no Dashboard do Usuário o total economizado em emissões.
5. THE Sistema SHALL exibir no Dashboard do Usuário a lista de próximos recebimentos (Agendamentos pendentes).

### Requisito 14: Dashboard do Admin

**User Story:** Como Admin, eu quero visualizar KPIs globais e por usuário, para que eu acompanhe a economia e o desempenho dos usuários sob minha gestão.

#### Critérios de Aceitação

1. THE Sistema SHALL exibir no Dashboard do Admin a economia total dos Usuários gerenciados pelo Admin.
2. THE Sistema SHALL exibir no Dashboard do Admin a economia global de todos os Usuários do sistema.
3. THE Sistema SHALL exibir no Dashboard do Admin a lista de Usuários com seus respectivos dados resumidos.
4. WHEN o Admin seleciona um Usuário na lista, THE Sistema SHALL exibir os detalhes de milhas e economia do Usuário selecionado.

### Requisito 15: Métricas e Relatórios

**User Story:** Como Usuário e Admin, eu quero acessar métricas consolidadas, para que eu possa avaliar o retorno dos investimentos em milhas.

#### Critérios de Aceitação

1. THE Sistema SHALL calcular e exibir para cada Usuário: total investido, total economizado e saldo atual de milhas por Programa.
2. THE Sistema SHALL calcular e exibir para o Admin: economia por Usuário gerenciado e economia global.
3. WHEN uma Movimentação, Transferência, Clube, Compra_Bonificada ou Emissão é registrada, THE Sistema SHALL atualizar as métricas do Usuário correspondente.

### Requisito 16: Gestão de Catálogos (Admin)

**User Story:** Como Admin, eu quero gerenciar os catálogos do sistema (companhias aéreas, bancos), para que os dados de referência estejam sempre atualizados.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir que o Admin cadastre, edite e desative Companhias Aéreas.
2. THE Sistema SHALL permitir que o Admin cadastre, edite e desative Bancos.
3. THE Sistema SHALL utilizar os catálogos de Companhias Aéreas e Bancos como referência nos cadastros de Programas e Cartões.
4. IF o Admin tenta desativar uma Companhia_Aérea ou Banco vinculado a registros ativos, THEN THE Sistema SHALL exibir um aviso informando os registros vinculados.
