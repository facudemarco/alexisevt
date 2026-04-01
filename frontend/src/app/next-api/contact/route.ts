import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { nombre, email, telefono, mensaje } = await req.json();

  if (!nombre || !email || !mensaje) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_SENDER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Alexis EVT - Contacto" <${process.env.GMAIL_SENDER}>`,
    to: process.env.EMAIL_RECEIVER,
    replyTo: email,
    subject: `Nuevo mensaje de contacto — ${nombre}`,
    html: `
      <h2>Nuevo mensaje desde el formulario de contacto</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px">
        <tr><td style="padding:8px;font-weight:bold">Nombre</td><td style="padding:8px">${nombre}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Teléfono</td><td style="padding:8px">${telefono || "—"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Mensaje</td><td style="padding:8px">${mensaje.replace(/\n/g, "<br>")}</td></tr>
      </table>
    `,
  });

  return NextResponse.json({ ok: true });
}
