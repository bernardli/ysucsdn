$(document).ready(function() {
    setTimeout(function() {
        $('.notice').hide(2000, function() {
            this.css('display', 'none');
        });
    }, 3000);
});