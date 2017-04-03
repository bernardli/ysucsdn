const express = require('express');
const PostModel = require('../models/posts');
const checkLogin = require('../middlewares/check').checkLogin;

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
      PostModel.getPostsLimit(author, page, search, top, 'n'),
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
              res.render('components/posts-content--user', {
                posts,
              });
            })
            .catch(next);
  }
});

// GET /manage 后台管理
//   eg: GET /manage/email
router.get('/email', checkLogin, (req, res, next) => {
  const page = req.query.page || 1;
  const author = req.session.user._id;
  const search = req.query.search;
  const top = null;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  if (parseInt(page) === 1) {
    Promise.all([
      PostModel.getPostsLimit(author, page, search, top, 'n'),
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
              res.render('components/posts-content--user', {
                posts,
              });
            })
            .catch(next);
  }
});

// GET /manage 后台管理
//   eg: GET /manage/email
router.post('/email', checkLogin, (req, res, next) => {
  const page = req.query.page || 1;
  const author = req.session.user._id;
  const search = req.query.search;
  const top = null;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  if (parseInt(page) === 1) {
    Promise.all([
      PostModel.getPostsLimit(author, page, search, top, 'n'),
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
              res.render('components/posts-content--user', {
                posts,
              });
            })
            .catch(next);
  }
});

module.exports = router;
