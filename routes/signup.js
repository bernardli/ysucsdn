var fs = require('fs');
var path = require('path');
var bcrypt = require('bcrypt');
var saltRounds = 10;
var express = require('express');
var router = express.Router();
var config = require('config-lite');
var nodemailer = require('nodemailer');

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;
var email_adress=config.transporter.auth.user;

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next) {
    var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
    res.render('signup', {
        ip: ip
    });
});

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {
    var name = req.fields.name;
    var gender = req.fields.gender;
    var bio = req.fields.bio;
    var avatar = req.files.avatar.path.split(path.sep).pop();
    var password = req.fields.password;
    var repassword = req.fields.repassword;
    var email = req.fields.email;
    var transporter = nodemailer.createTransport(config.transporter);

    // 校验参数
    try {
        if (!(name.length >= 1 && name.length <= 10)) {
            throw new Error('名字请限制在 1-10 个字符');
        }
        if (['m', 'f', 'x'].indexOf(gender) === -1) {
            throw new Error('性别只能是 m、f 或 x');
        }
        if (!(bio.length >= 0 && bio.length <= 30)) {
            throw new Error('个人简介请限制在 0-30 个字符');
        }
        if (password.length < 6) {
            throw new Error('密码至少 6 个字符');
        }
        if (password !== repassword) {
            throw new Error('两次输入密码不一致');
        }
    } catch (e) {
        // 注册失败，异步删除上传的头像
        fs.unlink(req.files.avatar.path);
        req.flash('error', e.message);
        return res.redirect('/signup');
    }

    // 明文密码加密
    bcrypt.hash(password, saltRounds)
        .then(function(password) {
            //分配默认头像
            if (!req.files.avatar.name) {
                //异步删除上传的头像
                fs.unlink(req.files.avatar.path);
                //设置默认头像
                avatar = "../local/defaultAvatar.png";
            }
            // 待写入数据库的用户信息
            var user = {
                name: name,
                password: password,
                identity: 'normal',
                gender: gender,
                bio: bio,
                avatar: avatar,
                email: email,
                point: 0
            };
            return user;
        })
        .then(function(user) {
            return UserModel.create(user); // 用户信息写入数据库
        })
        .then(function(result) {
            // 此 user 是插入 mongodb 后的值，包含 _id
            user = result.ops[0];
            // 将用户信息存入 session
            delete user.password;
            req.session.user = user;
            // 写入 flash
            req.flash('success', '注册成功');
            // 跳转到首页
            res.redirect('/posts');
            //发送欢迎邮件
            var mailOptions = {
                from: '"welcome" '+email_adress+'', // 发件人
                to: user.email, // 收件人
                subject: '欢迎' + user.name, // 标题
                text: '欢迎', // 内容
                html: '<b>welcome</b>' // html
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
            });
        })
        .catch(function(e) {
            // 注册失败，异步删除上传的头像
            fs.unlink(req.files.avatar.path);
            // 用户名被占用则跳回注册页，而不是错误页
            if (e.message.match('E11000 duplicate key')) {
                req.flash('error', '用户名已被占用');
                return res.redirect('/signup');
            }
            next(e);
        });
});

module.exports = router;