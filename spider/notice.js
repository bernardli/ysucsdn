const config = require('config-lite');
const EmailNoticeModel = require('../models/emailNotice');
const EmailModel = require('../models/sendEmail');
const NoticeModel = require('../models/ysuNotice');
const moment = require('moment');

const EmailAdress = config.transporter.auth.user;
const adminEmail = config.adminEmail;

exports.spiderNotice = () => {
  // 递归发消息
  function newNotice(notice, $$, i) {
    const href = $$('li a').eq(i).attr('href');
    Promise.all([
      NoticeModel.oneHeader(`http://notice.ysu.edu.cn${href}`),
      NoticeModel.oneHtml(`http://notice.ysu.edu.cn${href}`),
      `http://notice.ysu.edu.cn${href}`,
    ])
      .then(([header, $, href]) => {
        if (!(header && $ && href)) {
          throw new Error('网站访问出错');
        } else if (i === 6) {
          NoticeModel.updateNoticeByName();
          NoticeModel.sendMeRes('系统侦测到严重漏洞，已启动自毁程序', '');
          console.log('系统侦测到严重漏洞，已启动自毁程序');
          stopNotice();
        } else if (notice.firstETag !== header.etag) {
          let {
            'last-modified': time,
          } = header; // 必须是let
          time = moment(time).format('YYYY-MM-DD，H:mm:ss');
          const title = $('td .titlestyle50830').text().trim();
          EmailNoticeModel.getNotice({
            ysuNotice: 'y',
          })
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
          if (i === 0) {
            const data = {
              firstETag: header.etag,
            };
            NoticeModel.updateNoticeByName('notice', data);
          }
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(err, '');
        console.log(err);
      });
  }

  // 防止通知被删除导致逻辑错误，先检索一遍
  function preNotice(notice, $$, i) {
    const href = $$('li a').eq(i).attr('href');
    Promise.all([
      NoticeModel.oneHeader(`http://notice.ysu.edu.cn${href}`),
      NoticeModel.oneHtml(`http://notice.ysu.edu.cn${href}`),
      `http://notice.ysu.edu.cn${href}`,
    ])
      .then(([header, $, href]) => {
        if (!(header && $ && href)) {
          throw new Error('网站访问出错');
        } else if (i === 6) {
          NoticeModel.updateNoticeByName();
          NoticeModel.sendMeRes('可能有通知被删除', '');
          console.log('可能有通知被删除');
        } else if (notice.firstETag !== header.etag) {
          preNotice(notice, $$, i + 1);
        } else if (notice.firstETag === header.etag) {
          newNotice(notice, $, 0);
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(err, '');
        console.log(err);
      });
  }

  // 早晚报告情况
  function stateNotice() {
    const morningB = moment('7:00:00', 'H:mm:ss');
    const morningE = moment('7:10:00', 'H:mm:ss');
    const nightB = moment('22:00:00', 'H:mm:ss');
    const nightE = moment('22:10:00', 'H:mm:ss');
    const timeNow = moment(new Date(), 'H:mm:ss');
    if (timeNow > morningB && timeNow < morningE) {
      NoticeModel.sendMeRes('大佬早上好哟，通知系统今天也是元气满满的呢', '');
    } else if (timeNow > nightB && timeNow < nightE) {
      NoticeModel.sendMeRes('大佬晚安啦，通知系统晚上也是元气满满的呢', '');
    }
  }

  console.log('通知监控系统启动成功');

  function notice() {
    stateNotice();
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
              let {
                'last-modified': time,
              } = header; // 必须是let
              time = moment(time).format('YYYY-MM-DD，H:mm:ss');
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
              preNotice(notice, $, 0);
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
