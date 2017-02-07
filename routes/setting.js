var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkLogin = require('../middlewares/check').checkLogin;

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

//POST /setting 修改用户信息
router.post('/bio', checkLogin, function(req, res, next) {
    //从session中获取用户 id
    var userId = req.session.user._id;
    //从session中获取用户 name
    var userName = req.session.user.name;
    var bio = req.fields.bio;
    if (!(bio.length >= 1 && bio.length <= 30)) {
        throw new Error('个人简介请限制在 1-30 个字符');
    }
    UserModel.updateBioById(userId, userName, { bio: bio })
        .then(function() {
            req.flash('success', '修改介绍成功');
            // 编辑成功后跳转到上一页
            res.redirect('/setting' + '?name=' + userName);
        })
        .catch(next);
});

module.exports = router;