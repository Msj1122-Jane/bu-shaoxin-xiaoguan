(function () {
  const ORDER_SEQUENCE = ['porridge', 'soymilk', 'fryer'];
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  function grade(score) {
    if (score >= 0.85) return 'perfect';
    if (score >= 0.55) return 'home';
    return 'rushed';
  }

  function porridgeScore(turns, steadiness = 1) {
    return clamp(clamp(turns / 1.25) * 0.7 + clamp(steadiness) * 0.3);
  }

  function soymilkScore(fill) {
    return clamp(1 - Math.abs(fill - 0.78) / 0.5);
  }

  function fryerScore(stretch, timing) {
    const timingScore = clamp(1 - Math.abs(timing - 0.58) / 0.58);
    return clamp(clamp(stretch) * 0.45 + timingScore * 0.55);
  }

  function initial() {
    return {
      orderIndex: 0,
      coins: 12,
      completed: [],
      wrongSelections: 0,
      finished: false,
    };
  }

  function currentOrder(state) {
    return ORDER_SEQUENCE[state.orderIndex] || null;
  }

  function complete(state, kind, score) {
    if (state.finished || currentOrder(state) !== kind) return state;
    const result = grade(score);
    const reward = result === 'perfect' ? 4 : result === 'home' ? 3 : 2;
    const next = {
      ...state,
      orderIndex: state.orderIndex + 1,
      coins: state.coins + reward,
      completed: state.completed.concat({ kind, score: clamp(score), grade: result, reward }),
    };
    next.finished = next.orderIndex >= ORDER_SEQUENCE.length;
    return next;
  }

  function wrongSelection(state) {
    return { ...state, wrongSelections: state.wrongSelections + 1 };
  }

  const api = {
    ORDER_SEQUENCE,
    clamp,
    grade,
    porridgeScore,
    soymilkScore,
    fryerScore,
    initial,
    currentOrder,
    complete,
    wrongSelection,
  };

  if (typeof module !== 'undefined') module.exports = api;
  else globalThis.BSX_GAMEPLAY = api;
})();
