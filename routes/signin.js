const bcrypt = require('bcrypt');
const config = require('config-lite');
const express = require('express');

const router = express.Router();
const saltRounds = 10;
const EmailAdress = config.transporter.auth.user;

const UserModel = require('../models/users');
const EmailModel = require('../models/sendEmail');
const checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signin 登录页
router.get('/', checkNotLogin, (req, res, next) => {
    const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
    res.render('signin', {
        ip,
    });
});

// POST /signin 用户登录
router.post('/', checkNotLogin, (req, res, next) => {
    const name = req.fields.name.toString();
    const id = null;
    const email = null;
    const password = req.fields.password;

    UserModel.getUser(name, email, id)
        .then((user) => {
            if (!user) {
                req.flash('error', '用户不存在');
                return res.redirect('back');
            }
            // 检查密码是否匹配
            return Promise.all([
                bcrypt.compare(password, user.password),
                user,
            ]);
        })
        .then(([result, user]) => {
            if (result === false) {
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
router.get('/forget', checkNotLogin, (req, res, next) => {
    res.render('forget');
});

// POST /signin/forget 用户找回密码
router.post('/forget', checkNotLogin, (req, res, next) => {
    const data = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const name = req.fields.name.toString();
    const email = req.fields.email.toString();
    const id = null;

    UserModel.getUser(name, email, id)
        .then((user) => {
            if (!user) {
                req.flash('error', '用户或邮箱不正确');
                return res.redirect('back');
            }
            return Promise.all([
                UserModel.getForgotByAuthor(user._id),
                user,
            ]);
        })
        .then(([forgot, user]) => {
            if (forgot) {
                req.flash('success', '请5分钟后再试');
                return res.redirect('back');
            }
            return user;
        })
        .then((user) => {
            let random = '';
            for (let i = 0; i < 40; i++) {
                const r = Math.floor(Math.random() * 62); // 取得0-62间的随机数，目的是以此当下标取数组data里的值！
                random += data[r];
            }
            const forgot = {
                author: user._id,
                createdAt: new Date(),
                random,
            };
            return Promise.all([
                UserModel.createForgot(forgot),
                user,
            ]);
        })
        .then((results) => {
            const forgot = results[0].ops[0];
            const user = results[1];
            const random = forgot.random;
            const email = user.email;

            req.flash('success', '邮件已发送,请在5分钟内修改密码');
            res.redirect('back');

            const mailOptions = {
                from: EmailAdress, // 发件人
                to: email, // 收件人
                subject: '欢迎使用找不回密码功能', // 标题
                text: `http://ysucsdn.cn/signin/password?r=${random}`, // 内容
                html: `<a href=http://ysucsdn.cn/signin/password?r=${random}>点击找回密码</a>`, // html
            };
            EmailModel.email(mailOptions);
        })
        .catch(next);
});

// GET /signin/password 找回密码,设置新密码页
router.get('/password', checkNotLogin, (req, res, next) => {
    const random = req.query.r;

    UserModel.getForgotByrandom(random)
        .then((forget) => {
            if (!forget) {
                req.flash('error', '404');
                return res.redirect('back');
            }
            res.render('password');
        })
        .catch(next);
});

// POST /signin/password 通过忘记密码修改密码
router.post('/password', checkNotLogin, (req, res, next) => {
    const random = req.query.r;
    const newpassword = req.fields.password;
    const newrepassword = req.fields.repassword;
    const email = null;
    const name = null;

    UserModel.getForgotByrandom(random)
        .then((forget) => {
            if (!forget) {
                req.flash('error', '404');
                return res.redirect('back');
            }
            // 返回用户信息
            return UserModel.getUser(name, email, forget.author);
        })
        .then((user) => {
            if (newpassword.length < 6) {
                req.flash('error', '密码至少6位字符');
                return res.redirect('back');
            } else if (newpassword === newrepassword) {
                // 明文密码加密
                return Promise.all([
                    bcrypt.hash(newpassword, saltRounds),
                    user,
                ]);
            }
            req.flash('error', '两次密码不一致');
            return res.redirect('back');
        })
        .then(([password, user]) => {
            const userId = user._id;
            const userName = user.name;
            return Promise.all([
                user,
                UserModel.updateUser(userId, userName, { password }),
                UserModel.delForgotByAuthor(userId),
            ]);
        })
        .then(([user]) => {
            const email = user.email;

            req.flash('success', '修改密码成功');
            // 跳转到主页
            res.redirect('/signin');

            const mailOptions = {
                from: EmailAdress, // 发件人
                to: email, // 收件人
                subject: '您正在修改密码', // 标题
                text: '如果不是您本人操作，那我也没办法  ┑(￣Д ￣)┍', // 内容
                // html: '<b>random</b>' // html
            };
            EmailModel.email(mailOptions);
        })
        .catch(next);
});

module.exports = router;