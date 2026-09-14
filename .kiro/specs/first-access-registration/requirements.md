# Documento de Requisitos — Registro de Primeiro Acesso

## Introdução

Este documento especifica os requisitos para a funcionalidade de registro de primeiro acesso do sistema Gestor Milhas. O fluxo substitui o modelo atual de criação de usuários (onde o admin define email + senha + nome) por um modelo baseado em convite: o admin registra apenas o email do usuário, o sistema envia um link de cadastro, e o usuário define sua própria senha ao acessar o link pela primeira vez. Após definir a senha, o usuário é criado com status PENDING e deve completar seus dados pessoais no primeiro login (fluxo existente de CompleteRegistrationPage). O modelo segue o padrão implementado no projeto MundoMilhas_Authentication, adaptado para o contexto multi-tenant do Gestor Milhas (onde cada usuário pertence a um admin via campo adminId).

## Glossário

- **Sistema**: O sistema Gestor Milhas (backend + frontend)
- **API**: A camada de backend Express que expõe endpoints REST
- **Admin**: Usuário com role ADMIN que gerencia outros usuários no sistema
- **Usuário**: Pessoa cadastrada no sistema com registro na tabela users e role USER
- **Registro_de_Email**: Entrada na tabela EmailRegistry que autoriza um email a se registrar no sistema, vinculada a um Admin
- **Link_de_Registro**: Token UUID v4 com expiração que permite ao Usuário definir sua senha e criar sua conta
- **Serviço_de_Email**: Módulo responsável por enviar emails via SMTP usando nodemailer
- **Página_de_Registro**: Página frontend onde o Usuário define sua senha após clicar no Link_de_Registro
- **Página_de_Solicitação_de_Link**: Página frontend onde o Usuário pode solicitar um novo Link_de_Registro informando seu email
- **Painel_Admin_Emails**: Interface no painel administrativo onde o Admin gerencia os Registros_de_Email
- **Tempo_de_Expiração**: Período de 30 minutos após o qual o Link_de_Registro se torna inválido

## Requisitos

### Requisito 1: Registro de Email pelo Admin

**User Story:** Como um admin, eu quero registrar apenas o email de um novo usuário no sistema, para que o próprio usuário defina sua senha de forma segura via link de cadastro.

#### Critérios de Aceitação

1. WHEN o Admin submete um email válido no Painel_Admin_Emails, THE API SHALL criar um Registro_de_Email com status ACTIVE vinculado ao Admin autenticado
2. WHEN o Registro_de_Email é criado com sucesso, THE API SHALL gerar automaticamente um Link_de_Registro UUID v4 com data de expiração igual ao momento atual acrescido do Tempo_de_Expiração
3. WHEN o Link_de_Registro é gerado com sucesso, THE Serviço_de_Email SHALL enviar um email para o endereço informado contendo o link no formato `{FRONTEND_URL}/registro/{token}`
4. WHEN o Admin submete um email que já existe como Registro_de_Email no sistema, THE API SHALL retornar erro de conflito com status HTTP 409 e mensagem indicando que o email já está cadastrado
5. WHEN o Admin submete um email em formato inválido, THE API SHALL retornar erro de validação com status HTTP 400
6. THE API SHALL armazenar o Registro_de_Email no banco de dados com os campos: id (UUID), email (único), status (ACTIVE/INACTIVE), adminId (referência ao Admin), createdAt e updatedAt

### Requisito 2: Modelo de Dados EmailRegistry e RegistrationLink

**User Story:** Como desenvolvedor, eu quero modelos de dados dedicados para registros de email e links de cadastro, para que o sistema gerencie o fluxo de primeiro acesso de forma estruturada.

#### Critérios de Aceitação

1. THE Sistema SHALL criar o modelo EmailRegistry no schema Prisma com os campos: id (UUID, chave primária), email (String, único), status (enum ACTIVE/INACTIVE, padrão ACTIVE), adminId (referência à tabela users com role ADMIN), createdAt (DateTime com valor padrão now) e updatedAt (DateTime com atualização automática)
2. THE Sistema SHALL criar o modelo RegistrationLink no schema Prisma com os campos: id (UUID, chave primária), token (UUID, único), emailRegistryId (referência ao EmailRegistry), expiresAt (DateTime), usedAt (DateTime opcional) e createdAt (DateTime com valor padrão now)
3. THE Sistema SHALL criar um índice único no campo token do modelo RegistrationLink
4. THE Sistema SHALL criar uma relação entre EmailRegistry e User (tabela users) via campo adminId
5. THE Sistema SHALL criar uma relação entre RegistrationLink e EmailRegistry via campo emailRegistryId

### Requisito 3: Verificação do Link de Registro

**User Story:** Como um usuário que recebeu o email de cadastro, eu quero que o sistema verifique se meu link é válido ao clicar nele, para que eu saiba se posso prosseguir com a criação da minha conta.

#### Critérios de Aceitação

1. WHEN o Usuário acessa a Página_de_Registro com um Link_de_Registro válido e não expirado, THE API SHALL retornar status HTTP 200 com o email associado ao token
2. WHEN o Usuário acessa a Página_de_Registro com um Link_de_Registro que não existe no banco de dados, THE API SHALL retornar erro com status HTTP 404
3. WHEN o Usuário acessa a Página_de_Registro com um Link_de_Registro cuja data de expiração já passou, THE API SHALL retornar erro com status HTTP 410 e mensagem indicando que o link expirou
4. WHEN o Usuário acessa a Página_de_Registro com um Link_de_Registro que já possui campo usedAt preenchido, THE API SHALL retornar erro com status HTTP 410 e mensagem indicando que o link já foi utilizado

### Requisito 4: Criação de Conta via Link de Registro

**User Story:** Como um usuário com um link válido de cadastro, eu quero definir minha senha para criar minha conta, para que eu possa acessar o sistema pela primeira vez.

#### Critérios de Aceitação

1. WHEN o Usuário submete uma senha válida junto com um Link_de_Registro válido e não expirado, THE API SHALL criar um registro na tabela users com o email do Registro_de_Email, o hash bcryptjs da senha, role USER, registrationStatus PENDING e adminId do Admin que criou o Registro_de_Email
2. WHEN a conta é criada com sucesso, THE API SHALL marcar o Link_de_Registro como utilizado preenchendo o campo usedAt com a data e hora atual
3. WHEN a conta é criada com sucesso, THE API SHALL retornar status HTTP 201 com os dados básicos do Usuário criado (id, email)
4. WHEN o Usuário submete uma senha com menos de 8 caracteres, THE API SHALL retornar erro de validação com status HTTP 400
5. WHEN o Usuário submete o formulário com um Link_de_Registro expirado, THE API SHALL retornar erro com status HTTP 410
6. WHEN o Usuário submete o formulário com um Link_de_Registro já utilizado, THE API SHALL retornar erro com status HTTP 410
7. WHEN o Usuário submete o formulário com um Link_de_Registro inexistente, THE API SHALL retornar erro com status HTTP 404
8. WHEN o Usuário tenta criar conta com um email que já possui registro na tabela users, THE API SHALL retornar erro com status HTTP 409 e mensagem indicando que o usuário já está cadastrado

### Requisito 5: Solicitação de Novo Link de Registro

**User Story:** Como um usuário que perdeu ou teve seu link expirado, eu quero solicitar um novo link de cadastro informando meu email, para que eu possa completar meu registro.

#### Critérios de Aceitação

1. WHEN o Usuário submete um email na Página_de_Solicitação_de_Link, THE API SHALL retornar uma mensagem genérica de sucesso com status HTTP 200, independentemente de o email existir como Registro_de_Email
2. WHEN o email informado corresponde a um Registro_de_Email com status ACTIVE e o Usuário ainda não completou o registro, THE API SHALL gerar um novo Link_de_Registro e enviar por email
3. WHEN o email informado não corresponde a nenhum Registro_de_Email, THE API SHALL retornar a mesma mensagem genérica de sucesso sem enviar email
4. WHEN o email informado corresponde a um Registro_de_Email com status INACTIVE, THE API SHALL retornar a mesma mensagem genérica de sucesso sem enviar email
5. WHEN o email informado corresponde a um Usuário que já completou o registro (já existe na tabela users), THE API SHALL retornar a mesma mensagem genérica de sucesso sem enviar email
6. WHEN um novo Link_de_Registro é gerado, THE API SHALL invalidar todos os links anteriores não utilizados do mesmo Registro_de_Email preenchendo o campo usedAt

### Requisito 6: Reenvio de Link pelo Admin

**User Story:** Como um admin, eu quero reenviar o link de cadastro para um usuário que ainda não se registrou, para que ele possa completar seu primeiro acesso.

#### Critérios de Aceitação

1. WHEN o Admin solicita reenvio de link para um Registro_de_Email cujo Usuário ainda não completou o registro, THE API SHALL gerar um novo Link_de_Registro e enviar por email
2. WHEN o Admin solicita reenvio de link para um Registro_de_Email cujo Usuário já completou o registro (já existe na tabela users), THE API SHALL retornar erro com status HTTP 400 e mensagem indicando que o usuário já está cadastrado
3. WHEN o Admin solicita reenvio de link para um Registro_de_Email inexistente, THE API SHALL retornar erro com status HTTP 404
4. WHEN um novo Link_de_Registro é gerado via reenvio, THE API SHALL invalidar todos os links anteriores não utilizados do mesmo Registro_de_Email

### Requisito 7: Gerenciamento de Registros de Email pelo Admin

**User Story:** Como um admin, eu quero visualizar e gerenciar os emails registrados no sistema, para que eu tenha controle sobre quem pode se cadastrar.

#### Critérios de Aceitação

1. WHEN o Admin acessa o Painel_Admin_Emails, THE API SHALL retornar a lista de Registros_de_Email vinculados ao Admin autenticado, incluindo status de registro (se o Usuário já completou o cadastro ou está pendente)
2. WHEN o Admin altera o status de um Registro_de_Email para INACTIVE, THE API SHALL atualizar o status e impedir que novos links sejam gerados para aquele email
3. WHEN o Admin altera o status de um Registro_de_Email para ACTIVE, THE API SHALL atualizar o status e permitir que novos links sejam gerados novamente
4. THE Painel_Admin_Emails SHALL exibir para cada registro: email, status de permissão (ACTIVE/INACTIVE), status de cadastro (Pendente/Completo) e data de criação

### Requisito 8: Envio de Email de Registro

**User Story:** Como um usuário convidado, eu quero receber um email claro com instruções de cadastro, para que eu saiba exatamente como criar minha conta no sistema.

#### Critérios de Aceitação

1. THE Serviço_de_Email SHALL enviar o email de registro contendo versão em texto puro e versão HTML
2. THE Serviço_de_Email SHALL incluir no email o link de registro, o tempo de expiração do link (30 minutos) e instruções para ignorar o email caso o Usuário não tenha solicitado o cadastro
3. THE Serviço_de_Email SHALL utilizar configuração SMTP definida por variáveis de ambiente (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
4. IF o envio do email falhar por erro de conexão SMTP, THEN THE API SHALL registrar o erro em log e retornar erro com status HTTP 502 ao Admin

### Requisito 9: Página de Registro (Frontend)

**User Story:** Como um usuário que clicou no link de cadastro, eu quero uma página onde eu possa definir minha senha, para que eu crie minha conta e acesse o sistema.

#### Critérios de Aceitação

1. WHEN a Página_de_Registro é carregada, THE Sistema SHALL extrair o token da URL e chamar o endpoint de verificação do Link_de_Registro
2. WHILE a verificação do token está em andamento, THE Página_de_Registro SHALL exibir um indicador de carregamento
3. WHEN o token é válido, THE Página_de_Registro SHALL exibir o email associado (somente leitura) e um formulário com campos de senha e confirmação de senha
4. WHEN o token é inválido ou expirado, THE Página_de_Registro SHALL exibir mensagem de erro apropriada e link para a Página_de_Solicitação_de_Link
5. THE Página_de_Registro SHALL validar que a senha possui no mínimo 8 caracteres
6. THE Página_de_Registro SHALL validar que os campos de senha e confirmação de senha são idênticos
7. WHEN o registro é concluído com sucesso, THE Página_de_Registro SHALL exibir mensagem de sucesso e botão para navegar à página de login

### Requisito 10: Página de Solicitação de Link (Frontend)

**User Story:** Como um usuário que perdeu seu link de cadastro, eu quero uma página onde eu possa solicitar um novo link informando meu email, para que eu receba um novo convite.

#### Critérios de Aceitação

1. THE Página_de_Solicitação_de_Link SHALL exibir um campo de email com validação Zod (formato de email válido e campo obrigatório)
2. WHILE a Página_de_Solicitação_de_Link está processando a requisição, THE Sistema SHALL exibir estado de carregamento no botão de envio e desabilitar o formulário
3. WHEN a requisição é concluída (sucesso ou erro), THE Página_de_Solicitação_de_Link SHALL exibir mensagem genérica informando que o email será enviado caso o endereço esteja autorizado no sistema
4. THE Página_de_Solicitação_de_Link SHALL exibir um link "Voltar para o login" que navega para a rota /login
5. THE Página de Login SHALL exibir um link "Primeiro acesso? Solicite seu link" que navega para a rota /solicitar-link

### Requisito 11: Atualização do Painel Admin de Usuários

**User Story:** Como um admin, eu quero que o formulário de criação de usuários seja substituído pelo novo fluxo de registro por email, para que os usuários definam suas próprias senhas de forma segura.

#### Critérios de Aceitação

1. THE Painel_Admin_Emails SHALL substituir o formulário atual de criação de usuário (email + senha + nome) por um formulário simplificado contendo apenas o campo de email
2. WHEN o Admin submete o email no novo formulário, THE Sistema SHALL criar o Registro_de_Email e enviar o Link_de_Registro automaticamente
3. THE Painel_Admin_Emails SHALL exibir botão "Reenviar Link" para registros cujo Usuário ainda não completou o cadastro
4. THE Painel_Admin_Emails SHALL exibir botão para alternar o status do Registro_de_Email entre ACTIVE e INACTIVE
5. THE Sistema SHALL manter as funcionalidades existentes de edição de usuário e validação administrativa (admin-validate) sem alterações

### Requisito 12: Configuração de Infraestrutura de Email

**User Story:** Como desenvolvedor, eu quero que o sistema tenha a infraestrutura de envio de email configurada, para que a funcionalidade de registro de primeiro acesso funcione corretamente.

#### Critérios de Aceitação

1. THE Sistema SHALL incluir a dependência nodemailer no package.json do backend
2. THE Sistema SHALL ler as configurações SMTP das variáveis de ambiente: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e FRONTEND_URL
3. IF alguma variável de ambiente SMTP obrigatória não estiver definida, THEN THE Sistema SHALL registrar um aviso em log na inicialização indicando que o envio de email está desabilitado
4. THE Sistema SHALL reutilizar a infraestrutura de email caso ela já tenha sido configurada pela funcionalidade de redefinição de senha (password-reset)
