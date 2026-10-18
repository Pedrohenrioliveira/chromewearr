import nodemailer from 'nodemailer';
import { WHATSAPP_NUMBER } from './data';

export interface CartEmailItem {
  name: string;
  price: number;
  imageUrl?: string;
  size: string;
  quantity: number;
  ref?: string;
}

export function getMailTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const isGmail = emailUser?.toLowerCase().includes('@gmail.com');
  const host = process.env.EMAIL_HOST || (isGmail ? 'smtp.gmail.com' : 'smtp.hostinger.com');
  const port = Number(process.env.EMAIL_PORT) || 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendAbandonedCartEmail({
  to,
  customerName,
  items,
  daysAgo = 30,
}: {
  to: string;
  customerName: string;
  items: CartEmailItem[];
  daysAgo?: number;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER ou EMAIL_PASS não configurado no .env! E-mail de carrinho não disparado.');
    return { success: false, error: 'Credenciais de e-mail não configuradas no servidor.' };
  }

  const transporter = getMailTransporter();
  const firstName = customerName ? customerName.split(' ')[0] : 'Cliente';
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
  const storeUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chromewear.com.br';
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || WHATSAPP_NUMBER;
  const formattedPhoneDisplay = '+55 (27) 99249-0201';

  // Build items rows for HTML email
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #eeeeee;">
        <div style="font-weight: 700; font-size: 14px; color: #111111; text-transform: uppercase; letter-spacing: 0.05em;">
          ${item.name}
        </div>
        <div style="font-size: 12px; color: #666666; margin-top: 4px;">
          Tamanho: <strong>${item.size}</strong> &nbsp;|&nbsp; Qtd: <strong>${item.quantity}</strong>
          ${item.ref ? `&nbsp;|&nbsp; Ref: ${item.ref}` : ''}
        </div>
      </td>
      <td style="padding: 14px 0; border-bottom: 1px solid #eeeeee; text-align: right; vertical-align: top; font-weight: 700; font-size: 14px; color: #111111;">
        ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
      </td>
    </tr>
  `
    )
    .join('');

  const textFallback = `Olá, ${firstName}!\n\nNotamos que você selecionou peças exclusivas na ChromeWear há cerca de ${daysAgo} dias e sua sacola continua salva para você.\n\nItens salvos:\n${items
    .map((i) => `- ${i.name} (${i.size}) x${i.quantity}: R$ ${(i.price * i.quantity).toFixed(2)}`)
    .join('\n')}\nTotal: ${formattedTotal}\n\nFinalize seu pedido agora em: ${storeUrl}\n\nOu fale diretamente com a ChromeWear no WhatsApp: ${formattedPhoneDisplay} (https://wa.me/${whatsappNumber})`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Sua sacola na ChromeWear está te esperando</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f7f7; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; text-align: left;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #000000; padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase;">
                CHROMEWEAR
              </h1>
              <p style="color: #a3a3a3; margin: 8px 0 0 0; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">
                Streetwear Contemporâneo
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 30px;">
              <p style="font-size: 16px; font-weight: 700; margin: 0 0 16px 0; color: #111111;">
                Olá, ${firstName}!
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #444444; margin: 0 0 20px 0;">
                Notamos que faz cerca de <strong>${daysAgo} dias</strong> que você separou peças exclusivas na sua sacola em nossa loja e seu carrinho continua guardado para você.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                Como nossas coleções possuem <strong>tiragens limitadas e não costumam ter reposição</strong>, estamos entrando em contato para saber se você ainda tem interesse em garantir essas peças antes que os itens retornem ao estoque geral:
              </p>

              <!-- Items Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border-top: 1px solid #eeeeee;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 18px 0 0 0; font-weight: 700; font-size: 15px; color: #111111; text-transform: uppercase; letter-spacing: 0.05em;">
                    Total da Sacola
                  </td>
                  <td style="padding: 18px 0 0 0; font-weight: 900; font-size: 18px; color: #000000; text-align: right;">
                    ${formattedTotal}
                  </td>
                </tr>
              </table>

              <!-- Main CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${storeUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #000000; color: #ffffff; text-align: center; padding: 16px 24px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; border-radius: 0;">
                      Finalizar Meu Pedido Agora &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- WhatsApp Alternative with Official Store Phone Number -->
              <div style="background-color: #f7f7f7; border: 1px solid #e5e5e5; padding: 22px 18px; text-align: center; margin-top: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #111111; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
                  Prefere tirar dúvidas ou comprar via WhatsApp?
                </p>
                <p style="margin: 0 0 14px 0; font-size: 12px; color: #555555; line-height: 1.5;">
                  Atendimento direto pelo WhatsApp oficial da ChromeWear:<br>
                  <strong style="color: #111111; font-size: 14px; letter-spacing: 0.05em;">${formattedPhoneDisplay}</strong>
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                  <tr>
                    <td align="center">
                      <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá, ChromeWear! Recebi o e-mail sobre minha sacola de ${formattedTotal} e gostaria de finalizar meu pedido.`)}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 24px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none;">
                        Falar no WhatsApp (${formattedPhoneDisplay}) &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f0edec; border-top: 1px solid #e5e5e5; padding: 24px; text-align: center; font-size: 11px; color: #737373;">
              <p style="margin: 0 0 6px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #333333;">
                ChromeWear Official Store
              </p>
              <p style="margin: 0; line-height: 1.5;">
                Você recebeu este e-mail porque possui uma conta e sacola ativa em chromewear.com.br.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const info = await transporter.sendMail({
    from: `"ChromeWear" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Sua sacola na ChromeWear está te esperando ⚡ [DROP EXCLUSIVO]`,
    text: textFallback,
    html,
  });

  return { success: true, messageId: info.messageId };
}
