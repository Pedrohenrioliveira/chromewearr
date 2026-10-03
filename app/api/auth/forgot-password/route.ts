import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return 200 to prevent email enumeration, but don't send an email
      return NextResponse.json({ message: 'Se o email existir, um código foi enviado.' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

    // Save to DB
    await prisma.verificationToken.create({
      data: {
        code,
        expiresAt,
        userId: user.id,
      },
    });

    // Send email using nodemailer
    // You MUST set EMAIL_USER and EMAIL_PASS in your .env
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Seu código de recuperação de senha',
      text: `Seu código de recuperação de senha é: ${code}. Ele expira em 15 minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperação de Senha</h2>
          <p>Olá ${user.name},</p>
          <p>Você solicitou a redefinição da sua senha. Aqui está o seu código de verificação:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="letter-spacing: 5px; margin: 0; color: #333;">${code}</h1>
          </div>
          <p>Este código expira em 15 minutos. Se você não solicitou isso, pode ignorar este email.</p>
        </div>
      `,
    };

    // If no credentials, log the code (useful for development before setting up Gmail)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('EMAIL_USER ou EMAIL_PASS não configurado no .env! O email não será enviado.');
      console.log('CÓDIGO DE RECUPERAÇÃO GERADO:', code);
    } else {
      await transporter.sendMail(mailOptions);
    }

    // [SMS Integration Placeholder]
    // If you add Twilio or Zenvia, you would call their API here using the user's phone number (if available).

    return NextResponse.json({ message: 'Se o email existir, um código foi enviado.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
