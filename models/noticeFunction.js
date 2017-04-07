const NoticeModel = require('../models/ysuNotice');
const moment = require('moment');

module.exports = {
  updateNoticeByHtml: function updateNoticeByHtml() {
    NoticeModel.oneHtml('http://notice.ysu.edu.cn/')
            .then(($) => {
              const href = $('li a').eq(0).attr('href');
              const patt = new RegExp('http://');
              if (patt.test(href)) {
                return NoticeModel.oneHeader(href);
              }
              return NoticeModel.oneHeader(`http://notice.ysu.edu.cn${href}`);
            })
            .then((header) => {
              const data = {
                firstETag: header.etag,
              };
              NoticeModel.updateNoticeByName('notice', data);
              NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//发生错误，已自动更新数据库为最新记录。错误可能有：1.可能有通知被删除。2.可能段时间发表大量文章。3.其他异常。`);
              console.log('发生错误，已自动更新数据库为最新记录。错误可能有：1.可能有通知被删除。2.可能段时间发表大量文章。3.其他异常。');
            })
            .catch((err) => {
              NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//${err}`);
            });
  },

  // 早晚报告情况
  stateNotice: function stateNotice() {
    const morningB = moment('7:00:00', 'H:mm:ss');
    const morningE = moment('7:10:00', 'H:mm:ss');
    const nightB = moment('22:00:00', 'H:mm:ss');
    const nightE = moment('22:10:00', 'H:mm:ss');
    const timeNow = moment(new Date(), 'H:mm:ss');
    if (timeNow > morningB && timeNow < morningE) {
      NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//大佬早上好哟，通知系统今天也是元气满满的呢`);
    } else if (timeNow > nightB && timeNow < nightE) {
      NoticeModel.sendMeRes(`${moment(new Date()).format('H:mm:ss')}//大佬晚安啦，通知系统晚上也是元气满满的呢`);
    }
  },
};
