const config = require('config-lite');
const EmailNoticeModel = require('../models/emailNotice');
const EmailModel = require('../models/sendEmail');
const NoticeModel = require('../models/ysuNotice');

const EmailAdress = config.transporter.auth.user;
const adminEmail = config.adminEmail;

exports.spiderNotice = () => {
  function newNotice(notice, $$, i) {
    const href = $$('li a').eq(i).attr('href');
    Promise.all([
      NoticeModel.oneHeader(`http://notice.ysu.edu.cn${href}`),
      NoticeModel.oneHtml(`http://notice.ysu.edu.cn${href}`),
      `http://notice.ysu.edu.cn${href}`,
    ])
      .then(([header, $, href]) => {
        if (i === 6) {
          stopNotice();
          NoticeModel.sendMeRes('系统侦测到严重漏洞，已启动自毁程序', '');
          console.log('系统侦测到严重漏洞，已启动自毁程序');
        } else if (notice.firstETag !== header.etag) {
          let { 'last-modified': time } = header;          // 必须是let
          const title = $('td .titlestyle50830').text().trim();
          const query = {
            ysuNotice: 'y',
          };
          EmailNoticeModel.getNotice(query)
            .then((users) => {
              const emails = new Set();
              users.forEach(user => emails.add(user.user.email));
              return [...emails];
            })
            .then((set) => {
              const mailOptions = {
                from: EmailAdress, // 发件人
                to: set, // 收件人
                subject: 'ysunotice', // 标题
                text: '', // 内容
                html: `<p>有新通知啦，${time}发表了《${title}》</p><a href='${href}'>${href}</a>`, // html
              };
              EmailModel.email(mailOptions);
              console.log(`有新通知啦，${time}发表了《${title}》${href}`);
              newNotice(notice, $$, i + 1);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(err, '');
              console.log(err);
            });
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(err, '');
        console.log(err);
      });
  }

  console.log('通知监控系统启动成功');

  function notice() {
    NoticeModel.getNotice('notice')
      .then((result) => {
        const notice = result[0];
        if (!notice) {
          NoticeModel.oneHtml('http://notice.ysu.edu.cn/')
            .then(($) => {
              const href = $('li a').eq(0).attr('href');
              return `http://notice.ysu.edu.cn${href}`;
            })
            .then(href => Promise.all([
              NoticeModel.oneHeader(href),
              href,
            ]))
            .then(([header, href]) => {
              const Notice = {
                name: 'notice',
                firstETag: header.etag,
              };
              return Promise.all([
                NoticeModel.oneHtml(href),
                header,
                href,
                NoticeModel.create(Notice),
              ]);
            })
            .then(([$, header, href]) => {
              let { 'last-modified': time } = header;         // 必须是let
              const title = $('td .titlestyle50830').text().trim();

              const mailOptions = {
                from: EmailAdress, // 发件人
                to: [adminEmail], // 收件人
                subject: 'ysunotice', // 标题
                text: '', // 内容
                html: `<p>数据库初始化成功，最新文章为 ${time} 发表的《${title}》</p><a href='${href}'>${href}</a>`, // html
              };
              EmailModel.email(mailOptions);
              console.log(`数据库初始化成功，最新文章为${time}发表的《${title}》 ${href}`);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(err, '数据库初始化失败：');
              console.log(err);
            });
        } else {
          NoticeModel.oneHtml('http://notice.ysu.edu.cn/')
            .then(($) => {
              const href = $('li a').eq(0).attr('href');
              return Promise.all([
                `http://notice.ysu.edu.cn${href}`,
                newNotice(notice, $, 0),
              ]);
            })
            .then(([href]) => NoticeModel.oneHeader(href))
            .then((header) => {
              const data = {
                firstETag: header.etag,
              };
              NoticeModel.updateNoticeByName('notice', data);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(err, '');
              console.log(err);
            });
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(err, '');
        console.log(err);
      });
  }

  // notice();                    // 测试用

  const flag = setInterval(notice, 600000);

  function stopNotice() {
    clearInterval(flag);
  }
};
