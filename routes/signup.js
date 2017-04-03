const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const express = require('express');
const config = require('config-lite');
const UserModel = require('../models/users');
const EmailModel = require('../models/sendEmail');
const checkNotLogin = require('../middlewares/check').checkNotLogin;
const NoticeModel = require('../models/ysuNotice');

const saltRounds = 10;
const router = express.Router();
const EmailAdress = config.transporter.auth.user;

// GET /signup 注册页
router.get('/', checkNotLogin, (req, res, next) => {
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
  res.render('signup', {
    ip,
  });
});

// POST /signup 用户注册
router.post('/', checkNotLogin, (req, res, next) => {
  const name = req.fields.name;
  const gender = req.fields.gender;
  const bio = req.fields.bio;
  let avatar = req.files.avatar.path.split(path.sep).pop();
  const password = req.fields.password;
  const repassword = req.fields.repassword;
  const email = req.fields.email;

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
    req.flash('error', e.message);
    return res.redirect('/signup');
  }
  try {
    // 分配默认头像
    if (!req.files.avatar.name) {
      throw new Error('无头像');
    }
  } catch (e) {
    // 注册失败，异步删除上传的头像
    fs.unlink(req.files.avatar.path);
    // 设置默认头像
    avatar = '../local/defaultAvatar.png';
  }

  // 明文密码加密
  bcrypt.hash(password, saltRounds)
    .then((password) => {
      // 待写入数据库的用户信息
      const user = {
        name,
        password,
        identity: 'normal',
        gender,
        bio,
        avatar,
        email,
        point: 0,
      };
      return user;
    })
    .then(user => Promise.all([
      UserModel.create(user), // 用户信息写入数据库
      NoticeModel.getNotice('notice'),
    ]))
    .then(([result, notice]) => {
      const emails = notice[0].emails;
      const set = new Set(emails);
      set.add(email);
      return Promise.all([
        result,
        NoticeModel.updateNoticeByName('notice', {
          emails: [...set],
        }),
      ]);
    })
    .then(([result]) => {
      // 此 user 是插入 mongodb 后的值，包含 _id
      const user = result.ops[0];
      // 将用户信息存入 session
      delete user.password;
      req.session.user = user;
      // 写入 flash
      req.flash('success', '注册成功');
      // 跳转到首页
      res.redirect('/posts');
      // 发送欢迎邮件
      const mailOptions = {
        from: `"welcome" ${EmailAdress}`, // 发件人
        to: user.email, // 收件人
        subject: `欢迎${user.name}`, // 标题
        text: '', // 内容
        html: '<b>welcome</b>', // html
      };
      EmailModel.email(mailOptions);
    })
    .catch((e) => {
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
