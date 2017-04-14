const NoticeModel = require('../models/ysuNotice');
const moment = require('moment');

module.exports = {
  updateNoticeByHtml: function updateNoticeByHtml() {
    NoticeModel.requestOne('http://notice.ysu.edu.cn/')
      .then(([$]) => {
        let href = $('a', '#lineu12_0').attr('href');
        const title = $('.list-txt-1', '#lineu12_0').text().trim();
        const patt = new RegExp('http://');
        if (!patt.test(href)) {
          href = `http://notice.ysu.edu.cn/${href}`;
        }
        return Promise.all([
          NoticeModel.requestOne(href),
          title,
        ]);
      })
      .then(([
        [, {
          'last-modified': time,
          etag,
        }], title,
      ]) => {
        if (!etag) {
          etag = moment().format();
        }
        time = moment(time).format('YYYY-MM-DD，H:mm:ss');
        if (!title) {
          title = '权限不足，无法访问';
        }
        const data = {
          firstETag: etag,
        };
        NoticeModel.updateNoticeByName('notice', data);
        NoticeModel.sendMeRes(`<p>发生错误，已自动更新数据库为最新记录：${time}发表的《${title}》。错误可能有：1.可能有通知被删除。2.可能短时间发表大量文章。3.连接超时。4.其他异常。</p>`);
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`<p>${err}</p>`);
      });
  },
};
