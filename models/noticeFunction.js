const NoticeModel = require('../models/ysuNotice');

module.exports = {
  updateNoticeByHtml: function updateNoticeByHtml() {
    NoticeModel.requestOne('http://notice.ysu.edu.cn/')
      .then(([$]) => {
        const href = $('a', '#lineu12_0').attr('href');
        const patt = new RegExp('http://');
        if (patt.test(href)) {
          return NoticeModel.requestOne(href);
        }
        return NoticeModel.requestOne(`http://notice.ysu.edu.cn/${href}`);
      })
      .then(([$, header]) => {
        let title = $('h3', '.content-title').text().trim();
        if (!title) {
          title = '权限不足，无法访问';
        }
        const data = {
          firstETag: header.etag,
        };
        NoticeModel.updateNoticeByName('notice', data);
        NoticeModel.sendMeRes(`<p>发生错误，已自动更新数据库为最新记录《${title}》。错误可能有：1.可能有通知被删除。2.可能短时间发表大量文章。3.连接超时。4.其他异常。</p>`);
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`<p>${err}</p>`);
      });
  },
};
