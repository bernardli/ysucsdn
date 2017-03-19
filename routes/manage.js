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
    var search = req.query.search;
    var top = null;
    var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

    if (parseInt(page) == 1) {
        Promise.all([
                PostModel.getPostsLimit(author, page, search, top, 'n'),
                PostModel.getPostsLimit(author, page, search, top, 'y')
            ])
            .then(function(results) {
                drafts = results[0];
                posts = results[1];
                res.render('manage', {
                    posts: posts,
                    drafts: drafts,
                    ip: ip
                });
            })
            .catch(next);
    } else {
        PostModel.getPostsLimit(author, page, search, top, 'y')
            .then(function(posts) {
                res.render('components/recent-posts', {
                    posts: posts
                });
            })
            .catch(next);
    }
});









module.exports = router;