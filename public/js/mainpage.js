$(document).ready(function() {
    $('.pic-show-box').css({
        'width': $(window).width(),
        'height': $(window).height()
    });

    $('.pic-show-box-filter').css({
        'width': $(window).width(),
        'height': $(window).height()
    });

    $('.pic-item').click(function(e) {
        console.log('show');
        $('.pic-show-box-filter').toggleClass('hide');
        $('.pic-show-box').toggleClass('hide');
        $('.header').toggleClass('hide');
        $('.img-show-detail').attr('src', $(e.target).attr('src'));
    });

    $('.pic-show-box-header').click(function() {
        console.log('hide');
        $('.pic-show-box').toggleClass('hide');
        $('.pic-show-box-filter').toggleClass('hide');
        $('.header').toggleClass('hide');
    });

    console.log('ready');
});