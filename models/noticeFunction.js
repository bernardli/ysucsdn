const NoticeModel = require('../models/ysuNotice');
const moment = require('moment');

module.exports = {
  updateNoticeByHtml: function updateNoticeByHtml() {
    NoticeModel.requestOne('http://notice.ysu.edu.cn/')
      .then(([$]) => {
        let href = $('a', '#lineu12_0').attr('href');
        const title = $('.list-txt-1', '#lineu12_0').text().trim();
        const day = $('.list-date', '#lineu12_0').text().trim();
        const patt = new RegExp('http://');
        if (!patt.test(href)) {
          href = `http://notice.ysu.edu.cn/${href}`;
        }
        return Promise.all([
          NoticeModel.requestOne(href),
          title,
          day,
        ]);
      })
      .then(([
        [, {
          'last-modified': lastTime,
        }], title, day,
      ]) => {
        let time;
        // 校验参数
        if (!lastTime) {
          time = `${day}${moment().format('，H:mm:ss')}`;
        } else if (day !== moment(lastTime).format('YYYY-MM-DD')) {
          time = `${day}${moment().format('，H:mm:ss')}`;
        } else {
          time = moment(lastTime).format('YYYY-MM-DD，H:mm:ss');
        }
        if (!title) {
          title = '获取标题出错';
        }
        const data = {
          newTitle: title,
        };
        NoticeModel.updateNoticeByName('notice', data);
        NoticeModel.sendMeRes(`<p>发生错误，已自动更新数据库为最新记录：${time}发表的《${title}》。错误可能有：1.可能有通知被删除或被修改。2.可能短时间发表大量文章。3.连接超时。4.其他异常。</p>`);
      })
      .catch((err) => {
        NoticeModel.sendMeRes(`<p>${err}</p>`);
      });
  },
};
