const test = require('node:test');
const assert = require('node:assert/strict');
const { getInventoryStatus, enrichProductsWithSellerNames } = require('../utils/productDisplay');

test('getInventoryStatus returns the expected labels for stock levels', () => {
  assert.deepEqual(getInventoryStatus(0), { label: 'Out of Stock', tone: 'out', icon: '❌' });
  assert.deepEqual(getInventoryStatus(2), { label: 'Only 2 left', tone: 'low', icon: '⚠️' });
  assert.deepEqual(getInventoryStatus(5), { label: 'In Stock', tone: 'in', icon: '✅' });
});

test('enrichProductsWithSellerNames attaches seller names from the users table', async () => {
  const supabase = {
    from(table) {
      if (table === 'users') {
        return {
          async select() {
            return {
              data: [{ id: 'seller-1', name: 'Style Lab' }],
              error: null,
            };
          },
          async in() {
            return {
              data: [{ id: 'seller-1', name: 'Style Lab' }],
              error: null,
            };
          },
        };
      }
      return {
        async select() {
          return { data: [], error: null };
        },
      };
    },
  };

  const result = await enrichProductsWithSellerNames([{ id: 'p1', seller_id: 'seller-1' }], supabase);

  assert.equal(result[0].seller_name, 'Style Lab');
});
