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
        // 校验参数
        if (!time) {
          time = moment().format('YYYY-MM-DD，H:mm:ss');
        } else {
          time = moment(time).format('YYYY-MM-DD，H:mm:ss');
        }
        if (!title) {
          title = '获取标题出错';
        }
        if (!etag) {
          etag = title;
        } else if (etag === '"652-4b6b48ffe0340"' || etag === '"18c8-508d2d594b3c0"') {
          etag = title;
          title += '（这篇通知需要权限）';
          time = moment().format('YYYY-MM-DD，H:mm:ss');
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
