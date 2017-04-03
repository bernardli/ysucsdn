module.exports = function (app) {
  app.get('/', (req, res) => {
    res.redirect('/mainpage');
  });
  app.use('/mainpage', require('./mainpage'));
  app.use('/signup', require('./signup'));
  app.use('/signin', require('./signin'));
  app.use('/signout', require('./signout'));
  app.use('/posts', require('./posts'));
  app.use('/manage', require('./manage'));
  app.use('/setting', require('./setting'));
  app.use('/messages', require('./messages'));
    // 404 page
  app.use((req, res) => {
    if (!res.headersSent) {
      res.render('404');
    }
  });
};
