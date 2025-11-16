$(function () { 

// アコーディオンメニュー
  $('nav > ul > li,nav > ul > li > a[href^=#]').on('click', function() {
    (window.innerWidth ? window.innerWidth : $(window).width()) <= 600 && (
    $(this).children('ul:not(:animated)').slideToggle(),
    $(this).children('span').toggleClass('open'),
    $('.sub-menu').not($(this).children('.sub-menu')).slideUp(),
    $('nav li').children('span').not($(this).children('span')).removeClass('open')
    )
  });
    $('.sub-menu li a[href^=#]').on('click', function(event) {
    event.stopPropagation();
  });
    
// 小画面時にメニュー内リンクを押した場合、一度閉じる
// ページ内リンク用
  $('nav a').on('click', function() {
    (window.innerWidth ? window.innerWidth : $(window).width()) <= 600 && $('#open').click()
  });
    
// 小画面時にメニューを閉じてからリサイズするとメニューが表示されないのを防ぐ
  $(window).resize(function() {
    var menu = $('#menu'),
        sub = $('.sub-menu'),
        w = window.innerWidth ? window.innerWidth : $(window).width();
    w > 600 && menu.is(':hidden') && menu.attr('style', ''),
    w > 600 && sub.is(':hidden') && sub.attr('style', '')
  });
    
// メニューを開くボタンの動作
  $('#open').click(function() {
    $('#menu').slideToggle(300);
    $('#open-icon').toggleClass('close');
    return false;
  });
    
});