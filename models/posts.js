const marked = require('marked');

const markdown = require('markdown').markdown;

const Post = require('../lib/mongo').Post;

const CommentModel = require('./comments');

// 给 post 添加留言数 commentsCount
Post.plugin('addCommentsCount', {
  afterFind(posts) {
    return Promise.all(posts.map(post => CommentModel.getCommentsCount(post._id)
      .then((commentsCount) => {
        post.commentsCount = commentsCount;
        return post;
      })));
  },
  afterFindOne(post) {
    if (post) {
      return CommentModel.getCommentsCount(post._id)
        .then((count) => {
          post.commentsCount = count;
          return post;
        });
    }
    return post;
  },
});

// 将 post 的 content 从 markdown 转换成 html
Post.plugin('contentToHtml', {
  afterFind(posts) {
    return posts.map((post) => {
      // post.content = marked(post.content);
      post.content = marked(post.content);
      return post;
    });
  },
  afterFindOne(post) {
    if (post) {
      // post.content = marked(post.content);
      post.content = marked(post.content);
    }
    return post;
  },
});

// ,
Post.plugin('pre', {
  afterFind(posts) {
    return posts.map((post) => {
      // post.content = marked(post.content);
      post.content = post.content.replace(/<\/?.+?>/g, ''); // 去除 HTML 标签
      post.content = post.content.replace(/[ ]/g, ''); // 去空格
      post.content = post.content.replace(/[\r\n]/g, ' '); // 回车变空格
      post.content = post.content.substring(0, 100); // 获取前100个字符
      return post;
    });
  },
  afterFindOne(post) {
    if (post) {
      // post.content = marked(post.content);
      post.content = post.content.replace(/<\/?.+?>/g, ''); // 去除 HTML 标签
      post.content = post.content.replace(/[ ]/g, ''); // 去空格
      post.content = post.content.replace(/[\r\n]/g, ' '); // 回车变空格
      post.content = post.content.substring(0, 100); // 获取前100个字符
    }
    return post;
  },
});

module.exports = {
  // 创建一篇文章
  create: function create(post) {
    return Post.create(post).exec();
  },

  // 通过文章 id 获取一篇html文章
  getPostById: function getPostById(postId) {
    return Post
      .findOne({
        _id: postId,
      })
      .populate({
        path: 'author',
        model: 'User',
      })
      .addCreatedAt()
      .addCommentsCount()
      .contentToHtml()
      .exec();
  },

  // 获取一部分搜索结果或用户文章摘要
  getPostsLimit: function getPostsLimit(author, page, search, top, published) {
    const query = {};
    if (author) {
      query.author = author;
    }
    if (top) {
      query.top = top;
    }
    if (published) {
      query.published = published;
    }
    if (search) {
      query.$or = [{
        tags: {
          $regex: String(search),
        },
      }, {
        title: {
          $regex: String(search),
        },
      }, {
        content: {
          $regex: String(search),
        },
      }];
    }
    return Post
      .find(query)
      .skip((page - 1) * 5)
      .limit(5)
      .populate({
        path: 'author',
        model: 'User',
      })
      .sort({
        _id: -1,
      })
      .addCreatedAt()
      .addCommentsCount()
      .contentToHtml()
      .pre()
      .exec();
  },

  // 获取全部搜索结果或用户文章摘要
  getPosts: function getPosts(author, search, top, published) {
    const query = {};
    if (author) {
      query.author = author;
    }
    if (top) {
      query.top = top;
    }
    if (published) {
      query.published = published;
    }
    if (search) {
      query.$or = [{
        tags: {
          $regex: String(search),
        },
      }, {
        title: {
          $regex: String(search),
        },
      }, {
        content: {
          $regex: String(search),
        },
      }];
    }
    return Post
      .find(query)
      .populate({
        path: 'author',
        model: 'User',
      })
      .sort({
        _id: -1,
      })
      .addCreatedAt()
      .addCommentsCount()
      .contentToHtml()
      .pre()
      .exec();
  },

  // 通过文章 id 给 pv 加 1
  incPv: function incPv(postId, wPv) {
    return Post
      .update({
        _id: postId,
      }, {
        $inc: {
          pv: parseInt(wPv),
        },
      })
      .exec();
  },

  // 通过文章 id 获取一篇原生markdown文章
  getRawPostById: function getRawPostById(postId) {
    return Post
      .findOne({
        _id: postId,
      })
      .populate({
        path: 'author',
        model: 'User',
      })
      .exec();
  },

  // 通过用户 id 和文章 id 更新一篇文章
  updatePostById: function updatePostById(postId, author, data) {
    return Post.update({
      author,
      _id: postId,
    }, {
      $set: data,
    }).exec();
  },

  // 通过用户 id 和文章 id 删除一篇文章
  delPostById: function delPostById(postId, author) {
    return Post.remove({
      author,
      _id: postId,
    })
      .exec()
      .then((res) => {
        // 文章删除后，再删除该文章下的所有留言
        if (res.result.ok && res.result.n > 0) {
          return CommentModel.delCommentsByPostId(postId);
        }
      });
  },

  // 管理员删除文章
  admindelPostById: function admindelPostById(postId) {
    return Post.remove({
      _id: postId,
    })
      .exec()
      .then((res) => {
        // 文章删除后，再删除该文章下的所有留言
        if (res.result.ok && res.result.n > 0) {
          return CommentModel.delCommentsByPostId(postId);
        }
      });
  },

  // 管理员置顶或取消置顶文章
  admintopPostById: function admintopPostById(postId, t) {
    return Post.update({
      _id: postId,
    }, {
      $set: {
        top: t,
      },
    }).exec();
  },

  // 通过用户 id 和文章 id 删除一篇文章
  delPostByAuthorId: function delPostByAuthorId(author) {
    return Post.remove({
      author,
    })
      .exec()
      .then((res) => {
        // 文章删除后，再删除该文章下的所有留言
        if (res.result.ok && res.result.n > 0) {
          return CommentModel.delCommentsByAuthorId(author);
        }
      });
  },
};
