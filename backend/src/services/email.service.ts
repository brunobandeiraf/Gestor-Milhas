import nodemailer from "nodemailer";
import { randomUUID } from "crypto";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "contatomundomilhas@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn("[Email] SMTP não configurado. Envio de email desabilitado.");
}

export interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  if (!transporter) {
    console.warn("[Email] Transporter não disponível. Email de contato não enviado.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Nova mensagem de contato — Gestor Milhas</h2>
  <p><strong>Nome:</strong> ${data.name}</p>
  <p><strong>Email:</strong> ${data.email}</p>
  <p><strong>Mensagem:</strong></p>
  <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 16px; margin-top: 8px;">
    <p style="white-space: pre-wrap;">${data.message}</p>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Este email foi enviado automaticamente pelo formulário de contato do Gestor Milhas.</p>
</body>
</html>
  `.trim();

  const textContent = `
Nova mensagem de contato — Gestor Milhas

Nome: ${data.name}
Email: ${data.email}

Mensagem:
${data.message}

---
Este email foi enviado automaticamente pelo formulário de contato do Gestor Milhas.
  `.trim();

  await transporter.sendMail({
    from: `"Gestor Milhas" <${SMTP_USER}>`,
    to: CONTACT_EMAIL,
    replyTo: data.email,
    subject: `[Contato] Mensagem de ${data.name}`,
    text: textContent,
    html: htmlContent,
  });
}


export function generateActivationToken(): string {
  return randomUUID();
}

export async function sendActivationEmail(
  email: string,
  userName: string,
  token: string
): Promise<void> {
  if (!transporter) {
    console.warn("[Email] Transporter não disponível. Email de ativação não enviado.");
    return;
  }

  const activationUrl = `${FRONTEND_URL}/ativar-conta/${token}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Ative sua conta — Gestor Milhas</h2>
  <p>Olá, ${userName}!</p>
  <p>Sua conta foi criada no <strong>Gestor Milhas</strong>. Para ativá-la e definir sua senha, clique no botão abaixo:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${activationUrl}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Ativar Conta
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">
    ⚠️ Este link expira em <strong>30 minutos</strong>. Após esse período, será necessário solicitar um novo link.
  </p>
  <p style="color: #666; font-size: 14px;">
    Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
  </p>
  <p style="color: #666; font-size: 12px; word-break: break-all;">${activationUrl}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Se você não solicitou este cadastro, ignore este email.</p>
</body>
</html>
  `.trim();

  const textContent = `
Olá, ${userName}!

Sua conta foi criada no Gestor Milhas. Para ativá-la e definir sua senha, acesse o link abaixo:

${activationUrl}

⚠️ Este link expira em 30 minutos. Após esse período, será necessário solicitar um novo link.

Se você não solicitou este cadastro, ignore este email.

— Equipe Gestor Milhas
  `.trim();

  await transporter.sendMail({
    from: `"Gestor Milhas" <${SMTP_USER}>`,
    to: email,
    subject: "Ative sua conta — Gestor Milhas",
    text: textContent,
    html: htmlContent,
  });
}
