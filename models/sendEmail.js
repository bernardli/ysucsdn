const config = require('config-lite');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(config.transporter);

exports.email = function (mailOptions) {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
  });
};
