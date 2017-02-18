var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');

//获取解析后的主页页面
router.get('/', function(req, res, next) {
    var author = req.query.author;
    var page = 1;

    PostModel.getPostslimit(author, page)
        .then(function(posts) {
            res.render('mainpage', {
                posts: posts
            });
        })
        .catch(next);
});

module.exports = router;