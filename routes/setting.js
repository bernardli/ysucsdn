var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkLogin = require('../middlewares/check').checkLogin;

var fs = require('fs');
var path = require('path');

//GET /setting 用户设置页面
router.get('/', function(req, res, next) {
    var name = req.query.name;
    UserModel.getUserByName(name)
        .then(function(user) {
            res.render('setting', {
                user: user
            });
        })
        .catch(next);
});

//POST /setting/bio 修改用户信息
router.post('/bio', checkLogin, function(req, res, next) {
    //从session中获取用户 id
    var userId = req.session.user._id;
    //从session中获取用户 name
    var userName = req.session.user.name;
    var bio = req.fields.bio;
    if (!(bio.length >= 0 && bio.length <= 30)) {
        req.flash('error', '个人简介请限制在 1-30 个字符');
        return res.redirect('/setting' + '?name=' + userName);
    }
    UserModel.updateBioById(userId, userName, { bio: bio })
        .then(function() {
            req.flash('success', '修改介绍成功');
            // 编辑成功后跳转到上一页
            res.redirect('/setting' + '?name=' + userName);
        })
        .catch(next);
});

// POST /setting/avatar 修改头像
router.post('/avatar', checkLogin, function(req, res, next) {
    //从session中获取用户 id
    var userId = req.session.user._id;
    //从session中获取用户 name
    var userName = req.session.user.name;

    var oldAvatar = req.query.avatarId;

    var newAvatar = req.files.avatar.path.split(path.sep).pop();

    if (!req.files.avatar.name) {
        req.flash('error', '缺少头像');
        fs.unlink(req.files.avatar.path);
        return res.redirect('/setting' + '?name=' + userName);
    }

    UserModel.updateAvatarById(userId, userName, { avatar: newAvatar })
        .then(function() {
            req.flash('success', '修改成功');
            //删除旧的头像
            fs.unlink('public/img/users_avatar/' + oldAvatar);
            // 编辑成功后跳转到上一页
            res.redirect('/setting' + '?name=' + userName);
        })
        .catch(next);
});

router.post('/password', checkLogin, function(req, res, next) {

});

module.exports = router;