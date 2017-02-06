var express = require('express');
var router = express.Router();

router.use('/:name', function(req, res, next) {
    console.log('haha');
});
router.get('/:name', function(req, res) {
    res.render('users', {
		name: req.params.name	//看着应该是 Json格式
    });
});



module.exports = router;