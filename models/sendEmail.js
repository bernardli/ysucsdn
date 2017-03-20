var config = require('config-lite');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(config.transporter);

exports.email=function(mailOptions){
    transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
});
}