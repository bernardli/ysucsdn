const YsuNotice = require('../lib/mongo').YsuNotice;
const cheerio = require('cheerio');
const request = require('request-promise');
const config = require('config-lite');
const EmailModel = require('../models/sendEmail');
const NoticeModel = require('../models/ysuNotice');

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
      .find({ name })
      .exec();
  },


  updateNoticeByName: function updateNoticeByName(name, data) {
    return YsuNotice.update({ name }, { $set: data }).exec();
  },

  // 获取网页的ETag
  oneHeader: function oneHeader(url) {
    const options = {
      uri: url,
      transform(body, response, resolveWithFullResponse) {
        return response.headers;
      },
    };
    return request(options);
  },

  // 获取网页的html
  oneHtml: function oneHtml(url) {
    const options = {
      uri: url,
      transform(body) {
        return cheerio.load(body);
      },
    };
    return request(options);
  },

  sendMeRes: function sendMeRes(res, text) {
    const mailOptions = {
      from: EmailAdress, // 发件人
      to: [adminEmail], // 收件人
      subject: 'ysunotice', // 标题
      text: text + res, // 内容
      html: '', // html
    };
    EmailModel.email(mailOptions);
  },

  updateNoticeByHtml: function updateNoticeByHtml() {
    NoticeModel.oneHtml('http://notice.ysu.edu.cn/')
    .then(($) => {
      const href = $('li a').eq(0).attr('href');
      return NoticeModel.oneHeader(`http://notice.ysu.edu.cn${href}`);
    })
    .then((header) => {
      const data = {
        firstETag: header.etag,
      };
      NoticeModel.updateNoticeByName('notice', data);
    })
    .catch((err) => {
      NoticeModel.sendMeRes(err, '');
    });
  },
};
