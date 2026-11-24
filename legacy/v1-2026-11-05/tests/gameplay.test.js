const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/gameplay');

test('three orders must be completed in the intended sequence', () => {
  let state = G.initial();
  assert.equal(G.currentOrder(state), 'porridge');
  assert.equal(G.complete(state, 'fryer', 1), state);
  state = G.complete(state, 'porridge', 0.9);
  state = G.complete(state, 'soymilk', 0.7);
  state = G.complete(state, 'fryer', 0.5);
  assert.equal(state.finished, true);
  assert.deepEqual(state.completed.map((item) => item.kind), G.ORDER_SEQUENCE);
  assert.equal(state.coins, 21);
});

test('quality functions reward the visible target zones', () => {
  assert.equal(G.grade(G.porridgeScore(1.25, 1)), 'perfect');
  assert.equal(G.grade(G.soymilkScore(0.78)), 'perfect');
  assert.equal(G.grade(G.fryerScore(1, 0.58)), 'perfect');
  assert.ok(G.soymilkScore(0.78) > G.soymilkScore(0.2));
  assert.ok(G.fryerScore(1, 0.58) > G.fryerScore(0.4, 0.05));
});

test('wrong station taps are recorded without changing the order', () => {
  const state = G.wrongSelection(G.initial());
  assert.equal(state.wrongSelections, 1);
  assert.equal(G.currentOrder(state), 'porridge');
});
