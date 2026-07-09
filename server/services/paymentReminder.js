const supabase = require('../supabase');
const emailService = require('./email');

const DEFAULT_DELAY_MIN = Number(process.env.PAYMENT_REMINDER_DELAY_MIN || 30);
const RUN_INTERVAL_MIN = Number(process.env.PAYMENT_REMINDER_RUN_INTERVAL_MIN || 10);
const WINDOW_MIN = Number(process.env.PAYMENT_REMINDER_WINDOW_MIN || 15);
const TARGET_STATUSES = (process.env.PAYMENT_REMINDER_TARGET_STATUSES || 'pending')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isoMinutesAgo(min) {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

async function checkPendingPayments() {
  try {
    const upperISO = isoMinutesAgo(DEFAULT_DELAY_MIN);
    const lowerISO = isoMinutesAgo(DEFAULT_DELAY_MIN + WINDOW_MIN);

    let query = supabase.from('orders').select('*').eq('is_paid', false).gt('created_at', lowerISO).lt('created_at', upperISO);
    if (TARGET_STATUSES.length) {
      query = query.in('status', TARGET_STATUSES);
    } else {
      query = query.neq('status', 'cancelled');
    }
    const { data: orders, error } = await query;

    if (error) throw error;
    if (!orders || orders.length === 0) return;

    for (const order of orders) {
      try {
        const { data: userData } = await supabase.from('users').select('name, email').eq('id', order.user_id).single();
        if (!userData?.email) continue;

        await emailService.sendEmailTemplate({
          type: 'paymentPending',
          to: userData.email,
          data: {
            name: userData.name,
            email: userData.email,
            order,
            orderUrl: `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/orders/${order.id}`,
          },
        });
        // mark order as reminded to avoid duplicates (best-effort: ignore if DB doesn't have these columns)
        try {
          const { error: uErr } = await supabase
            .from('orders')
            .update({
              payment_reminder_sent: true,
              last_reminder_at: new Date().toISOString(),
              reminder_count: (order.reminder_count || 0) + 1,
            })
            .eq('id', order.id);
          if (uErr) console.warn('Failed to mark reminder sent for order', order.id, uErr.message);
        } catch (ue) {
          console.warn('Failed to update reminder metadata for order', order.id, ue.message);
        }
      } catch (e) {
        console.warn('Failed to send payment reminder for order', order.id, e.message);
      }
    }
  } catch (err) {
    console.warn('Payment reminder check failed:', err.message);
  }
}

function startPaymentReminder() {
  // run immediately, then on interval
  checkPendingPayments();
  setInterval(checkPendingPayments, RUN_INTERVAL_MIN * 60 * 1000);
}

module.exports = { startPaymentReminder, checkPendingPayments };
