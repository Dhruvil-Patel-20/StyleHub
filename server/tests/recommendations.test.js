const test = require('node:test');
const assert = require('node:assert/strict');
const { sortProductsByRecommendationOrder } = require('../routes/recommendations');

test('sortProductsByRecommendationOrder prioritizes recommended product ids', () => {
  const products = [
    { id: 'p1', name: 'Alpha' },
    { id: 'p2', name: 'Beta' },
    { id: 'p3', name: 'Gamma' },
  ];

  const result = sortProductsByRecommendationOrder(products, ['p3', 'p1']);

  assert.deepEqual(result.map((product) => product.id), ['p3', 'p1', 'p2']);
});
