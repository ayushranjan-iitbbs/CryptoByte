import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { to, title, message } = await req.json();

     
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"Cryptobyte Trading" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: `ALERT: ${title}`,
      html: `
        <div style="font-family: monospace; background: #050505; color: #fff; padding: 20px; border: 1px solid #333;">
          <h2 style="color: #eab308; border-bottom: 1px solid #333; padding-bottom: 10px;">${title}</h2>
          <p style="font-size: 15px; line-height: 1.6;">${message}</p>
          <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="font-size: 10px; color: #666;">THIS IS AN AUTOMATED TRADE EXECUTION ALERT FROM CRYPTOBYTE</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}