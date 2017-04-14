module.exports = {
  checkLogin: function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录');
      return res.redirect('/signin');
    }
    next();
  },

  checkNotLogin: function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', '已登录');
      return res.redirect('back'); // 返回之前的页面
    }
    next();
  },

  checkAdmin: function checkAdmin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录');
      return res.redirect('back');
    } else if (req.session.user.identity.toString() !== 'admin') {
      req.flash('error', '请使用管理员账户登录');
      return res.redirect('back');
    }
    next();
  },
};
