const express = require('express');
const MessageModel = require('../models/messages');
const checkLogin = require('../middlewares/check').checkLogin;
const checkAdmin = require('../middlewares/check').checkAdmin;

const router = express.Router();

// GET /messages 文章页
//   eg: GET /messages?page=***
router.get('/', (req, res, next) => {
  const page = req.query.page || 1;
  const search = null;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  if (parseInt(page) === 1) {
    MessageModel.getMessagesLimit(page, search)
            .then((messages) => {
              res.render('messages', {
                messages,
                ip,
              });
            })
            .catch(next);
  } else {
    MessageModel.getMessagesLimit(page, search)
            .then((messages) => {
              res.render('components/limit-posts', {
                messages,
              });
            })
            .catch(next);
  }
});

// GET /messages 文章页
//   eg: POST /messages
router.post('/', checkLogin, (req, res, next) => {
  const content = req.fields.content;

    // 校验参数
  try {
    if (!content.length) {
      throw new Error('请填写内容');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  let message = {
    content,
  };

  MessageModel.create(message)
        .then((result) => {
          message = result.ops[0];
          req.flash('success', '发表成功');
          res.redirect('/messages');
        })
        .catch(next);
});

// GET /messages/:messageId/remove 删除一篇留言
router.get('/:messageId/remove', checkAdmin, (req, res, next) => {
  const messageId = req.params.messageId;

  if (req.session.user.identity.toString() === 'admin') {
    MessageModel.admindelMessageById(messageId)
            .then(() => {
              req.flash('success', '删除留言成功');
              res.redirect('/messages');
            })
            .catch(next);
  }
});


module.exports = router;
