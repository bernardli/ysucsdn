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
    var id = null;
    var email = null;
    var password = req.fields.password;

    UserModel.getUser(name, email, id)
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

// GET /signin/forget 找回密码页
router.get('/forget', checkNotLogin, function(req, res, next) {
    res.render('forget');
});

// POST /signin/forget 用户找回密码
router.post('/forget', checkNotLogin, function(req, res, next) {
    var data = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    var name = req.fields.name.toString();
    var email = req.fields.email.toString();
    var id = null;

    UserModel.getUser(name, email, id)
        .then(function(user) {
            if (!user) {
                req.flash('error', '用户或邮箱不正确');
                return res.redirect('back');
            } else {
                return Promise.all([
                    UserModel.getForgotByAuthor(user._id),
                    user
                ]);
            }
        })
        .then(function(results) {
            var forgot = results[0];
            var user = results[1];
            if (forgot) {
                req.flash('success', '请5分钟后再试');
                return res.redirect('back');
            } else {
                return user;
            }
        })
        .then(function(user) {
            var random = "";
            for (var i = 0; i < 40; i++) {
                var r = Math.floor(Math.random() * 62); //取得0-62间的随机数，目的是以此当下标取数组data里的值！  
                random += data[r];
            }
            var forgot = {
                author: user._id,
                createdAt: new Date(),
                random: random
            };
            return Promise.all([
                UserModel.createForgot(forgot),
                user
            ]);
        })
        .then(function(results) {
            var forgot = results[0].ops[0];
            var user = results[1];
            var random = forgot.random;
            var email = user.email;
            var transporter = nodemailer.createTransport(config.transporter);

            var mailOptions = {
                from: email_adress, // 发件人
                to: email, // 收件人
                subject: '欢迎使用找不回密码功能', // 标题
                text: "http://ysucsdn.cn/signin/password?r=" + random, // 内容
                html: "<a href=http://ysucsdn.cn/signin/password?r=" + random + ">点击找回密码</a>" // html
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
            });
            req.flash('success', '邮件已发送,请在5分钟内修改密码');
            res.redirect('back');
        })
        .catch(next);
});

// GET /signin/password 找回密码页
router.get('/password', checkNotLogin, function(req, res, next) {
    var random = req.query.r;

    UserModel.getForgotByrandom(random)
        .then(function(forget) {
            if (!forget) {
                req.flash('error', '404');
                return res.redirect('back');
            } else {
                res.render('password');
            }
        })
        .catch(next);
});

// POST /signin/password 通过忘记密码修改密码
router.post('/password', checkNotLogin, function(req, res, next) {
    var random = req.query.r;
    var newpassword = req.fields.password;
    var newrepassword = req.fields.repassword;
    var email = null;
    var name = null;

    UserModel.getForgotByrandom(random)
        .then(function(forget) {
            if (!forget) {
                req.flash('error', '404');
                return res.redirect('back');
            }
            // 返回用户信息
            return UserModel.getUser(name, email, forget.author);
        })
        .then(function(user) {
            if (newpassword.length < 6) {
                req.flash('error', '密码至少6位字符');
                return res.redirect('back');
            } else if (newpassword === newrepassword) {
                // 明文密码加密
                return Promise.all([
                    bcrypt.hash(newpassword, saltRounds),
                    user
                ]);
            } else {
                req.flash('error', '两次密码不一致');
                return res.redirect('back');
            }
        })
        .then(function(results) {
            var password = results[0];
            var user = results[1];
            var userId = user._id;
            var userName = user.name;
            return Promise.all([
                UserModel.updatePasswordById(userId, userName, { password: password }),
                UserModel.delForgotByAuthor(userId),
                user
            ]);
        })
        .then(function(results) {
            var user = results[2];
            var email = user.email;
            var transporter = nodemailer.createTransport(config.transporter);

            var mailOptions = {
                from: email_adress, // 发件人
                to: email, // 收件人
                subject: '您正在修改密码', // 标题
                text: "如果不是您本人操作，那我也没办法  ┑(￣Д ￣)┍" // 内容
                    //html: '<b>random</b>' // html
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
            });
            req.flash('success', '修改密码成功');
            // 跳转到主页
            res.redirect('/signin');
        })
        .catch(next);
});

module.exports = router;