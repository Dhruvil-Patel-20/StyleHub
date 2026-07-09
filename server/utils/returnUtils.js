function applyReturnRequest(items = [], { reason } = {}) {
  return (items || []).map((item) => {
    if (item.is_returnable !== true) {
      return item;
    }

    return {
      ...item,
      return_requested: true,
      return_status: 'requested',
      return_reason: reason || 'Customer requested a return',
      requested_at: new Date().toISOString(),
    };
  });
}

function applyRefundProcessing(items = [], { itemIndexes, refundAmount } = {}) {
  const selectedIndexes = Array.isArray(itemIndexes)
    ? itemIndexes.map((idx) => Number(idx)).filter((idx) => !Number.isNaN(idx))
    : null;

  return (items || []).map((item, index) => {
    const isEligible = item.return_requested === true ||
      item.return_status === 'requested' ||
      item.return_status === 'approved';
    if (!isEligible) return item;

    if (selectedIndexes && selectedIndexes.length && !selectedIndexes.includes(index)) {
      return item;
    }

    return {
      ...item,
      return_status: 'refunded',
      refund_processed: true,
      refund_amount: refundAmount ?? Number(item.price || 0) * Number(item.quantity || 1),
      refunded_at: new Date().toISOString(),
    };
  });
}

module.exports = { applyReturnRequest, applyRefundProcessing };
