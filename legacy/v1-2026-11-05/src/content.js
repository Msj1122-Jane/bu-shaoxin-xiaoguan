(function () {
  const config = {
    version: 'slice-0.1', days: 7, startCash: 300000, startRep: 50, fixedCost: 10000,
    oils: ['合规散装', '普通桶装', '风味好油'], materials: ['冷链冻品', '当日鲜货', '精选食材'], prices: ['街坊价', '日常价', '精品价'],
    priceFactors: [0.85, 1, 1.35], demandFactors: [1.5, 1, 0.65], oilCosts: [20, 35, 60], materialFactors: [0.8, 1, 1.35],
    dishes: [{id:'soy',name:'现磨豆浆',price:400,cost:130}, {id:'congee',name:'熬白粥',price:500,cost:150}, {id:'stick',name:'油条',price:400,cost:120}, {id:'noodle',name:'热汤小面',price:1000,cost:380}],
    events: [
      {id:'E21',day:1,title:'爷爷多点了一份',body:'赵爷爷带着孙子落座。“今天考完试，给他加根油条。”',choices:[{text:'这单我请',result:'爷爷笑着摆手，临走还是说了声谢谢。',cash:-800,grandpa:2},{text:'多送一根油条',result:'“这孩子，吃得香。”',cash:-200,grandpa:1},{text:'照常收钱，热乎端上',result:'“做生意不容易，该收收。”爷爷点点头。',grandpa:1}]},
      {id:'E05',day:2,title:'便宜货，没凭证',body:'陌生供应商送来一桶没有来源凭证的油，劝你明天试用。“先别问那么多，能省不少。”',choices:[{text:'拒绝，继续用有凭证的货',result:'老周把桶推回门外，留住了熟悉的味道。',nurse:1},{text:'先收下，核验后再决定',result:'货没有入锅。核验费了一些工夫。',cash:-1000},{text:'冒险用一次',result:'第二天的进货钱省了，老周心里却不踏实。',delayed:{after:1,cash:8000,burn:30,rep:-4}}]},
      {id:'E04',day:3,title:'例行检查',body:'检查人员进店，请你拿出进货记录。平价和精品都要把来路说清楚。',choices:[{text:'如实出示所有记录',result:'问题记在台账上，该补的材料逐项补齐。',audit:true},{text:'主动停业补全台账',result:'今晚加班整理，次日少接一些单。',delayed:{after:1,capacity:-15},burn:-15},{text:'隐瞒缺失的那一页',result:'嘴上说得轻巧，老周却不敢看对方的眼睛。',burn:20,rep:-3}]},
      {id:'E11',day:5,title:'雨声里的一摞订单',body:'天已经黑了，店外仍有人等打包。多做这一批，今晚就要晚些收摊。',choices:[{text:'留下，加做一批',result:'夜单另记一笔。小宋接过热粥，催你早点休息。',cash:9000,rep:-1,nurse:1},{text:'只接做得过来的',result:'十来份热粥装好，你没有答应更多。',cash:4000,rep:1},{text:'解释情况，准时收摊',result:'明早再来。街坊点点头，撑伞散去。'}]},
      {id:'E22',day:6,title:'深夜有人敲门',body:'年轻人站在门口问：“还招帮工吗？我会洗碗，也能帮忙出餐。”明天起，日薪三十元。',choices:[{text:'留下，明天一起开门',result:'多了一双手，明天的产能增加二十份。',helper:true},{text:'先请他吃碗面',result:'“谢谢老板。”他把空碗洗得干干净净。',cash:-500},{text:'记下电话，暂时不招',result:'你把电话号码夹在账本里。'}]}
    ]
  };
  if (typeof module !== 'undefined') module.exports = config; else globalThis.BSX_CONTENT = config;
})();
