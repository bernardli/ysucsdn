const YsuNotice = require('../lib/mongo').YsuNotice;
const cheerio = require('cheerio');
const request = require('request-promise');
const config = require('config-lite');
const EmailModel = require('../models/sendEmail');
const moment = require('moment');

const EmailAdress = config.transporter.auth.user;
const adminEmail = config.adminEmail;

module.exports = {
  // 创建一条记录
  create: function create(notice) {
    return YsuNotice
      .create(notice)
      .exec();
  },


  getNotice: function getNotice(name) {
    return YsuNotice
      .find({
        name,
      })
      .exec();
  },


  updateNoticeByName: function updateNoticeByName(name, data) {
    return YsuNotice.update({
      name,
    }, {
      $set: data,
    }).exec();
  },

  // 获取网页的ETag
  requestOne: function oneHeader(url) {
    const options = {
      uri: url,
      simple: false,
      resolveWithFullResponse: true,
    };
    return request(options)
      .then(response => Promise.all([
        cheerio.load(response.body),
        response.headers,
      ]));
  },

  sendMeRes: function sendMeRes(res) {
    const mailOptions = {
      from: {
        name: 'YSUCSDN',
        address: EmailAdress,
      }, // 发件人
      to: [adminEmail], // 收件人
      subject: '燕山大学通知监控服务消息', // 标题
      text: '', // 内容
      html: `<div><p>${moment(new Date()).format('H:mm:ss')}:</p>${res}</div>`, // html
    };
    EmailModel.email(mailOptions);
  },
};
