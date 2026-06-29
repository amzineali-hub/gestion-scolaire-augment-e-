import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import twilio from "twilio";
import PDFDocument from "pdfkit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API Routes
  app.get("/api/health", async (req, res) => {
    let smtpOk = false;
    let smtpError = "";
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        });
        await transporter.verify();
        smtpOk = true;
      } catch (e: any) {
        smtpError = e.message;
      }
    }

    res.json({ 
      status: "ok", 
      message: "Server is running on Google Cloud Run",
      smtpOk,
      smtpError,
      envKeys: Object.keys(process.env).filter(k => k.includes('SMTP') || k.includes('SMT') || k.includes('TWILIO'))
    });
  });

  // Example backend route to demonstrate API usage
  app.post("/api/hello", (req, res) => {
    const { name } = req.body;
    res.json({ message: `Hello, ${name || 'World'} from the server!` });
  });

  // Email Route (using Nodemailer with Gmail SMTP)
  app.post("/api/email/send", express.json({limit: '50mb'}), async (req, res) => {
    const { to, subject, text, html, attachment } = req.body;
    
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      });

      const mailOptions: any = {
        from: process.env.SMTP_USER,
        to,
        subject,
        text,
        html
      };

      if (attachment) {
        mailOptions.attachments = [
          {
            filename: attachment.filename || 'document.pdf',
            content: attachment.content.split("base64,")[1] || attachment.content,
            encoding: 'base64'
          }
        ];
      }

      const info = await transporter.sendMail(mailOptions);

      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // WhatsApp Route (using Twilio)
  app.post("/api/whatsapp/send", async (req, res) => {
    const { to, message } = req.body;
    
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      
      if (!accountSid || !authToken) {
         throw new Error("Twilio credentials missing in environment variables.");
      }
      
      const client = twilio(accountSid, authToken);
      
      const response = await client.messages.create({
        body: message,
        from: `whatsapp:${twilioPhone}`,
        to: `whatsapp:${to}`
      });

      res.json({ success: true, messageSid: response.sid });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PDF Generation Route
  app.post("/api/pdf/generate", (req, res) => {
    const { title, content } = req.body;
    
    try {
      const doc = new PDFDocument();
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.pdf"`);
      
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(24).text(title || 'Document Title', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(content || 'No content provided.');
      
      doc.end();
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send Bulletin via Email with PDF Attachment
  app.post("/api/email/send-bulletin", async (req, res) => {
    const { to, studentName, term, academicYear, grades } = req.body;
    
    try {
      // 1. Generate PDF in memory
      const doc = new PDFDocument({ margin: 50 });
      const buffers: any[] = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // Build PDF Content
      doc.fontSize(20).text('Bulletin Scolaire', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Élève : ${studentName}`);
      doc.text(`Période : ${term} | Année Académique : ${academicYear}`);
      doc.moveDown();
      
      doc.fontSize(12).text('Relevé de notes :', { underline: true });
      doc.moveDown();
      
      if (grades && grades.length > 0) {
        grades.forEach((g: any) => {
           doc.text(`${g.subject}: ${g.value}/20`);
        });
      } else {
        doc.text('Aucune note enregistrée.');
      }
      
      doc.moveDown(2);
      doc.fontSize(10).fillColor('grey').text('Ce bulletin est généré automatiquement par la plateforme Madrasati.', { align: 'center' });
      doc.end();
      
      // Wait for PDF to finish
      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      });

      // 2. Send Email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: `Bulletin Scolaire - ${studentName}`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint le bulletin de notes de ${studentName} pour le ${term} (${academicYear}).\n\nCordialement,\nL'Administration`,
        html: `<p>Bonjour,</p><p>Veuillez trouver ci-joint le bulletin de notes de <strong>${studentName}</strong> pour le ${term} (${academicYear}).</p><p>Cordialement,<br>L'Administration</p>`,
        attachments: [
          {
            filename: `Bulletin_${studentName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development (SPA fallback)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
