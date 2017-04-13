const config = require('config-lite');
const EmailNoticeModel = require('../models/emailNotice');
const EmailModel = require('../models/sendEmail');
const NoticeModel = require('../models/ysuNotice');
const NoticeFuncModel = require('../models/noticeFunction');
const moment = require('moment');

const EmailAdress = config.transporter.auth.user;

exports.spiderNotice = () => {
  // 递归发消息
  function newNotice(notice, $$, i) {
    Promise.all([
      $$('a',`#lineu12_${i}`).attr('href'),
    ])
      .then(([href]) => {
        const patt = new RegExp('http://');
        if (patt.test(href)) {
          return href;
        }
        return `http://notice.ysu.edu.cn/${href}`;
      })
      .then(href => Promise.all([
        NoticeModel.requestOne(href),
        href,
      ]))
      .then(([[$, header], href]) => {
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
          let title = $('h3','.content-title').text().trim();
          if (!title) {
            title = '权限不足，无法访问';
          }
          EmailNoticeModel.getNotice({
            ysuNotice: 'y',
          })
            .then((users) => {
              users.forEach((user) => {
                const mailOptions = {
                  from: {
                    name: 'YSUCSDN',
                    address: EmailAdress,
                  }, // 发件人
                  to: user.user.email, // 收件人
                  subject: '燕山大学通知监控服务发现新通知!', // 标题
                  text: '', // 内容
                  html: `<p>通知监控系统发现新通知！</p><p>${time}发表了《${title}》</p><p>如果你对这个通知不感兴趣，请无视，如果感兴趣，请点击下方链接：</p><a href='${href}'>${href}</a>`, // html
                };
                EmailModel.email(mailOptions);
              });
              console.log(`通知监控系统发现新通知，${time}发表了《${title}》${href}`);
              newNotice(notice, $$, i + 1);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`<p>${err}</p>`);
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
        NoticeModel.sendMeRes(`<p>${err}</p>`);
        console.log(err);
      });
  }

  // 防止通知被删除导致逻辑错误，先检索一遍
  function preNotice(notice, $$, i) {
    Promise.all([
      $$('a',`#lineu12_${i}`).attr('href'),
    ])
      .then(([href]) => {
        const patt = new RegExp('http://');
        if (patt.test(href)) {
          return href;
        }
        return `http://notice.ysu.edu.cn/${href}`;
      })
      .then(href => NoticeModel.requestOne(href))
      .then(([$, header]) => {
        if (!(header && $)) {
          throw new Error('网站访问出错');
        } else if (i === 6) {
          NoticeFuncModel.updateNoticeByHtml();
        } else if (notice.firstETag !== header.etag) {
          preNotice(notice, $$, i + 1);
        } else if (notice.firstETag === header.etag && i !== 0) {
          newNotice(notice, $$, 0);
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`<p>${err}</p>`);
        console.log(err);
      });
  }

  console.log('通知监控系统启动成功');

  function Notice() {
    console.log('通知监控系统运行正常');
    NoticeModel.getNotice('notice')
      .then((result) => {
        const notice = result[0];
        if (!notice) {
          NoticeModel.requestOne('http://notice.ysu.edu.cn/')
            .then(([$]) => {
              const href = $('a','#lineu12_0').attr('href');
              const patt = new RegExp('http://');
              if (patt.test(href)) {
                return href;
              }
              return `http://notice.ysu.edu.cn/${href}`;
            })
            .then(href => Promise.all([
              NoticeModel.requestOne(href),
              href,
            ]))
            .then(([[$, header], href]) => {
              let {
                'last-modified': time,
              } = header; // 必须是let
              time = moment(time).format('YYYY-MM-DD，H:mm:ss');
              const data = {
                name: 'notice',
                firstETag: header.etag,
              };
              let title = $('h3','.content-title').text().trim();
              if (!title) {
                title = '权限不足，无法访问';
              }
              return Promise.all([
                href,
                time,
                title,
                NoticeModel.create(data),
              ]);
            })
            .then(([href, time, title]) => {
              NoticeModel.sendMeRes(`<p>数据库初始化成功，最新文章为 ${time} 发表的《${title}》</p><a href='${href}'>${href}</a>`);
              console.log(`数据库初始化成功，最新文章为${time}发表的《${title}》 ${href}`);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`<p>数据库初始化失败：<p>${err}</p></p>`);
              console.log(err);
            });
        } else {
          NoticeModel.requestOne('http://notice.ysu.edu.cn/')
            .then(([$]) => {
              preNotice(notice, $, 0);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`<p>${err}</p>`);
              console.log(err);
            });
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`<p>${err}</p>`);
        console.log(err);
      });
  }

  // Notice();                    // 测试用

  const flag = setInterval(Notice, 600000);

  function stopNotice() {
    clearInterval(flag);
    NoticeModel.sendMeRes('<p>系统侦测到严重漏洞，已启动自毁程序</p>');
    console.log('系统侦测到严重漏洞，已启动自毁程序');
  }
};
