const express = require('express');
const config = require('config-lite');
const PostModel = require('../models/posts');
const EmailModel = require('../models/sendEmail');
const UserModel = require('../models/users');
const CommentModel = require('../models/comments');
const checkLogin = require('../middlewares/check').checkLogin;
const checkAdmin = require('../middlewares/check').checkAdmin;
const NoticeModel = require('../models/emailNotice');

const EmailAdress = config.transporter.auth.user;
const router = express.Router();

// GET /posts 文章页
//   eg: GET /posts?page=***
router.get('/', (req, res, next) => {
  const author = null;
  const page = req.query.page || 1;
  const search = null;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  if (parseInt(page) === 1) {
    Promise.all([
      PostModel.getPostsLimit(author, page, search, 'n', 'y'), // 获取最新的文章，不包括置顶
      PostModel.getPosts(author, search, 'y', 'y'), // 获取置顶文章
    ])
      .then(([posts, tops]) => {
        res.render('posts', {
          posts,
          tops,
          ip,
        });
      })
      .catch(next);
  } else {
    PostModel.getPostsLimit(author, page, search, 'n', 'y') // 获取最新的文章，不包括置顶
      .then((posts) => {
        res.render('components/limit-posts', {
          posts,
        });
      })
      .catch(next);
  }
});

// GET /posts 搜索页
//   eg: GET /posts/s?search=***?page=***
router.get('/s', (req, res, next) => {
  const author = null;
  const search = req.query.search;
  const page = req.query.page || 1;
  const top = null;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  if (parseInt(page) === 1) {
    PostModel.getPostsLimit(author, page, search, top, 'y')
      .then((posts) => {
        res.render('search', {
          posts,
          ip,
        });
      })
      .catch(next);
  } else {
    PostModel.getPostsLimit(author, page, search, top, 'y')
      .then((posts) => {
        res.render('components/limit-posts', {
          posts,
        });
      })
      .catch(next);
  }
});

// GET /posts 特定用户的文章页
//   eg: GET /posts/user?author=***?page=***
router.get('/user', (req, res, next) => {
  const author = req.query.author;
  const search = null;
  const page = req.query.page || 1;
  const top = null;
  const name = null;
  const email = null;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  if (parseInt(page) === 1) {
    Promise.all([
      PostModel.getPostsLimit(author, page, search, top, 'y'),
      UserModel.getUser(name, email, author),
    ])
      .then(([posts, author]) => {
        if (!author) {
          req.flash('error', '没有这个用户');
          return res.redirect('/posts');
        }
        res.render('user_posts', {
          posts,
          author,
          ip,
          page,
        });
      })
      .catch(next);
  } else {
    PostModel.getPostsLimit(author, page, search, top, 'y')
      .then((posts) => {
        res.render('components/limit-posts', {
          posts,
          page,
        });
      })
      .catch(next);
  }
});


// GET /posts/create 发表文章页
router.get('/create', checkLogin, (req, res, next) => {
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
  res.render('create', {
    ip,
  });
});

// POST /posts 发表一篇文章
router.post('/', checkLogin, (req, res, next) => {
  const author = req.session.user._id;
  const title = req.fields.title;
  const content = req.fields.content;
  const tags = req.fields.tags.split(' '); // 使用空格把字符串分割为数组
  const p = req.query.p;

  // 校验参数
  try {
    if (!title.length) {
      throw new Error('请填写标题');
    }
    if (!content.length) {
      throw new Error('请填写内容');
    }
    if (['y', 'n'].includes(p) === false) {
      throw new Error('参数错误');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  let post = {
    author,
    title,
    content,
    tags,
    pv: 0,
    top: 'n',
    published: p,
  };

  PostModel.create(post)
    .then((result) => {
      // 此 post 是插入 mongodb 后的值，包含 _id
      post = result.ops[0];
      if(p==='y'){
        req.flash('success', '文章发表成功');
      }else{
        req.flash('success', '草稿保存成功');
      }
      // 发表成功后跳转到该文章页
      res.redirect(`/posts/${post._id}`);
    })
    .catch(next);
});

// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', (req, res, next) => {
  const postId = req.params.postId;
  const page = req.query.page || 1;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
  let wPv; // 判断是否+1s//1 +1s//0
  const reading = new RegExp(postId);
  if (reading.test(req.session.read) === false) {
    wPv = 1;
    req.session.read = `${req.session.read + postId},`;
  } else {
    wPv = 0;
  }
  if (parseInt(page) === 1) {
    // pv 加 1   浏览量
    PostModel.incPv(postId, wPv)
      .then(() => Promise.all([
        PostModel.getPostById(postId), // 获取文章信息
        CommentModel.getCommentslimit(postId, page), // 获取该文章所有留言
      ]))
      .then(([post, comments]) => {
        if (!post) {
          throw new Error('该文章不存在');
        }
        res.render('post', {
          post,
          comments,
          ip,
          page,
        });
      })
      .catch(next);
  } else {
    CommentModel.getCommentslimit(postId, page) // 获取该文章留言
      .then((comments) => {
        res.render('components/limit-comments', {
          comments,
          page,
        });
      })
      .catch(next);
  }
});

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, (req, res, next) => {
  const postId = req.params.postId;
  const author = req.session.user._id;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
  PostModel.getRawPostById(postId)
    .then((post) => {
      if (!post) {
        throw new Error('该文章不存在');
      }
      if (author.toString() !== post.author._id.toString()) {
        throw new Error('权限不足');
      }
      res.render('edit', {
        post,
        ip,
      });
    })
    .catch(next);
});

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, (req, res, next) => {
  // 通过占位符获取文章ID
  const postId = req.params.postId;
  // 从session中获取用户ID
  const author = req.session.user._id;
  // 获取修改页面表格传来的 title,content 的数据
  const title = req.fields.title;
  const content = req.fields.content;
  const tags = req.fields.tags.split(' '); // 使用空格把字符串分割为数组
  const p = req.query.p;

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

  PostModel.updatePostById(postId, author, {
    title,
    content,
    published: p,
    tags,
  })
    .then(() => {
      if(p==='y'){
        req.flash('success', '文章编辑成功');
      }else{
        req.flash('success', '草稿编辑成功');
      }
      // 编辑成功后跳转到上一页
      res.redirect(`/posts/${postId}`);
    })
    .catch(next);
});

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, (req, res, next) => {
  const postId = req.params.postId;
  const author = req.session.user._id;

  if (req.session.user.identity.toString() === 'admin') {
    PostModel.admindelPostById(postId)
      .then(() => {
        req.flash('success', '删除文章成功');
        // 删除成功后跳转到主页
        res.redirect('/posts');
      })
      .catch(next);
  } else {
    PostModel.delPostById(postId, author)
      .then(() => {
        req.flash('success', '删除文章成功');
        // 删除成功后跳转到主页
        res.redirect('/posts');
      })
      .catch(next);
  }
});

// GET /posts/:postId/top 置顶或取消置顶一篇文章
router.get('/:postId/top', checkAdmin, (req, res, next) => {
  const t = req.query.t;
  const postId = req.params.postId;
  if (['y', 'n'].includes(t) === false) {
    req.flash('error', '参数错误');
    return res.redirect('back');
  }

  PostModel.admintopPostById(postId, t)
    .then(() => {
      if (t === 'n') {
        req.flash('success', '取消置顶文章成功');
      }
      if (t === 'y') {
        req.flash('success', '置顶文章成功');
      }
      // 置顶或取消置顶成功后跳转到主页
      res.redirect('/posts');
    })
    .catch(next);
});

// POST /posts/:postId/comment 创建一条留言
router.post('/:postId/comment', checkLogin, (req, res, next) => {
  const author = req.session.user._id;
  const postId = req.params.postId;
  const content = req.fields.content;
  const comment = {
    author,
    postId,
    content,
  };

  Promise.all([
    PostModel.getPostById(postId),
    CommentModel.create(comment),
  ])
    .then(([post]) => Promise.all([
      post,
      NoticeModel.getNotice({
        user: post.author._id,
      }),
    ]))
    .then(([post, [notice]]) => {
      const email = post.author.email;
      const title = post.title;
      req.flash('success', '留言成功');
      // 留言成功后跳转到上一页
      res.redirect('back');
      if (req.session.user.name !== post.author.name && notice.replyNotice === 'y') {
        const mailOptions = {
          from: {
            name: 'YSUCSDN',
            address: EmailAdress,
          }, // 发件人
          to: email, // 收件人
          subject: '您的文章有了新的评论', // 标题
          text: '', // 内容
          html: `<p>用户： ${req.session.user.name} 在您的文章《${title}》中评论到： “${content}”</p><p>点击链接查看：</p><a href='http://ysucsdn.cn/posts/${postId}'>http://ysucsdn.cn/posts/${postId}</a>`, // html
        };
        EmailModel.email(mailOptions);
      }
    })
    .catch(next);
});

// GET /posts/:postId/comment/:commentId/remove 删除一条留言
router.get('/:postId/comment/:commentId/remove', checkLogin, (req, res, next) => {
  const commentId = req.params.commentId;
  const author = req.session.user._id;

  if (req.session.user.identity.toString() === 'admin') {
    CommentModel.admindelCommentById(commentId)
      .then(() => {
        req.flash('success', '删除留言成功');
        // 删除成功后跳转到上一页
        res.redirect('back');
      })
      .catch(next);
  } else {
    CommentModel.delCommentById(commentId, author)
      .then(() => {
        req.flash('success', '删除留言成功');
        // 删除成功后跳转到上一页
        res.redirect('back');
      })
      .catch(next);
  }
});

module.exports = router;
