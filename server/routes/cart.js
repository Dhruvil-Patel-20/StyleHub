const router = require('express').Router();
// Cart is managed client-side in localStorage.
// This route is a placeholder if server-side cart sync is needed in future.
router.get('/', (req, res) => res.json([]));
module.exports = router;
