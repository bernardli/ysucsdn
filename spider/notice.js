const config = require('config-lite');

const EmailAdress = config.transporter.auth.user;
const adminEmail = config.adminEmail;

const EmailModel = require('../models/sendEmail');
const NoticeModel = require('../models/ysuNotice');

exports.spiderNotice = () => {
  function newNotice(notice, $, i) {
    const href = $('li a').eq(i).attr('href');
    const time = $('li a span').eq(i).text();
    const title = $('li a').eq(i).attr('title');
    NoticeModel.oneETag(`http://notice.ysu.edu.cn${href}`)
    .then((etag) => {
      if (i === 6) {
        stopNotice();
        NoticeModel.sendMeRes('系统侦测到严重漏洞，已启动自毁程序', '');
        console.log('系统侦测到严重漏洞，已启动自毁程序');
      } else if (notice.firstETag !== etag) {
        const mailOptions = {
          from: EmailAdress, // 发件人
          to: adminEmail, // 收件人
          subject: 'ysunotice', // 标题
          text: '', // 内容
          html: `<p>有新通知啦，${time}发表了《${title}》</p><a href='http://notice.ysu.edu.cn${href}'>http://notice.ysu.edu.cn${href}</a>`, // html
        };
        EmailModel.email(mailOptions);
        console.log(`有新通知啦，${time}发表了《${title}》http://notice.ysu.edu.cn${href}`);
        newNotice(notice, $, i + 1);
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
            return Promise.all([
              NoticeModel.oneETag(`http://notice.ysu.edu.cn${href}`),
              $,
            ]);
          })
          .then(([firstETag, $]) => {
            const href = $('li a').eq(0).attr('href');
            const time = $('li a span').eq(0).text();
            const title = $('li a').eq(0).attr('title');
            const Notice = {
              name: 'notice',
              firstETag,
            };
            NoticeModel.create(Notice);
            const mailOptions = {
              from: EmailAdress, // 发件人
              to: adminEmail, // 收件人
              subject: 'ysunotice', // 标题
              text: '', // 内容
              html: `<p>数据库初始化成功，最新文章为${time}发表的《${title}》</p><a href='http://notice.ysu.edu.cn${href}'>http://notice.ysu.edu.cn${href}</a>`, // html
            };
            EmailModel.email(mailOptions);
            console.log(`数据库初始化成功，最新文章为${time}发表的《${title}》 http://notice.ysu.edu.cn${href}`);
          })
          .catch((err) => {
            NoticeModel.sendMeRes(err, '数据库初始化失败：');
            console.log(err);
          });
      } else {
        NoticeModel.oneHtml('http://notice.ysu.edu.cn/')
          .then(($) => {
            const href = $('li a').eq(0).attr('href');
            newNotice(notice, $, 0);
            return NoticeModel.oneETag(`http://notice.ysu.edu.cn${href}`);
          })
          .then((firstETag) => {
            const data = {
              firstETag,
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

  const flag = setInterval(notice, 600000);

  function stopNotice() {
    clearInterval(flag);
  }
};
