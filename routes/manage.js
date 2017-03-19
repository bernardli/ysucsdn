var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');
var UserModel = require('../models/users');
var CommentModel = require('../models/comments');
var checkLogin = require('../middlewares/check').checkLogin;
var checkAdmin = require('../middlewares/check').checkAdmin;

// GET /manage 后台管理
//   eg: GET /manage?author=***
router.get('/', function(req, res, next) {
    var page = req.query.page || 1;
    var author = req.query.author;
    var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

    res.render('manage');


    /*if (parseInt(page) == 1) {
        Promise.all([
                PostModel.getrecentPosts(page),
                PostModel.gettopPosts()
            ])
            .then(function(results) {
                posts = results[0];
                tops = results[1];
                res.render('posts', {
                    posts: posts,
                    tops: tops,
                    ip: ip
                });
            })
            .catch(next);
    } else {
        PostModel.getrecentPosts(page)
            .then(function(posts) {
                res.render('components/recent-posts', {
                    posts: posts
                });
            })
            .catch(next);
    }*/
});









module.exports = router;