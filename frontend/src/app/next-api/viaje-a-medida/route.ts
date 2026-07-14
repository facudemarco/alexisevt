import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const {
      nombre,
      email,
      telefono,
      destino,
      fecha,
      noches,
      habitaciones,
      pasajeros,
      mayores,
      menores,
      agregar_transporte,
      tipo_transporte,
      comentarios,
    } = await req.json();

    if (!nombre || !email || !destino || !fecha || !pasajeros) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const emailReceiver = process.env.EMAIL_RECEIVER || "comercial.alexisevt@gmail.com";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_SENDER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const habitacionesHtml = Array.isArray(habitaciones) && habitaciones.length > 0
      ? `<ol style="margin: 0; padding-left: 20px;">
          ${habitaciones.map((h: string) => `<li style="margin-bottom: 4px; font-weight: 600; color: #1e293b;">${h}</li>`).join("")}
         </ol>`
      : "—";

    const transporteText = agregar_transporte 
      ? `Sí (Preferencia: ${tipo_transporte === "Avion" ? "✈️ Avión" : "🚌 Bus"})`
      : "No requerido";

    await transporter.sendMail({
      from: `"Alexis EVT - Viaje a Medida" <${process.env.GMAIL_SENDER}>`,
      to: emailReceiver,
      replyTo: email,
      subject: `Nueva Consulta de Viaje a Medida — ${nombre} (${destino})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #1D5D8C; margin: 0 0 10px 0; text-transform: uppercase; font-size: 24px; font-weight: 800; letter-spacing: 0.05em;">Alexis EVT</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Consulta de Viaje a Medida</p>
            <div style="width: 60px; height: 3px; background-color: #1D5D8C; margin: 15px auto 0 auto; border-radius: 9999px;"></div>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #1e293b; font-size: 16px; font-weight: 700; margin: 0 0 15px 0;">Datos del Solicitante</h3>
            <table style="border-collapse:collapse;width:100%;font-size: 14px; color: #334155;">
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;width:180px">Nombre y Apellido</td>
                <td style="padding:6px 0;font-weight:700;color:#1e293b;">${nombre}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;">Correo Electrónico</td>
                <td style="padding:6px 0;"><a href="mailto:${email}" style="color:#1D5D8C;text-decoration:none;font-weight:600;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;">Teléfono</td>
                <td style="padding:6px 0;font-weight:600;color:#1e293b;">${telefono || "—"}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #1e293b; font-size: 16px; font-weight: 700; margin: 0 0 15px 0;">Detalles del Destino y Estadía</h3>
            <table style="border-collapse:collapse;width:100%;font-size: 14px; color: #334155;">
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;width:180px">Destino Solicitado</td>
                <td style="padding:6px 0;font-weight:800;color:#1D5D8C;font-size:16px;">${destino}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;">Fecha Estimada</td>
                <td style="padding:6px 0;font-weight:600;color:#1e293b;">${fecha}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;">Noches de Estadía</td>
                <td style="padding:6px 0;font-weight:600;color:#1e293b;">${noches || "—"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;vertical-align:top;">Habitaciones</td>
                <td style="padding:6px 0;">${habitacionesHtml}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #1e293b; font-size: 16px; font-weight: 700; margin: 0 0 15px 0;">Pasajeros y Transporte</h3>
            <table style="border-collapse:collapse;width:100%;font-size: 14px; color: #334155;">
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;width:180px">Total Pasajeros</td>
                <td style="padding:6px 0;font-weight:700;color:#1e293b;">${pasajeros}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;">Pasajeros Mayores</td>
                <td style="padding:6px 0;font-weight:600;color:#1e293b;">${mayores || "—"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;">Pasajeros Menores</td>
                <td style="padding:6px 0;font-weight:600;color:#1e293b;">${menores || "0"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-weight:600;color:#64748b;">Requiere Transporte</td>
                <td style="padding:6px 0;font-weight:700;color:#1e293b;">${transporteText}</td>
              </tr>
            </table>
          </div>

          ${comentarios ? `
            <div style="margin-bottom: 10px;">
              <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #1e293b; font-size: 16px; font-weight: 700; margin: 0 0 15px 0;">Comentarios Adicionales</h3>
              <div style="padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${comentarios}</div>
            </div>
          ` : ""}
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error in viaje-a-medida route:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}
