const router = require('express').Router();
const jwt = require('jsonwebtoken');

let supabase;

const getSupabase = () => {
  if (!supabase) {
    supabase = require('../supabase');
  }
  return supabase;
};

const RECOMMENDATION_API_URL = process.env.RECOMMENDATION_API_URL || 'http://127.0.0.1:8000';

const getUserId = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      if (decoded.id) return String(decoded.id);
    } catch {
      // fall back to the query value or guest
    }
  }

  const queryUserId = req.query.userId || req.query.user_id;
  return queryUserId ? String(queryUserId) : 'guest';
};

const sortProductsByRecommendationOrder = (products = [], recommendationIds = []) => {
  const ranking = new Map(recommendationIds.filter(Boolean).map((id, index) => [String(id), index]));

  return [...products].sort((left, right) => {
    const leftId = String(left.id || left._id || '');
    const rightId = String(right.id || right._id || '');
    const leftRank = ranking.has(leftId) ? ranking.get(leftId) : Number.MAX_SAFE_INTEGER;
    const rightRank = ranking.has(rightId) ? ranking.get(rightId) : Number.MAX_SAFE_INTEGER;

    if (leftRank === rightRank) return 0;
    return leftRank - rightRank;
  });
};

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const topK = Math.max(1, Math.min(12, Number(req.query.topK || req.query.limit || 4) || 4));
    const currentProductId = req.query.currentProductId;

    let recommendationIds = [];
    try {
      const recResponse = await fetch(`${RECOMMENDATION_API_URL}/recommend/${encodeURIComponent(userId)}?top_k=${topK}`);
      if (recResponse.ok) {
        const data = await recResponse.json();
        recommendationIds = Array.isArray(data?.recommendations) ? data.recommendations : [];
      }
    } catch {
      recommendationIds = [];
    }

    const { data: recommendedProducts, error } = await getSupabase()
      .from('products')
      .select('*')
      .in('id', recommendationIds)
      .limit(topK);

    if (error) throw error;

    const orderedProducts = sortProductsByRecommendationOrder(recommendedProducts || [], recommendationIds)
      .filter((product) => String(product.id || product._id) !== String(currentProductId));

    if (orderedProducts.length >= topK) {
      return res.json(orderedProducts.slice(0, topK));
    }

    const { data: fallbackProducts, error: fallbackError } = await getSupabase()
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(topK * 2);

    if (fallbackError) throw fallbackError;

    const seenIds = new Set(orderedProducts.map((product) => String(product.id || product._id)));
    const extras = (fallbackProducts || [])
      .filter((product) => !seenIds.has(String(product.id || product._id)))
      .filter((product) => String(product.id || product._id) !== String(currentProductId))
      .slice(0, topK - orderedProducts.length);

    res.json([...orderedProducts, ...extras]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.sortProductsByRecommendationOrder = sortProductsByRecommendationOrder;
