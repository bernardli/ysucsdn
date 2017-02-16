$(document).ready(function(){
    var page =2;
    $('#loadmore_posts').on('click', function(e) {
        var url='/posts?page='+page;
        $.get(url, function(data) {
            $('.limit-post-content').append(data);
            page=parseInt(page)+1;
        });
    });
    $('#loadmore_user').on('click', function(e) {
        var author=getUrlParam('author');
        var url='/posts/user?page='+page+'&author='+author;
        $.get(url, function(data) {
            $('.limit-post-content').append(data);
            page=parseInt(page)+1;
        });
    });
});

function getUrlParam(name) {
      var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
      var r = window.location.search.substr(1).match(reg); //匹配目标参数
      if (r != null) return unescape(r[2]); return null; //返回参数值
    }

