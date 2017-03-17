var bcrypt = require('bcrypt');
var saltRounds = 10;
var express = require('express');
var router = express.Router();
var config = require('config-lite');
var nodemailer = require('nodemailer');

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;
var email_adress = config.transporter.auth.user;

// GET /signin 登录页
router.get('/', checkNotLogin, function(req, res, next) {
    var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
    res.render('signin', {
        ip: ip
    });
});

// POST /signin 用户登录
router.post('/', checkNotLogin, function(req, res, next) {
    var name = req.fields.name.toString();
    var password = req.fields.password;

    UserModel.getUserByName(name)
        .then(function(user) {
            if (!user) {
                req.flash('error', '用户不存在');
                return res.redirect('back');
            }
            // 检查密码是否匹配
            return Promise.all([
                bcrypt.compare(password, user.password),
                user
            ]);
        })
        .then(function(results) {
            result = results[0];
            user = results[1];
            if (result == false) {
                req.flash('error', '用户名或密码错误');
                return res.redirect('back');
            }
            req.flash('success', '登录成功');
            // 用户信息写入 session
            delete user.password;
            req.session.user = user;
            // 跳转到主页
            res.redirect('/posts');
        })
        .catch(next);
});

// POST /signin/forget 用户找回密码
router.post('/forget', checkNotLogin, function(req, res, next) {
    var name = req.fields.name.toString();
    UserModel.getUserByName(name)
        .then(function(user) {
            if (!user) {
                req.flash('error', '用户不存在');
                return res.redirect('back');
            }
            var forgot = {
                author: user._id,
                random: "0dsjfnsjndfojnsjdnfjsjdflnlzkmdakwkmaldjosjfldkml"
            };
            return Promise.all([
                forgot,
                user
            ]);
        })
        .then(function(results) {
            var forgot=results[0];
            var user=results[1];
            return Promise.all([
                UserModel.createForgot(forgot),
                user
            ]);
        })
        .then(function(results) {
            var forgot=results[0];
            var user=results[1];
            var email=user.email;
            var random=forgot.random
            var transporter = nodemailer.createTransport(config.transporter);

            var mailOptions = {
                from: '"puresox" ' + email_adress + '', // 发件人
                to: email, // 收件人
                subject: '欢迎使用找不回密码功能', // 标题
                text: random, // 内容
                html: '<b>滑稽</b>' // html
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
            });
            req.flash('success', '邮件已发送');
            res.redirect('back');
        })
        .catch(next);
});

module.exports = router;