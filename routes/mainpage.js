var express = require('express');
var router = express.Router();

//获取解析后的主页页面
router.get('/', function(req, res, next) {
    res.render('mainpage');
});

module.exports = router;