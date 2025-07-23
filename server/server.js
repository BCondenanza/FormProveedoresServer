const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');

/*###########################################################################################################################*/

dotenv.config();
const app = express();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// Configure multer for handling file uploads (stores files in memory)
// We use .array() to accept multiple files under the field name 'attachments'
// I've set a limit of 10 files per request, which you can adjust.
const upload = multer({ storage: multer.memoryStorage() }).array('attachments', 10);

const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;
const mailDest = process.env.MAIL_DEST;

// Create a reusable transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mailUser,
        pass: mailPass,
    },
});
/*###########################################################################################################################*/

app.get('/', function (req, res) {
  res.send("server andando");
});


//Endpoint de testeo (sacar al final)
app.get('/test', async (req, res) => {
    if (!mailUser || !mailPass) {
        console.error('Error: Missing email credentials on the server.');
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    const mailOptions = {
        from: `"Test App" <${mailUser}>`,
        to: mailDest, 
        subject: 'Correo de prueba',
        text: 'Este es un correo de prueba enviado desde el endpoint GET /test',
        html: '<p>Este es un <b>correo de prueba</b> enviado desde el endpoint <code>GET /test-email</code></p>',
    };

    try {
        console.log(`Enviando correo de prueba a ${mailOptions.to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado con éxito:', info.messageId);
        return res.status(200).json('Correo de prueba enviado con éxito.');
    } catch (error) {
        console.error('Error al enviar el correo de prueba:', error);
        return res.status(500).json('Error al enviar el correo de prueba.');
    }
});

app.post('/send-email', upload, async (req, res) => {
    if (!mailUser || !mailPass) {
      console.error('Missing email credentials.');
      return res.status(500).json({ success: false, message: 'Server config error.' });
    }
  
    let commonFields = {};
    try {
      commonFields = JSON.parse(req.body.commonFields);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid JSON in commonFields' });
    }
  
    // Preparar los campos del email
    const subject ="Solicitud de nuevo proveedor";
    const email = commonFields.email;
    const name= commonFields.name;
    const lastName=commonFields.lastName;
    const idF=commonFields.idFiscal;
    const nFact=commonFields.nFact;
    const country=commonFields.country;
    const text="";

    if (!email || !name || !lastName|| !idF|| !nFact|| !country) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
  
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No attachment files were provided.' });
    }
  
    const formattedAttachments = files.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    }));
    
    const html = `
  <div style="background-color:#000000;color:#ffcc00;padding:10px;text-align:center;font-size:24px;font-weight:bold;">
    Datos Recibidos
  </div>

  <div style="margin-top:20px;border:1px solid #ddd;border-radius:4px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
      <tr>
        <th style="background-color:#ffcc00;color:#000000;padding:10px;text-align:left;font-weight:bold;">Campo</th>
        <th style="background-color:#ffcc00;color:#000000;padding:10px;text-align:left;font-weight:bold;">Valor</th>
      </tr>
      <tr>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">Email</td>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">${commonFields.email}</td>
      </tr>
      <tr>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">Nombre</td>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">${commonFields.name}</td>
      </tr>
      <tr>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">Apellido</td>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">${commonFields.lastName}</td>
      </tr>
      <tr>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">ID Fiscal</td>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">${commonFields.idFiscal}</td>
      </tr>
      <tr>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">Número de Factura</td>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">${commonFields.nFact}</td>
      </tr>
      <tr>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">País</td>
        <td style="border-top:1px solid #ddd;padding:10px;background-color:#f9f9f9;">${commonFields.country}</td>
      </tr>
    </table>
  </div>
`;

    const mailOptions = {
      from: `"Formulario de Nuevos Proveedores" <${mailUser}>`,
      to:mailDest,
      country,
      subject,
      text,
      html: html,
      attachments: formattedAttachments,
    };
  
    try {
      console.log(`Sending email with ${files.length} attachments to ${mailDest}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
  
      return res.status(200).json({
        success: true,
        message: 'Email sent successfully!',
        messageId: info.messageId,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ success: false, message: 'Failed to send email.' });
    }
  });

//Endpoint para resolver la verificación del captcha
app.post("/captcha", async function (req, res) {
    try {
        var verification="TEST";
        res.status(200).json(verification);
    } catch (error) {
  
      res.status(error.status || 500).json({
        error
      });
  
    }
});

/*###########################################################################################################################*/
const port = process.env.PORT || 3030;
app.listen(port, function () {
});
