// 屏幕索引
BSX.define('ui/screens', function (require) {
  var B = require('ui/s_basic'), P = require('ui/s_play');
  return { Loading: B.Loading, Title: B.Title, Pause: B.Pause, Scene: P.Scene, Shift: P.Shift, Prep: require('ui/s_prep').Prep, Night: require('ui/s_night').Night, Ending: require('ui/s_ending').Ending, Book: require('ui/s_book').Book, Town: require('ui/s_town').Town };
});
