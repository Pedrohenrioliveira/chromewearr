import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
      } else {
        // Se o usuário existe mas não é verificado, podemos reenviar o código
        const code = generateCode();
        await prisma.verificationToken.create({
          data: {
            code,
            userId: existingUser.id,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
          }
        });

        // Enviar E-mail
        const transporter = nodemailer.createTransport({
          host: 'smtp.hostinger.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        await transporter.sendMail({
          from: `"ChromeWear" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Seu Código de Verificação ChromeWear',
          html: `<p>Olá ${name},</p><p>Seu código de verificação é: <strong>${code}</strong></p>`
        });

        return NextResponse.json({
          message: 'Código reenviado com sucesso!',
          requiresVerification: true,
          email: existingUser.email
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        isVerified: false
      },
    });

    const code = generateCode();
    await prisma.verificationToken.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
      }
    });

    // Enviar E-mail
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    await transporter.sendMail({
      from: `"ChromeWear" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Seu Código de Verificação ChromeWear',
      html: `<p>Olá ${name},</p><p>Seu código de verificação é: <strong>${code}</strong></p>`
    });

    return NextResponse.json({
      message: 'Conta criada! Verifique seu e-mail.',
      requiresVerification: true,
      email: user.email
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: `Erro ao criar conta: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
