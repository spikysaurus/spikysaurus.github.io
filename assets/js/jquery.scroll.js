$(function () {

// ページ上部へ戻る
  var pagetop = $('#pagetop');
// ボタンの初期位置
  var position = {bottom: '-80px',right: '30px'}
  pagetop.css(position);
  $(window).scroll(function () {
    if ($(window).scrollTop() >= 100) { // スクロールが100以上になったら表示
      pagetop.stop().animate({bottom: '15px'},300);
    } else { // 以下なら隠す
      pagetop.stop().animate({bottom: '-80px'},300);
    }
  });
  
// スムーススクロール
  $('a[href^=#]').click(function() {
    var speed = 500;
    var href = $(this).attr("href");
    var target = $(href == "#" || href == "" ? 'html' : href);
    var position = target.offset().top;
    $('body,html').animate({scrollTop:position}, speed, 'swing');
    return false;
  });

});