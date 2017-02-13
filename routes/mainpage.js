var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');

//获取解析后的主页页面
router.get('/', function(req, res, next) {
    PostModel.getPosts()
        .then(function(posts) {
            res.render('mainpage', {
                posts: posts
            });
        })
        .catch(next);
});

module.exports = router;