const getInventoryStatus = (stock = 0) => {
  const numericStock = Number(stock) || 0;

  if (numericStock <= 0) {
    return { label: 'Out of Stock', tone: 'out', icon: '❌' };
  }

  if (numericStock <= 2) {
    return { label: 'Only 2 left', tone: 'low', icon: '⚠️' };
  }

  return { label: 'In Stock', tone: 'in', icon: '✅' };
};

const enrichProductsWithSellerNames = async (products = [], supabase) => {
  if (!Array.isArray(products) || !products.length || !supabase) return products;

  const sellerIds = [...new Set(products.map((product) => product?.seller_id).filter(Boolean))];
  if (!sellerIds.length) return products;

  const { data: sellers, error } = await supabase.from('users').select('id, name').in('id', sellerIds);
  if (error) throw error;

  const sellerMap = new Map((sellers || []).map((seller) => [seller.id, seller.name]));

  return products.map((product) => ({
    ...product,
    seller_name: sellerMap.get(product.seller_id) || product.seller_name || 'Unknown seller',
  }));
};

module.exports = {
  getInventoryStatus,
  enrichProductsWithSellerNames,
};
