const express = require('express');
const PostModel = require('../models/posts');
const checkLogin = require('../middlewares/check').checkLogin;
const NoticeModel = require('../models/ysuNotice');

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

/*// GET /manage 后台管理
//   eg: GET /manage/email
router.get('/email', checkLogin, (req, res, next) => {
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  res.render('emailNotice', {
    ip,
  });
});

// GET /manage 后台管理
//   eg: GET /manage/email
router.post('/email', checkLogin, (req, res, next) => {
  const email = req.fields.email;

  NoticeModel.getNotice('notice')
  .then((notice) => {
    const emails = notice[0].emails;
    const set = new Set(emails);
    set.add(email);
    return NoticeModel.updateNoticeByName('notice', { emails: [...set] });
  })
    .then(() => {
      req.flash('success', '成功');
      // 编辑成功后跳转到上一页
      res.redirect('back');
    })
    .catch(next);
});*/

module.exports = router;
