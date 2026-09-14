# Documento de Requisitos — Redefinição de Senha

## Introdução

Este documento especifica os requisitos para a funcionalidade de redefinição de senha (password reset) do sistema Gestor Milhas. O fluxo permite que usuários que esqueceram sua senha solicitem um link de redefinição por email, verifiquem o token e definam uma nova senha. O modelo segue o padrão de segurança do projeto MundoMilhas_Authentication, utilizando tokens UUID com expiração e respostas genéricas para prevenir enumeração de emails.

## Glossário

- **Sistema**: O sistema Gestor Milhas (backend + frontend)
- **API**: A camada de backend Express que expõe endpoints REST
- **Serviço_de_Email**: Módulo responsável por enviar emails via SMTP usando nodemailer
- **Token_de_Reset**: Token UUID v4 gerado para identificar uma solicitação de redefinição de senha, armazenado no modelo PasswordResetToken
- **Usuário**: Pessoa cadastrada no sistema com registro na tabela users
- **Formulário_de_Solicitação**: Página frontend onde o usuário informa seu email para solicitar a redefinição
- **Página_de_Redefinição**: Página frontend onde o usuário define sua nova senha após clicar no link recebido por email
- **Tempo_de_Expiração**: Período configurável (padrão 30 minutos) após o qual o Token_de_Reset se torna inválido

## Requisitos

### Requisito 1: Solicitação de Redefinição de Senha

**User Story:** Como um usuário que esqueceu sua senha, eu quero solicitar um link de redefinição por email, para que eu possa recuperar o acesso à minha conta.

#### Critérios de Aceitação

1. WHEN o Usuário submete o Formulário_de_Solicitação com um email válido, THE API SHALL retornar uma mensagem genérica de sucesso com status HTTP 200, independentemente de o email existir no sistema
2. WHEN o Usuário submete um email que corresponde a um registro existente na tabela users, THE API SHALL gerar um Token_de_Reset UUID v4 com data de expiração igual ao momento atual acrescido do Tempo_de_Expiração
3. WHEN o Token_de_Reset é gerado com sucesso, THE Serviço_de_Email SHALL enviar um email para o endereço informado contendo um link no formato `{FRONTEND_URL}/redefinir-senha/{token}`
4. WHEN o Usuário submete um email que não corresponde a nenhum registro na tabela users, THE API SHALL retornar a mesma mensagem genérica de sucesso sem enviar email
5. THE API SHALL armazenar o Token_de_Reset no banco de dados com os campos: token (UUID), userId (referência ao usuário), expiresAt (data de expiração) e usedAt (nulo até ser utilizado)
6. WHEN o Usuário submete o Formulário_de_Solicitação com um email em formato inválido, THE API SHALL retornar erro de validação com status HTTP 400

### Requisito 2: Verificação do Token de Redefinição

**User Story:** Como um usuário que recebeu o email de redefinição, eu quero que o sistema verifique se meu link é válido ao clicar nele, para que eu saiba se posso prosseguir com a redefinição.

#### Critérios de Aceitação

1. WHEN o Usuário acessa a Página_de_Redefinição com um Token_de_Reset válido e não expirado, THE API SHALL retornar status HTTP 200 com o email associado ao token
2. WHEN o Usuário acessa a Página_de_Redefinição com um Token_de_Reset que não existe no banco de dados, THE API SHALL retornar erro com status HTTP 404
3. WHEN o Usuário acessa a Página_de_Redefinição com um Token_de_Reset cuja data de expiração já passou, THE API SHALL retornar erro com status HTTP 410 e mensagem indicando que o link expirou
4. WHEN o Usuário acessa a Página_de_Redefinição com um Token_de_Reset que já possui campo usedAt preenchido, THE API SHALL retornar erro com status HTTP 410 e mensagem indicando que o link já foi utilizado

### Requisito 3: Redefinição da Senha

**User Story:** Como um usuário com um link válido de redefinição, eu quero definir uma nova senha, para que eu possa acessar minha conta novamente.

#### Critérios de Aceitação

1. WHEN o Usuário submete uma nova senha válida junto com um Token_de_Reset válido e não expirado, THE API SHALL atualizar o campo passwordHash do Usuário com o hash bcryptjs da nova senha
2. WHEN a senha é atualizada com sucesso, THE API SHALL marcar o Token_de_Reset como utilizado preenchendo o campo usedAt com a data e hora atual
3. WHEN a senha é atualizada com sucesso, THE API SHALL retornar status HTTP 200 com mensagem de confirmação
4. WHEN o Usuário submete uma nova senha com menos de 8 caracteres, THE API SHALL retornar erro de validação com status HTTP 400
5. WHEN o Usuário submete uma redefinição com um Token_de_Reset expirado, THE API SHALL retornar erro com status HTTP 410
6. WHEN o Usuário submete uma redefinição com um Token_de_Reset já utilizado, THE API SHALL retornar erro com status HTTP 410
7. WHEN o Usuário submete uma redefinição com um Token_de_Reset inexistente, THE API SHALL retornar erro com status HTTP 404

### Requisito 4: Envio de Email de Redefinição

**User Story:** Como um usuário, eu quero receber um email claro com instruções de redefinição, para que eu saiba exatamente o que fazer para recuperar minha conta.

#### Critérios de Aceitação

1. THE Serviço_de_Email SHALL enviar o email de redefinição contendo versão em texto puro e versão HTML
2. THE Serviço_de_Email SHALL incluir no email o link de redefinição, o tempo de expiração do link e instruções para ignorar o email caso o Usuário não tenha solicitado a redefinição
3. THE Serviço_de_Email SHALL utilizar configuração SMTP definida por variáveis de ambiente (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
4. IF o envio do email falhar por erro de conexão SMTP, THEN THE API SHALL registrar o erro em log e retornar a mesma mensagem genérica de sucesso ao Usuário

### Requisito 5: Modelo de Dados PasswordResetToken

**User Story:** Como desenvolvedor, eu quero um modelo de dados dedicado para tokens de redefinição, para que o sistema armazene e gerencie os tokens de forma estruturada.

#### Critérios de Aceitação

1. THE Sistema SHALL criar o modelo PasswordResetToken no schema Prisma com os campos: id (UUID, chave primária), token (UUID, único), userId (referência à tabela users), expiresAt (DateTime), usedAt (DateTime opcional) e createdAt (DateTime com valor padrão now)
2. THE Sistema SHALL criar um índice único no campo token do modelo PasswordResetToken
3. THE Sistema SHALL criar uma relação entre PasswordResetToken e User via campo userId com ação de cascade delete

### Requisito 6: Página de Solicitação de Redefinição (Frontend)

**User Story:** Como um usuário que esqueceu sua senha, eu quero uma página acessível a partir do login onde eu possa informar meu email, para que eu receba o link de redefinição.

#### Critérios de Aceitação

1. THE Formulário_de_Solicitação SHALL exibir um campo de email com validação Zod (formato de email válido e campo obrigatório)
2. WHILE o Formulário_de_Solicitação está processando a requisição, THE Sistema SHALL exibir estado de carregamento no botão de envio e desabilitar o formulário
3. WHEN a requisição é concluída com sucesso, THE Formulário_de_Solicitação SHALL exibir mensagem de sucesso informando que o email será enviado caso o endereço esteja cadastrado
4. THE Formulário_de_Solicitação SHALL exibir um link "Voltar para o login" que navega para a rota /login
5. THE Página de Login SHALL exibir um link "Esqueceu a senha?" que navega para a rota /esqueci-senha

### Requisito 7: Página de Redefinição de Senha (Frontend)

**User Story:** Como um usuário que clicou no link de redefinição, eu quero uma página onde eu possa definir minha nova senha, para que eu recupere o acesso à minha conta.

#### Critérios de Aceitação

1. WHEN a Página_de_Redefinição é carregada, THE Sistema SHALL extrair o token da URL e chamar o endpoint de verificação do token
2. WHEN o token é válido, THE Página_de_Redefinição SHALL exibir o formulário com campos de nova senha e confirmação de senha
3. WHEN o token é inválido ou expirado, THE Página_de_Redefinição SHALL exibir mensagem de erro e link para solicitar novo link de redefinição
4. THE Página_de_Redefinição SHALL validar que a nova senha possui no mínimo 8 caracteres
5. THE Página_de_Redefinição SHALL validar que os campos de nova senha e confirmação de senha são idênticos
6. WHEN a redefinição é concluída com sucesso, THE Página_de_Redefinição SHALL exibir mensagem de sucesso e link para navegar à página de login

### Requisito 8: Configuração de Infraestrutura de Email

**User Story:** Como desenvolvedor, eu quero que o sistema tenha a infraestrutura de envio de email configurada, para que a funcionalidade de redefinição de senha funcione corretamente.

#### Critérios de Aceitação

1. THE Sistema SHALL incluir a dependência nodemailer no package.json do backend
2. THE Sistema SHALL ler as configurações SMTP das variáveis de ambiente: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e FRONTEND_URL
3. IF alguma variável de ambiente SMTP obrigatória não estiver definida, THEN THE Sistema SHALL registrar um aviso em log na inicialização indicando que o envio de email está desabilitado
