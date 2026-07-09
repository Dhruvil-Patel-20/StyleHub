function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value = 0, currency = 'USD') {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function buildAppUrl(path = '') {
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function getDisplayName(name, email) {
  return name?.trim() || email?.split('@')[0] || 'Customer';
}

module.exports = {
  escapeHtml,
  formatCurrency,
  buildAppUrl,
  getDisplayName,
};
