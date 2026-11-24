// 屏幕索引
BSX.define('ui/screens', function (require) {
  var B = require('ui/s_basic');
  return {
    Loading: B.Loading, Title: B.Title, Pause: B.Pause, Settings: B.Settings, Log: B.Log, NewMonth: B.NewMonth, WeekPick: B.WeekPick,
    Prep: require('ui/s_prep').Prep, Service: require('ui/s_service').Service, Story: require('ui/s_story').Story,
    Ledger: require('ui/s_ledger').Ledger, Ending: require('ui/s_ending').Ending, WeekResult: require('ui/s_ending').WeekResult,
    Codex: require('ui/s_codex').Codex
  };
});
