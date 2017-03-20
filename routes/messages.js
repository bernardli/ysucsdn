var express = require('express');
var router = express.Router();

var MessageModel = require('../models/messages');
var checkLogin = require('../middlewares/check').checkLogin;
var checkAdmin = require('../middlewares/check').checkAdmin;

// GET /messages 文章页
//   eg: GET /messages?page=***
router.get('/', function(req, res, next) {
    var page = req.query.page || 1;
    var search = null;
    var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

    if (parseInt(page) == 1) {
        MessageModel.getMessagesLimit(page, search)
            .then(function(messages) {
                res.render('messages', {
                    messages: messages,
                    ip: ip
                });
            })
            .catch(next);
    } else {
        MessageModel.getMessagesLimit(page, search)
            .then(function(messages) {
                res.render('components/recent-posts', {
                    messages: messages
                });
            })
            .catch(next);
    }
});

// GET /messages 文章页
//   eg: POST /messages
router.post('/', checkLogin, function(req, res, next) {
    var content = req.fields.content;

    // 校验参数
    try {
        if (!content.length) {
            throw new Error('请填写内容');
        }
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('back');
    }

    var message = {
        content: content
    };

    MessageModel.create(message)
        .then(function(result) {
            message = result.ops[0];
            req.flash('success', '发表成功');
            res.redirect('/messages');
        })
        .catch(next);
});

// GET /messages/:messageId/remove 删除一篇留言
router.get('/:messageId/remove', checkAdmin, function(req, res, next) {
    var messageId = req.params.messageId;

    if (req.session.user.identity.toString() === 'admin') {
        MessageModel.admindelMessageById(messageId)
            .then(function() {
                req.flash('success', '删除留言成功');
                res.redirect('/messages');
            })
            .catch(next);
    }
});





module.exports = router;