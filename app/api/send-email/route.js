import { NextResponse } from 'next/server';
import { Resend } from 'resend';

 
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { to, title, message } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY in environment variables");
    }

     
    const { data, error } = await resend.emails.send({
      from: 'Trading Platform <onboarding@resend.dev>',
      to: [to],
      subject: `ALRT: ${title}`,
      html: `
        <div style="font-family: monospace; background: #050505; color: white; padding: 20px; border: 1px solid #333;">
          <h2 style="color: #eab308; border-bottom: 1px solid #333; padding-bottom: 10px; text-transform: uppercase;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.6;">${message}</p>
          <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="font-size: 10px; color: #666; text-transform: uppercase; tracking: 1px;">This is an automated trade execution alert from CryptoByte.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Internal Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}