// 街头奇遇（参考燕云“奇遇”，D035）：营业中门口偶尔有人停下，点一下是 10 秒的小插曲，帮不帮都有后果。
// effect 在当日结算时生效：cash(分) rep burn aff{} flag{}
BSX.define('content/encounters', function () {
  var list = [
    { id: 'Q01', who: 'students', name: '迷路的孩子', text: '一个背书包的小孩站在门口抹眼泪：“我找不到学校了……”',
      choices: [{ id: 'help', label: '先给他一杯热豆浆，再打电话', effect: { cash: -400, rep: 0.75, burn: -1 }, result: '孩子他妈赶来，连声道谢，第二天带了一兜橘子。' }, { id: 'no', label: '指个方向就回去忙', effect: {}, result: '孩子抽抽搭搭地走了。' }] },
    { id: 'Q02', who: 'neighbor', name: '忘带钱的老人', text: '老太太翻遍口袋：“哎呀，钱包落家里了，这碗粥……”',
      choices: [{ id: 'free', label: '这碗算我的', effect: { cash: -500, rep: 0.75 }, result: '老太太第二天一早就来还钱，还多带了两个邻居。' }, { id: 'pay', label: '记账，下次再给', effect: { rep: 0.25 }, result: '账本上多了一行小字。' }] },
    { id: 'Q03', who: 'neighbor', name: '讨碗热汤的环卫工', text: '扫街的老师傅冻得直搓手，看着锅里的热气没好意思开口。',
      choices: [{ id: 'give', label: '盛一碗热汤给他', effect: { cash: -300, rep: 0.5, burn: -2 }, result: '他捧着碗说：“这条街，我以后扫得更干净。”' }, { id: 'no', label: '装作没看见', effect: { burn: 1 }, result: '他推着车走远了。' }] },
    { id: 'Q04', who: 'recycler', name: '收泔水的人', text: '一个陌生人压低声音：“老板，剩料卖给我，我出高价，别问去哪。”',
      choices: [{ id: 'sell', label: '卖给他', effect: { cash: 2000, burn: 8 }, result: '桶被拉上了一辆没牌照的三轮车。' }, { id: 'no', label: '不卖，交正规回收', effect: { rep: 0.25, burn: -2 }, result: '你把回收单夹进了台账。' }] },
    { id: 'Q05', who: 'helper', name: '躲雨的孕妇', text: '雨里一个孕妇护着肚子站在屋檐下，想要杯热水。',
      choices: [{ id: 'help', label: '请她进来坐，倒杯热水', effect: { rep: 0.75 }, result: '她丈夫后来在网上写了很长一段好评。' }, { id: 'no', label: '屋檐下也能躲', effect: {}, result: '雨一直下。' }] },
    { id: 'Q06', who: 'influencer', name: '要“剧本”的博主', text: '博主说：“老板，你假装和客人吵一架，我拍下来保证火。”',
      choices: [{ id: 'fake', label: '演一场，热度要紧', effect: { cash: 1500, rep: -0.5, burn: 5 }, result: '视频火了，评论区一半在骂。' }, { id: 'no', label: '我这儿只卖早饭', effect: { rep: 0.5 }, result: '博主悻悻地拍了碗豆浆走了。' }] },
    { id: 'Q07', who: 'students', name: '没钱买早饭的学生', text: '高中生攥着几个硬币，看了半天价牌，只敢点一根油条。',
      choices: [{ id: 'more', label: '多塞一个茶叶蛋', effect: { cash: -300, rep: 0.5, aff: { zheng: 0.5 } }, result: '他红着脸说：“考上了来还您。”' }, { id: 'no', label: '照单卖', effect: {}, result: '他把油条掰成两半，一半揣进兜里。' }] },
    { id: 'Q08', who: 'supplier', name: '贴牌的推销员', text: '推销员递来一卷贴纸：“贴上‘土鸡蛋’三个字，一个能多卖五毛。”',
      choices: [{ id: 'stick', label: '贴上', effect: { cash: 2500, burn: 10 }, result: '冷柜里的鸡蛋，一夜之间都成了土鸡蛋。' }, { id: 'no', label: '是什么就写什么', effect: { rep: 0.5, burn: -1 }, result: '你在价牌上写：普通鸡蛋，新鲜。' }] }
  ];
  var byId = {};
  list.forEach(function (q) { byId[q.id] = q; });
  return { list: list, byId: byId };
});
