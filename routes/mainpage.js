var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');

//获取解析后的主页页面
router.get('/', function(req, res, next) {
    var author = req.query.author;
    var page = 1;
    var search = req.query.search;
    var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);


    PostModel.getannouncement()
        .then(function(announcement) {
            //增加点击量
            var postId = announcement.author;
            var w_pv; //判断是否+1s//1 +1s//0
            var reading = new RegExp(postId);
            if (reading.test(req.session.read) == false) {
                w_pv = 1;
                req.session.read = req.session.read + postId + ',';
            } else {
                w_pv = 0;
            }
            return PostModel.incPv(postId, w_pv);
        })
        .then(function(incPv_result) {
            return Promise.all([
                PostModel.getPostslimit(author, page, search),
                PostModel.getannouncement()
                ]);
        })
        .then(function(results) {
            var posts = results[0];
            var announcement = results[1];
            res.render('mainpage', {
                posts: posts,
                announcement: announcement
            });
        });
});

module.exports = router;