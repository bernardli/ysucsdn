const config = require('config-lite');
const EmailNoticeModel = require('../models/emailNotice');
const EmailModel = require('../models/sendEmail');
const NoticeModel = require('../models/ysuNotice');
const NoticeFuncModel = require('../models/noticeFunction');
const moment = require('moment');

const EmailAdress = config.transporter.auth.user;
const adminEmail = config.adminEmail;

exports.spiderNotice = () => {
  // 递归发消息
  function newNotice(notice, $$, i) {
    Promise.all([
      $$('li a').eq(i).attr('href'),
    ])
      .then(([href]) => {
        const patt = new RegExp('http://');
        if (patt.test(href)) {
          return href;
        }
        return `http://notice.ysu.edu.cn${href}`;
      })
      .then(href => Promise.all([
        NoticeModel.oneHeader(href),
        NoticeModel.oneHtml(href),
        href,
      ]))
      .then(([header, $, href]) => {
        if (!(header && $ && href)) {
          throw new Error('网站访问出错');
        } else if (i === 6) {
          NoticeFuncModel.updateNoticeByHtml();
          stopNotice();
        } else if (notice.firstETag !== header.etag) {
          let {
            'last-modified': time,
          } = header; // 必须是let
          time = moment(time).format('YYYY-MM-DD，H:mm:ss');
          let title = $('td .titlestyle50830').text().trim();
          if (!title) {
            title = '权限不足，无法访问';
          }
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
                html: `<p>通知监控系统发现新通知，${time}发表了《${title}》</p><a href='${href}'>${href}</a>`, // html
              };
              EmailModel.email(mailOptions);
              console.log(`通知监控系统发现新通知，${time}发表了《${title}》${href}`);
              newNotice(notice, $$, i + 1);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//${err}`);
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
        NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//${err}`);
        console.log(err);
      });
  }

  // 防止通知被删除导致逻辑错误，先检索一遍
  function preNotice(notice, $$, i) {
    Promise.all([
      $$('li a').eq(i).attr('href'),
    ])
      .then(([href]) => {
        const patt = new RegExp('http://');
        if (patt.test(href)) {
          return href;
        }
        return `http://notice.ysu.edu.cn${href}`;
      })
      .then(href => Promise.all([
        NoticeModel.oneHeader(href),
        NoticeModel.oneHtml(href),
      ]))
      .then(([header, $]) => {
        if (!(header && $)) {
          throw new Error('网站访问出错');
        } else if (i === 6) {
          NoticeFuncModel.updateNoticeByHtml();
        } else if (notice.firstETag !== header.etag) {
          preNotice(notice, $$, i + 1);
        } else if (notice.firstETag === header.etag) {
          newNotice(notice, $$, 0);
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//${err}`);
        console.log(err);
      });
  }

  console.log('通知监控系统启动成功');

  function Notice() {
    console.log('通知监控系统运行正常');
    NoticeFuncModel.stateNotice();
    NoticeModel.getNotice('notice')
      .then((result) => {
        const notice = result[0];
        if (!notice) {
          NoticeModel.oneHtml('http://notice.ysu.edu.cn/')
            .then(($) => {
              const href = $('li a').eq(0).attr('href');
              const patt = new RegExp('http://');
              if (patt.test(href)) {
                return href;
              }
              return `http://notice.ysu.edu.cn${href}`;
            })
            .then(href => Promise.all([
              NoticeModel.oneHtml(href),
              NoticeModel.oneHeader(href),
              href,
            ]))
            .then(([$, header, href]) => {
              let {
                'last-modified': time,
              } = header; // 必须是let
              time = moment(time).format('YYYY-MM-DD，H:mm:ss');
              const data = {
                name: 'notice',
                firstETag: header.etag,
              };
              if ($('td .titlestyle50830').text().trim()) {
                return Promise.all([
                  href,
                  time,
                  $('td .titlestyle50830').text().trim(),
                  NoticeModel.create(data),
                ]);
              }
              return Promise.all([
                href,
                time,
                '权限不足，无法访问',
                NoticeModel.create(Notice),
              ]);
            })
            .then(([href, time, title]) => {
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
              NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//数据库初始化失败：${err}`);
              console.log(err);
            });
        } else {
          NoticeModel.oneHtml('http://notice.ysu.edu.cn/')
            .then(($) => {
              preNotice(notice, $, 0);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//${err}`);
              console.log(err);
            });
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//${err}`);
        console.log(err);
      });
  }

  // Notice();                    // 测试用

  const flag = setInterval(Notice, 600000);

  function stopNotice() {
    clearInterval(flag);
    NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//系统侦测到严重漏洞，已启动自毁程序`);
    console.log('系统侦测到严重漏洞，已启动自毁程序');
  }
};
