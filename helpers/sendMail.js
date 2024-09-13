const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('Sending email...');

    // 2) Define the email options
    const mailOptions = {
      from: '"Jonas Schmedtmann" <hello@jonas.io>', // Corrected email format
      to: options.email,
      subject: options.subject,
      text: options.message,
      // html: options.html,  // Optionally, include an HTML version of the email
    };

    // 3) Actually send the email
    const m = await transporter.sendMail(mailOptions);
    console.log('Email sent:', m);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
