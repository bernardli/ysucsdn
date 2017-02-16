var page =2;
$(document).ready(function(){
    $('#loadmore').on('click', function(e) {
        var url='/posts?page='+page;
        $.get(url, function(data) {
            $('.limit-post-content').append(data);
            page=parseInt(page)+1;
        });
    });
});

