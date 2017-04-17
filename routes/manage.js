const express = require('express');
const PostModel = require('../models/posts');
const checkLogin = require('../middlewares/check').checkLogin;
const checkAdmin = require('../middlewares/check').checkAdmin;
const NoticeModel = require('../models/emailNotice');
const config = require('config-lite');
const EmailModel = require('../models/sendEmail');
const marked = require('marked');
const exec = require('child_process').exec;

const router = express.Router();
const EmailAdress = config.transporter.auth.user;

// GET /manage 后台管理
//   eg: GET /manage?search=***?page=***
router.get('/', checkLogin, (req, res, next) => {
  const page = req.query.page || 1;
  const author = req.session.user._id;
  const search = req.query.search;
  const top = null;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  if (parseInt(page) === 1) {
    Promise.all([
      PostModel.getPosts(author, search, top, 'n'),
      PostModel.getPostsLimit(author, page, search, top, 'y'),
    ])
      .then(([drafts, posts]) => {
        res.render('manage', {
          posts,
          drafts,
          ip,
        });
      })
      .catch(next);
  } else {
    PostModel.getPostsLimit(author, page, search, top, 'y')
      .then((posts) => {
        res.render('components/limit-posts-user', {
          posts,
        });
      })
      .catch(next);
  }
});

// GET /manage 后台管理
//   eg: GET /manage/email
router.get('/email', checkLogin, (req, res, next) => {
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
  const query = {
    user: req.session.user._id,
  };

  NoticeModel.getNotice(query)
    .then(([notice]) => {
      res.render('emailNotice', {
        notice,
        ip,
      });
    })
    .catch(next);
});

// GET /manage 后台管理
//   eg: GET /manage/push
router.get('/push', checkAdmin, (req, res, next) => {
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  res.render('push', {
    ip,
  });
});

// GET /manage 后台管理
//   eg: POST /manage/email
router.post('/email', checkLogin, (req, res, next) => {
  const ysuNotice = req.query.ysu;
  const replyNotice = req.query.reply;
  const pushNotice = req.query.push;
  if (ysuNotice && ['y', 'n'].includes(ysuNotice) === false) {
    req.flash('error', '参数错误');
    return res.redirect('back');
  }
  if (replyNotice && ['y', 'n'].includes(replyNotice) === false) {
    req.flash('error', '参数错误');
    return res.redirect('back');
  }
  if (pushNotice && ['y', 'n'].includes(pushNotice) === false) {
    req.flash('error', '参数错误');
    return res.redirect('back');
  }
  const data = {};
  if (ysuNotice) {
    data.ysuNotice = ysuNotice;
  }
  if (replyNotice) {
    data.replyNotice = replyNotice;
  }
  if (pushNotice) {
    data.pushNotice = pushNotice;
  }

  NoticeModel.updateNoticeByName(req.session.user._id, data)
    .then(() => {
      if (ysuNotice === 'n') {
        req.flash('success', '取消订阅成功');
      } else if (ysuNotice === 'y') {
        req.flash('success', '订阅成功');
      } else if (replyNotice === 'n') {
        req.flash('success', '取消订阅成功');
      } else if (replyNotice === 'y') {
        req.flash('success', '订阅成功');
      } else if (pushNotice === 'n') {
        req.flash('success', '取消订阅成功');
      } else if (pushNotice === 'y') {
        req.flash('success', '订阅成功');
      }
      // 编辑成功后跳转到上一页
      res.redirect('back');
    })
    .catch(next);
});

// GET /manage 后台管理
//   eg: POST /manage/push
router.post('/push', checkAdmin, (req, res, next) => {
  const title = req.fields.title;
  const content = marked(req.fields.content);

  // 校验参数
  try {
    if (!title.length) {
      throw new Error('请填写标题');
    }
    if (!content.length) {
      throw new Error('请填写内容');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  NoticeModel.getNotice({
    pushNotice: 'y',
  })
    .then((users) => {
      users.forEach((user) => {
        const mailOptions = {
          from: {
            name: 'YSUCSDN',
            address: EmailAdress,
          }, // 发件人
          to: user.user.email, // 收件人
          subject: title, // 标题
          text: '', // 内容
          html: content, // html
        };
        EmailModel.email(mailOptions);
      });
      req.flash('success', '推送成功');
      // 发表成功后跳转到该文章页
      res.redirect('back');
    })
    .catch(next);
});

// GET /manage 后台管理
//   eg: POST /manage/webhooks
router.post('/webhooks', (req, res, next) => {
  const {
    'X-Hub-Signature': secret,
    'X-GitHub-Event': event,
  } = req.headers;
  if (secret === config.webhooks && event === 'push') {
    exec('sh /root/ysucsdn/tools/restart.sh');
  }
});

module.exports = router;
