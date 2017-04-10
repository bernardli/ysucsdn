const express = require('express');
const PostModel = require('../models/posts');
const checkLogin = require('../middlewares/check').checkLogin;
const NoticeModel = require('../models/emailNotice');

const router = express.Router();

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
//   eg: GET /manage/email
router.post('/email', checkLogin, (req, res, next) => {
  const ysuNotice = req.query.ysu;
  const replyNotice = req.query.reply;
  const data = {};
  if (ysuNotice) {
    data.ysuNotice = ysuNotice;
  }
  if (replyNotice) {
    data.replyNotice = replyNotice;
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
      }
      // 编辑成功后跳转到上一页
      res.redirect('back');
    })
    .catch(next);
});

module.exports = router;
