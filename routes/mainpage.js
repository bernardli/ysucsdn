var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');

//获取解析后的主页页面
router.get('/', function(req, res, next) {
    var author = req.query.author;
    var page = 1;
    var search = req.query.search;
    var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

    Promise.all([
        PostModel.getPostslimit(author, page, search),
        PostModel.getannouncement()
    ])
        .then(function(results) {
            var posts = results[0];
            var announcement = results[1];
            res.render('mainpage', {
                posts: posts,
                announcement:announcement
            });
        })
        .catch(next);
});

module.exports = router;