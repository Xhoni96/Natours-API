const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1 ) Create a transporter (a service that will send the email)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // In Gmail we have to activate "Less secure app" option
  });

  // 2 ) Define the email options
  const mailOptions = {
    from: "Xhoni Komini <itsme@johnn.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // 3) Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
