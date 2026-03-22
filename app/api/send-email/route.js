import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { to, title, message } = await req.json();

    // 1. Validate Environment Variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("CRITICAL: Email environment variables are missing.");
      return NextResponse.json(
        { error: "Server configuration error: Missing Email Credentials" }, 
        { status: 500 }
      );
    }

    // 2. Setup Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

     

    // 4. Construct and Send Mail
    const info = await transporter.sendMail({
      from: `"CryptoByte Terminal" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: `[TRADING ALERT] ${title}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050505; color: #ffffff; padding: 30px; border: 1px solid #222; max-width: 600px; margin: auto;">
          <div style="border-left: 4px solid #eab308; padding-left: 15px; margin-bottom: 20px;">
            <h2 style="color: #eab308; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 18px;">${title}</h2>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">
            ${message}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #222;">
            <p style="font-size: 10px; color: #555; letter-spacing: 1px; margin: 0;">
              EXECUTED VIA CRYPTOBYTE AUTO-NODE | ${new Date().toLocaleString()}
            </p>
            <p style="font-size: 9px; color: #333; margin-top: 5px;">
              This is a secure automated notification. Do not reply to this address.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email Dispatched:", info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error) {
    // This ensures the error is visible in your browser console as a string, not {}
    console.error("Nodemailer Detailed Error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to send email",
        code: error.code || "UNKNOWN_ERROR" 
      }, 
      { status: 500 }
    );
  }
}