//loadmore
$(document).ready(function() {
    var page = 2;
    $('#loadmore_posts').on('click', function(e) {
        if (getUrlParam('search') == null) {
            var url = window.location.pathname + '?page=' + page;
        } else {
            var search = getUrlParam('search');
            var url = window.location.pathname + '?page=' + page + '&search=' + search;
        }
        //alert(url);
        $.get(url, function(data) {
            //获取post个数
            var num_post=data.match(/body-article-item/g).length;
            //alert(num_post);
            //追加更新
            $('.limit-post-content').append(data);
            //改变“加载更多”
            if (data == 0||num_post!=5) {
                $('.text-load').text('----- 没有文章了/(ㄒoㄒ)/~~ -----');
                $('.item-load').attr('id', 'no_posts');
            }
            page = parseInt(page) + 1;
        });
    });
    $('#loadmore_user').on('click', function(e) {
        var url = window.location.pathname + window.location.search + '&page=' + page;
        $.get(url, function(data) {
            //获取post个数
            var num_post=data.match(/body-article-item/g).length;
            //追加更新
            $('.limit-post-content').append(data);
            //改变“加载更多”
            if (data == 0||num_post!=5) {
                $('.text-load').text('----- 人呐就是不知道 (っ*´Д`)っ 已经没有更多文章了 -----');
                $('.item-load').attr('id', 'no_user');
            }
            page = parseInt(page) + 1;
        });
    });
    $('#loadmore_comments').on('click', function(e) {
        var url = window.location.pathname + '?page=' + page;
        $.get(url, function(data) {
            //获取comment个数
            var num_comment=data.match(/comment comment-single/g).length;
            //追加更新
            $('.limit-comments').append(data);
            //改变“加载更多”
            if (data == 0||num_comment!=5) {
                $('.text-load').text('----- 更多的评论 (＠_＠;) 不存在的ヽ(*´Д｀*)ﾉ -----');
                $('.item-load').attr('id', 'no_comments');
            }
            page = parseInt(page) + 1;
        });
    });
});

//获取url参数
function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg); //匹配目标参数
    if (r != null) return unescape(r[2]);
    return null; //返回参数值
}

//back to top
$(function() {
    var e = $("#rocket-to-top"),
        t = $(document).scrollTop(),
        n,
        r,
        i = !0;
    $(window).scroll(function() {
            var t = $(document).scrollTop();
            t == 0 ? e.css("background-position") == "0px 0px" ? e.fadeOut("slow") : i && (i = !1, $(".level-2").css("opacity", 1), e.delay(100).animate({
                    marginTop: "-1000px"
                },
                "normal",
                function() {
                    e.css({
                            "margin-top": "-125px",
                            display: "none"
                        }),
                        i = !0
                })) : e.fadeIn("slow")
        }),
        e.hover(function() {
                $(".level-2").stop(!0).animate({
                    opacity: 1
                })
            },
            function() {
                $(".level-2").stop(!0).animate({
                    opacity: 0
                })
            }),
        $(".level-3").click(function() {
            function t() {
                var t = e.css("background-position");
                if (e.css("display") == "none" || i == 0) {
                    clearInterval(n),
                        e.css("background-position", "0px 0px");
                    return
                }
                switch (t) {
                    case "0px 0px":
                        e.css("background-position", "-298px 0px");
                        break;
                    case "-298px 0px":
                        e.css("background-position", "-447px 0px");
                        break;
                    case "-447px 0px":
                        e.css("background-position", "-596px 0px");
                        break;
                    case "-596px 0px":
                        e.css("background-position", "-745px 0px");
                        break;
                    case "-745px 0px":
                        e.css("background-position", "-298px 0px");
                }
            }
            if (!i) return;
            n = setInterval(t, 50),
                $("html,body").animate({ scrollTop: 0 }, "slow");
        });
});