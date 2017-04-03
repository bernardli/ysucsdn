const express = require('express');

const router = express.Router();
const PostModel = require('../models/posts');

// 获取解析后的主页页面
router.get('/', (req, res, next) => {
  const author = req.query.author;
  const page = 1;
  const search = req.query.search;
  const ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);

  res.render('mainpage');


    /* PostModel.getannouncement()
        .then(function(announcement) {
            //增加点击量
            var postId;
            if (announcement) {
                postId = announcement.author;
            } else {
                postId = 'nothisone';
            }
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
                PostModel.getPostspre(author, page, search),
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
        })
        .catch(next);*/
});

module.exports = router;
