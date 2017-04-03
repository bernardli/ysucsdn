const express = require('express');
const UserModel = require('../models/users');
const checkLogin = require('../middlewares/check').checkLogin;
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const saltRounds = 10;
const router = express.Router();

// GET /setting 用户设置页面
router.get('/', (req, res, next) => {
  const name = req.query.name;
  const email = null;
  const id = null;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
  UserModel.getUser(name, email, id)
        .then((user) => {
          res.render('setting', {
            user,
            ip,
          });
        })
        .catch(next);
});

// POST /setting/bio 修改用户信息
router.post('/bio', checkLogin, (req, res, next) => {
    // 从session中获取用户 id
  const userId = req.session.user._id;
    // 从session中获取用户 name
  const userName = req.session.user.name;
  const bio = req.fields.bio;
  if (!(bio.length >= 0 && bio.length <= 30)) {
    req.flash('error', '个人简介请限制在 1-30 个字符');
    return res.redirect(`/setting?name${userName}`);
  }
  UserModel.updateUser(userId, userName, { bio })
        .then(() => {
          req.flash('success', '修改介绍成功');
            // 编辑成功后跳转到上一页
          res.redirect(`/setting?name${userName}`);
        })
        .catch(next);
});

// POST /setting/gender 修改用户性别
router.post('/gender', checkLogin, (req, res, next) => {
    // 从session中获取用户 id
  const userId = req.session.user._id;
    // 从session中获取用户 name
  const userName = req.session.user.name;
  const gender = req.fields.gender;
  if (['m', 'f', 'x'].indexOf(gender) === -1) {
    req.flash('error', '性别只能是 m、f 或 x');
    return res.redirect(`/setting?name${userName}`);
  }
  UserModel.updateUser(userId, userName, { gender })
        .then(() => {
          req.flash('success', '修改性别成功');
            // 编辑成功后跳转到上一页
          res.redirect(`/setting?name${userName}`);
        })
        .catch(next);
});

// POST /setting/avatar 修改头像
router.post('/avatar', checkLogin, (req, res, next) => {
    // 从session中获取用户 id
  const userId = req.session.user._id;
    // 从session中获取用户 name
  const userName = req.session.user.name;

  const oldAvatar = req.query.avatarId;

  const newAvatar = req.files.avatar.path.split(path.sep).pop();

  if (!req.files.avatar.name) {
    req.flash('error', '缺少头像');
    fs.unlink(req.files.avatar.path);
    return res.redirect(`/setting?name${userName}`);
  }

  UserModel.updateUser(userId, userName, { avatar: newAvatar })
        .then(() => {
          req.flash('success', '修改成功');
            // 删除旧的头像(先判断是否是默认头像)
          if (oldAvatar !== '../local/defaultAvatar.png') {
            fs.unlink(`public/img/users_avatar/${oldAvatar}`);
          }
            // 编辑成功后跳转到上一页
          res.redirect(`/setting?name${userName}`);
        })
        .catch(next);
});

// POST /setting/password 修改密码
router.post('/password', checkLogin, (req, res, next) => {
    // 从session中获取用户 id
  const userId = req.session.user._id;
    // 从session中获取用户 name
  const userName = req.session.user.name;

  const oldpassword = req.fields.oldpassword;
  const newpassword = req.fields.newpassword;
  const newrepassword = req.fields.newrepassword;
  const email = null;
  const id = null;

  UserModel.getUser(userName, email, id)
        .then(user => bcrypt.compare(oldpassword, user.password))
        .then((result) => {
            // 检查密码是否匹配
          if (result === false) {
            req.flash('error', '原密码错误');
            return res.redirect('back');
          } else if (newpassword.length < 6) {
            req.flash('error', '密码至少6位字符');
            return res.redirect('back');
          } else if (!(newpassword !== newrepassword)) {
                // 明文密码加密
            return bcrypt.hash(newpassword, saltRounds);
          }
          req.flash('error', '两次密码不一致');
          return res.redirect('back');
        })
        .then(newpassword => UserModel.updateUser(userId, userName, { password: newpassword }))
        .then(() => {
          req.flash('success', '修改密码成功');
            // 编辑成功后跳转到上一页
          res.redirect('back');
        })
        .catch(next);
});

module.exports = router;
