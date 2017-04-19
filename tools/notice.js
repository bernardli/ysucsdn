const config = require('config-lite')(__dirname);
const EmailNoticeModel = require('../models/emailNotice');
const EmailModel = require('../models/sendEmail');
const NoticeModel = require('../models/ysuNotice');
const NoticeFuncModel = require('../models/noticeFunction');
const moment = require('moment');

const EmailAdress = config.transporter.auth.user;

exports.spiderNotice = () => {
  // 递归发消息
  const newNotice = (notice, $$, i) => {
    Promise.all([
      $$('a', `#lineu12_${i}`).attr('href'),
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
        $$('.list-txt-1', `#lineu12_${i}`).text().trim(),
      ]))
      .then(([
        [, {
          'last-modified': time,
          etag,
        }], href, title,
      ]) => {
        // 校验参数
        if (!time) {
          time = moment().format('YYYY-MM-DD，H:mm:ss');
        } else {
          time = moment(time).format('YYYY-MM-DD，H:mm:ss');
        }
        if (!title) {
          title = '获取标题出错';
        }
        if (!etag) {
          etag = title;
        } else if (etag === '"652-4b6b48ffe0340"' || etag === '"18c8-508d2d594b3c0"') {
          etag = title;
          title += '（这篇通知需要权限）';
          time = moment().format('YYYY-MM-DD，H:mm:ss');
        }
        if (i === 6) {
          NoticeFuncModel.updateNoticeByHtml();
          stopNotice();
        } else if (notice.firstETag !== etag) {
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
                  to: [user.user.email], // 收件人
                  subject: '燕山大学通知监控服务发现新通知!', // 标题
                  text: '', // 内容
                  html: `<p>通知监控系统发现新通知！</p><p>${time}发表了《${title}》</p><p>如果你对这个通知不感兴趣，请无视，如果感兴趣，请点击下方链接：</p><a href='${href}'>${href}</a>`, // html
                };
                EmailModel.email(mailOptions);
              });
              // console.log(`通知监控系统发现新通知，${time}发表了《${title}》${href}`);
              newNotice(notice, $$, i + 1);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`<p>${err}</p>`);
              // console.log(err);
            });
          if (i === 0) {
            const data = {
              firstETag: etag,
            };
            NoticeModel.updateNoticeByName('notice', data);
          }
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`<p>${err}</p>`);
        // console.log(err);
      });
  };

  // 防止通知被删除导致逻辑错误，先检索一遍
  const preNotice = (notice, $$, i) => {
    Promise.all([
      $$('a', `#lineu12_${i}`).attr('href'),
    ])
      .then(([href]) => {
        const patt = new RegExp('http://');
        if (patt.test(href)) {
          return href;
        }
        return `http://notice.ysu.edu.cn/${href}`;
      })
      .then(href => NoticeModel.requestOne(href))
      .then(([, {
        etag,
      }]) => {
        // 校验参数
        if (!etag || etag === '"652-4b6b48ffe0340"' || etag === '"18c8-508d2d594b3c0"') {
          etag = $$('.list-txt-1', `#lineu12_${i}`).text().trim();
        }
        if (i === 6) {
          NoticeFuncModel.updateNoticeByHtml();
        } else if (notice.firstETag !== etag) {
          preNotice(notice, $$, i + 1);
        } else if (notice.firstETag === etag && i !== 0) {
          newNotice(notice, $$, 0);
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`<p>${err}</p>`);
        // console.log(err);
      });
  };

  // console.log('通知监控系统启动成功');

  const Notice = () => {
    // console.log('通知监控系统运行正常');
    NoticeModel.getNotice('notice')
      .then((result) => {
        const notice = result[0];
        if (!notice) {
          NoticeModel.requestOne('http://notice.ysu.edu.cn/')
            .then(([$]) => {
              let href = $('a', '#lineu12_0').attr('href');
              const title = $('.list-txt-1', '#lineu12_0').text().trim();
              const patt = new RegExp('http://');
              if (!patt.test(href)) {
                href = `http://notice.ysu.edu.cn/${href}`;
              }
              return [href, title];
            })
            .then(([href, title]) => Promise.all([
              NoticeModel.requestOne(href),
              href,
              title,
            ]))
            .then(([
              [, {
                'last-modified': time,
                etag,
              }], href, title,
            ]) => {
              // 校验参数
              if (!time) {
                time = moment().format('YYYY-MM-DD，H:mm:ss');
              } else {
                time = moment(time).format('YYYY-MM-DD，H:mm:ss');
              }
              if (!title) {
                title = '获取标题出错';
              }
              if (!etag) {
                etag = title;
              } else if (etag === '"652-4b6b48ffe0340"' || etag === '"18c8-508d2d594b3c0"') {
                etag = title;
                title += '（这篇通知需要权限）';
                time = moment().format('YYYY-MM-DD，H:mm:ss');
              }
              const data = {
                name: 'notice',
                firstETag: etag,
              };
              return Promise.all([
                href,
                time,
                title,
                NoticeModel.create(data),
              ]);
            })
            .then(([href, time, title]) => {
              NoticeModel.sendMeRes(`<p>数据库初始化成功，最新文章为 ${time} 发表的《${title}》</p><a href='${href}'>${href}</a>`);
              // console.log(`数据库初始化成功，最新文章为${time}发表的《${title}》 ${href}`);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`<p>数据库初始化失败：<p>${err}</p></p>`);
              // console.log(err);
            });
        } else {
          NoticeModel.requestOne('http://notice.ysu.edu.cn/')
            .then(([$]) => {
              preNotice(notice, $, 0);
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`<p>${err}</p>`);
              // console.log(err);
            });
        }
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`<p>${err}</p>`);
        // console.log(err);
      });
  };

  Notice();

  const flag = setInterval(Notice, 600000);

  const stopNotice = () => {
    clearInterval(flag);
    NoticeModel.sendMeRes('<p>系统侦测到严重漏洞，已启动自毁程序</p>');
    // console.log('系统侦测到严重漏洞，已启动自毁程序');
  };
};
