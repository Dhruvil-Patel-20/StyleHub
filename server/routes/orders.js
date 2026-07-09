const router = require('express').Router();
const supabase = require('../supabase');
const { protect, admin } = require('../middleware/auth');
const emailService = require('../services/email');
const { applyReturnRequest, applyRefundProcessing } = require('../utils/returnUtils');
const { createInvoiceFile } = require('../utils/invoice');

const DELIVERY_OPTIONS = [
  { id: 'standard', price: 0, freeOver: 50 },
  { id: 'express', price: 9.99, freeOver: null },
  { id: 'nextday', price: 19.99, freeOver: null },
];

const calculateDeliveryCost = (subtotal, deliveryMethod) => {
  const option = DELIVERY_OPTIONS.find(opt => opt.id === deliveryMethod) || DELIVERY_OPTIONS[0];
  return option.freeOver !== null && subtotal >= option.freeOver ? 0 : option.price;
};

const computeCouponDiscount = (coupon, subtotal, deliveryCost) => {
  if (coupon.type === 'percent') return Math.round((Number(subtotal || 0) * Number(coupon.value || 0)) / 100 * 100) / 100;
  if (coupon.type === 'fixed') return Math.min(Number(coupon.value || 0), Number(subtotal || 0));
  if (coupon.type === 'free_shipping') return Number(deliveryCost || 0);
  return 0;
};

const validateOrderCoupon = async (couponCode, userId, subtotal, deliveryCost) => {
  const now = new Date().toISOString();
  const { data: coupon, error } = await supabase.from('coupons').select('*').eq('code', couponCode).single();
  if (error || !coupon) return { valid: false, message: 'Invalid coupon code' };
  if (!coupon.is_active) return { valid: false, message: 'Coupon is inactive' };
  if (coupon.start_date && now < coupon.start_date) return { valid: false, message: 'Coupon not started yet' };
  if (coupon.end_date && now > coupon.end_date) return { valid: false, message: 'Coupon expired' };
  if (coupon.min_order_value && subtotal < Number(coupon.min_order_value)) return { valid: false, message: `Minimum order value $${coupon.min_order_value} required` };
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return { valid: false, message: 'Coupon usage limit reached' };

  if (coupon.first_order_only && !userId) {
    return { valid: false, message: 'Authentication required for this coupon' };
  }
  if (coupon.first_order_only && userId) {
    const { data: orders, error: oErr } = await supabase.from('orders').select('id').eq('user_id', userId).limit(1);
    if (oErr) return { valid: false, message: 'Coupon check failed' };
    if (orders?.length) return { valid: false, message: 'Coupon valid only on first order' };
  }

  if (coupon.one_per_user && !userId) {
    return { valid: false, message: 'Authentication required for this coupon' };
  }
  if (coupon.one_per_user && userId) {
    const { data: usages, error: uErr } = await supabase.from('coupon_usages').select('id').eq('coupon_id', coupon.id).eq('user_id', userId).limit(1);
    if (uErr) return { valid: false, message: 'Coupon check failed' };
    if (usages?.length) return { valid: false, message: 'Coupon may only be used once per user' };
  }

  if (coupon.max_per_user && userId) {
    const { data: usages, error: uErr } = await supabase.from('coupon_usages').select('id').eq('coupon_id', coupon.id).eq('user_id', userId);
    if (uErr) return { valid: false, message: 'Coupon check failed' };
    if (usages.length >= coupon.max_per_user) return { valid: false, message: `Coupon may only be used ${coupon.max_per_user} times per user` };
  }

  const discount = computeCouponDiscount(coupon, subtotal, deliveryCost);
  return { valid: true, discount, coupon };
};

router.post('/', protect, async (req, res) => {
  try {
    const items = req.body.items || [];
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const couponCode = req.body.couponCode?.toString().trim().toUpperCase() || null;
    const deliveryMethod = req.body.deliveryMethod || 'standard';
    const deliveryCost = calculateDeliveryCost(subtotal, deliveryMethod);

    let discountAmount = 0;
    let validatedCoupon = null;
    if (couponCode) {
      const validation = await validateOrderCoupon(couponCode, req.user.id, subtotal, deliveryCost);
      if (!validation.valid) return res.status(400).json({ message: validation.message });
      discountAmount = validation.discount;
      validatedCoupon = validation.coupon;
    }

    let { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        items: req.body.items,
        shipping_address: req.body.shippingAddress,
        payment_method: req.body.paymentMethod || 'stripe',
        delivery_method: deliveryMethod,
        total_price: Number(req.body.totalPrice),
        coupon_code: couponCode,
        discount_amount: discountAmount,
      })
      .select()
      .single();
    if (error) throw error;

    if (validatedCoupon) {
      try {
        await supabase.from('coupon_usages').insert([{ coupon_id: validatedCoupon.id, user_id: req.user.id, order_id: data.id, used_amount: discountAmount }]);
        await supabase.from('coupons').update({ used_count: (validatedCoupon.used_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', validatedCoupon.id);
      } catch (e) {
        console.warn('Failed to record coupon usage:', e.message);
      }
    }

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', req.user.id).single();
    if (userData?.email) {
      await emailService.sendEmailTemplate({
        type: 'orderConfirmation',
        to: userData.email,
        data: {
          name: userData.name,
          email: userData.email,
          order: data,
          orderUrl: `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/orders/${data.id}`,
        },
      });
      // generate and attach invoice (best-effort)
      try {
        const { invoiceUrl, invoiceData } = await createInvoiceFile(data, userData);
        const { data: updatedOrder, error: invoiceErr } = await supabase.from('orders').update({ invoice_url: invoiceUrl, invoice_number: invoiceData.invoiceNumber, invoice_data: invoiceData }).eq('id', data.id).select().single();
        if (!invoiceErr && updatedOrder) {
          data = updatedOrder;
        }
        // email invoice link
        await emailService.sendMail({ to: userData.email, subject: 'Your invoice - StyleHub', html: `<p>Hi ${userData.name},</p><p>Your order has been received. You can download your invoice <a href="${invoiceUrl}">here</a>.</p>` });
      } catch (e) {
        console.warn('Invoice generation failed at order creation:', e.message || e);
      }
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/myorders', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: get orders containing seller's products — MUST be before /:id
router.get('/sellerorders', protect, async (req, res) => {
  try {
    const { data: sellerProducts, error: pErr } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', req.user.id);
    if (pErr) throw pErr;

    const sellerProductIds = (sellerProducts || []).map(p => p.id);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const filtered = sellerProductIds.length
      ? orders.filter(o => o.items?.some(item => sellerProductIds.includes(item.productId)))
      : [];
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all orders — MUST be before /:id
router.get('/all', protect, admin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/return-requests', protect, admin, async (req, res) => {
  try {
    const { data: orders, error } = await supabase.from('orders').select('*, users(name, email)');
    if (error) throw error;

    const returnRequests = (orders || [])
      .map((order) => {
        const requests = (order.items || []).map((item, index) => ({
          ...item,
          itemIndex: index,
        })).filter((item) => 
          item.return_status !== 'refunded' &&
          (item.return_requested === true || ['requested', 'approved', 'rejected'].includes(item.return_status))
        );

        return requests.length ? { ...order, return_requests: requests } : null;
      })
      .filter(Boolean);

    res.json(returnRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Order not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer or admin: generate invoice for an order (best-effort)
router.post('/:id/invoice', protect, async (req, res) => {
  try {
    const { data: order, error: oErr } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });
    if (order.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', order.user_id).single();
    const { invoiceUrl, invoiceData } = await createInvoiceFile(order, userData || {});

    const { data, error } = await supabase.from('orders').update({ invoice_url: invoiceUrl, invoice_number: invoiceData.invoiceNumber, invoice_data: invoiceData }).eq('id', req.params.id).select().single();
    if (error) throw error;

    try {
      if (userData?.email) {
        await emailService.sendMail({ to: userData.email, subject: 'Your invoice - StyleHub', html: `<p>Hi ${userData.name || ''},</p><p>Your invoice is available <a href="${invoiceUrl}">here</a>.</p>` });
      }
    } catch (e) {
      console.warn('Failed to email invoice after generation:', e.message || e);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/return/:itemIndex/approve', protect, admin, async (req, res) => {
  try {
    const { data: order, error: oErr } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });

    const idx = Number(req.params.itemIndex);
    const updatedItems = (order.items || []).map((item, index) => {
      if (index !== idx || (item.return_requested !== true && item.return_status !== 'requested')) return item;
      return {
        ...item,
        return_requested: true,
        return_status: 'approved',
        return_approved_at: new Date().toISOString(),
        return_admin_note: req.body.note || item.return_admin_note || null,
      };
    });

    const hasUpdated = updatedItems.some((item, index) => index === idx && item.return_status === 'approved');
    if (!hasUpdated) return res.status(400).json({ message: 'No pending return request found for this item' });

    const { data, error } = await supabase.from('orders').update({ items: updatedItems, return_status: 'approved', return_requested_at: order.return_requested_at || new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', data.user_id).single();
    if (userData?.email) {
      await emailService.sendEmailTemplate({
        type: 'orderDelivered',
        to: userData.email,
        data: { name: userData.name, email: userData.email, order: data },
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/return/:itemIndex/reject', protect, admin, async (req, res) => {
  try {
    const { data: order, error: oErr } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });

    const idx = Number(req.params.itemIndex);
    const updatedItems = (order.items || []).map((item, index) => {
      if (index !== idx || (item.return_requested !== true && item.return_status !== 'requested')) return item;
      return {
        ...item,
        return_requested: true,
        return_status: 'rejected',
        return_rejected_at: new Date().toISOString(),
        return_admin_note: req.body.note || item.return_admin_note || null,
      };
    });

    const hasUpdated = updatedItems.some((item, index) => index === idx && item.return_status === 'rejected');
    if (!hasUpdated) return res.status(400).json({ message: 'No pending return request found for this item' });

    const { data, error } = await supabase.from('orders').update({ items: updatedItems, return_status: 'rejected', return_requested_at: order.return_requested_at || new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', data.user_id).single();
    if (userData?.email) {
      await emailService.sendEmailTemplate({
        type: 'orderCancelled',
        to: userData.email,
        data: { name: userData.name, email: userData.email, order: data },
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/return/approve-all', protect, admin, async (req, res) => {
  try {
    const { data: order, error: oErr } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });

    const updatedItems = (order.items || []).map((item) => {
      if (item.return_requested !== true && item.return_status !== 'requested') return item;
      return {
        ...item,
        return_requested: true,
        return_status: 'approved',
        return_approved_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase.from('orders').update({ items: updatedItems, return_status: 'approved', return_requested_at: order.return_requested_at || new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', data.user_id).single();
    if (userData?.email) {
      await emailService.sendEmailTemplate({
        type: 'orderDelivered',
        to: userData.email,
        data: { name: userData.name, email: userData.email, order: data },
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/return/reject-all', protect, admin, async (req, res) => {
  try {
    const { data: order, error: oErr } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });

    const updatedItems = (order.items || []).map((item) => {
      if (item.return_requested !== true && item.return_status !== 'requested') return item;
      return {
        ...item,
        return_requested: true,
        return_status: 'rejected',
        return_rejected_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase.from('orders').update({ items: updatedItems, return_status: 'rejected', return_requested_at: order.return_requested_at || new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', data.user_id).single();
    if (userData?.email) {
      await emailService.sendEmailTemplate({
        type: 'orderCancelled',
        to: userData.email,
        data: { name: userData.name, email: userData.email, order: data },
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/return', protect, async (req, res) => {
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.user_id) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized to request returns for this order' });
    if (order.status !== 'delivered') return res.status(400).json({ message: 'Returns can only be requested for delivered orders' });

    const selectedIndexes = Array.isArray(req.body.itemIndexes) ? req.body.itemIndexes : null;
    let updatedItems = order.items || [];

    if (selectedIndexes && selectedIndexes.length) {
      updatedItems = updatedItems.map((item, index) => {
        if (!selectedIndexes.includes(index) || item.is_returnable === false) return item;
        return {
          ...item,
          return_requested: true,
          return_status: 'requested',
          return_reason: req.body.reason || 'Customer requested a return',
          requested_at: new Date().toISOString(),
        };
      });
    } else {
      updatedItems = applyReturnRequest(order.items || [], { reason: req.body.reason });
    }

    const hasChanges = updatedItems.some((item, index) => {
      const previousItem = order.items?.[index] || {};
      return item.return_requested === true && previousItem.return_requested !== true;
    });

    if (!hasChanges) return res.status(400).json({ message: 'No eligible items selected for return' });

    const { data, error } = await supabase
      .from('orders')
      .update({ items: updatedItems, return_status: 'requested', return_requested_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/return/refund', protect, admin, async (req, res) => {
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });

    const updatedItems = applyRefundProcessing(order.items || [], { itemIndexes: req.body.itemIndexes, refundAmount: req.body.refundAmount });
    const refundedItems = updatedItems.filter((item, index) => {
      const original = order.items?.[index] || {};
      return item.return_status === 'refunded' && original.return_status !== 'refunded';
    });
    const orderUpdates = {
      items: updatedItems,
      return_status: 'refunded',
      refund_processed_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(orderUpdates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    // Restore stock for each refunded item
    for (const item of refundedItems) {
      if (!item.productId) continue;
      try {
        const { data: product } = await supabase.from('products').select('stock').eq('id', item.productId).single();
        if (product) {
          await supabase.from('products').update({ stock: product.stock + Number(item.quantity || 1) }).eq('id', item.productId);
        }
      } catch (e) {
        console.warn(`Failed to restore stock for product ${item.productId}:`, e.message);
      }
    }

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', data.user_id).single();
    if (userData?.email) {
      await emailService.sendEmailTemplate({
        type: 'refundProcessed',
        to: userData.email,
        data: {
          name: userData.name,
          email: userData.email,
          refundAmount: req.body.refundAmount,
          orderId: data.id,
          order: data,
        },
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/pay', protect, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('orders')
      .update({ is_paid: true, paid_at: new Date().toISOString(), payment_result: req.body, status: 'processing' })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', data.user_id).single();
    if (userData?.email) {
      await emailService.sendEmailTemplate({
        type: 'paymentReceipt',
        to: userData.email,
        data: {
          name: userData.name,
          email: userData.email,
          order: data,
          orderUrl: `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/orders/${data.id}`,
        },
      });
      // generate and attach invoice (if not present)
      try {
        if (!data.invoice_url) {
          const { invoiceUrl, invoiceData } = await createInvoiceFile(data, userData);
          const { data: updatedOrder, error: invoiceErr } = await supabase.from('orders').update({ invoice_url: invoiceUrl, invoice_number: invoiceData.invoiceNumber, invoice_data: invoiceData }).eq('id', data.id).select().single();
          if (!invoiceErr && updatedOrder) {
            data = updatedOrder;
          }
          await emailService.sendMail({ to: userData.email, subject: 'Your invoice - StyleHub', html: `<p>Hi ${userData.name},</p><p>Your payment was received. You can download your invoice <a href="${invoiceUrl}">here</a>.</p>` });
        }
      } catch (e) {
        console.warn('Invoice generation failed at payment:', e.message || e);
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update order status
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    console.log(`\n🔵 [ORDER STATUS UPDATE] Received request:`, {
      orderId: req.params.id,
      newStatus: req.body.status,
      adminId: req.user?.id,
      adminRole: req.user?.role,
      timestamp: new Date().toISOString(),
    });

    const updates = { status: req.body.status };
    let paidNow = false;
    if (req.body.status === 'delivered') {
      updates.is_delivered = true;
      updates.delivered_at = new Date().toISOString();

      // If this order was Cash On Delivery and not marked paid, mark it paid now
      try {
        const { data: existingOrder, error: existErr } = await supabase
          .from('orders')
          .select('payment_method, is_paid')
          .eq('id', req.params.id)
          .single();
        if (!existErr && existingOrder) {
          const pm = (existingOrder.payment_method || '').toString().toLowerCase();
          if ((pm === 'cod' || pm.includes('cod') || pm.includes('cash')) && existingOrder.is_paid !== true) {
            updates.is_paid = true;
            updates.paid_at = new Date().toISOString();
            paidNow = true;
            console.log(`🔔 [ORDER STATUS] Marking COD order paid on delivery for order ${req.params.id}`);
          }
        }
      } catch (e) {
        console.warn('Failed to check existing order payment method for COD auto-pay:', e.message || e);
      }
    }

    console.log(`📦 [ORDER STATUS UPDATE] Updating order in database:`, updates);
    const { data, error } = await supabase.from('orders').update(updates).eq('id', req.params.id).select().single();
    
    if (error) {
      console.error(`❌ [ORDER STATUS UPDATE] Database error:`, error);
      throw error;
    }
    console.log(`✅ [ORDER STATUS UPDATE] Order updated in DB:`, { orderId: data.id, status: data.status });

    // Get user data for email
    const { data: userData, error: userError } = await supabase.from('users').select('name, email').eq('id', data.user_id).single();
    
    if (userError) {
      console.error(`⚠️ [ORDER STATUS UPDATE] Failed to fetch user data:`, userError);
    }
    
    if (!userData?.email) {
      console.warn(`⚠️ [ORDER STATUS UPDATE] User has no email - skipping email: userId=${data.user_id}`);
    } else {
      console.log(`📧 [ORDER STATUS UPDATE] Sending email to ${userData.email}...`);

      if (req.body.status === 'shipped') {
        console.log(`📧 [SHIPPED EMAIL] Building and sending shipped email...`);
        await emailService.sendEmailTemplate({
          type: 'orderShipped',
          to: userData.email,
          data: { 
            name: userData.name, 
            email: userData.email, 
            order: data, 
            trackingUrl: `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/orders/${data.id}` 
          },
        });
        console.log(`✉️ [SHIPPED EMAIL] Sent successfully!`);
      }

      if (req.body.status === 'delivered') {
        console.log(`📧 [DELIVERED EMAIL] Building and sending delivered email...`);
        await emailService.sendEmailTemplate({
          type: 'orderDelivered',
          to: userData.email,
          data: { name: userData.name, email: userData.email, order: data },
        });
        console.log(`✉️ [DELIVERED EMAIL] Sent successfully!`);
      }

      // If we marked the order as paid because it was COD delivered, send a payment receipt
      if (paidNow) {
        try {
          console.log(`📧 [PAYMENT RECEIPT] Sending payment receipt for order ${data.id}`);
          await emailService.sendEmailTemplate({
            type: 'paymentReceipt',
            to: userData.email,
            data: { name: userData.name, email: userData.email, order: data },
          });
          console.log('✉️ [PAYMENT RECEIPT] Sent successfully!');
        } catch (e) {
          console.warn('Failed to send payment receipt after COD auto-pay:', e.message || e);
        }
      }

      if (req.body.status === 'cancelled') {
        console.log(`📧 [CANCELLED EMAIL] Building and sending cancelled email...`);
        await emailService.sendEmailTemplate({
          type: 'orderCancelled',
          to: userData.email,
          data: { name: userData.name, email: userData.email, order: data },
        });
        console.log(`✉️ [CANCELLED EMAIL] Sent successfully!`);
      }
    }

    console.log(`🎉 [ORDER STATUS UPDATE] Complete\n`);
    res.json(data);
  } catch (err) {
    console.error(`❌ [ORDER STATUS UPDATE] ERROR:`, {
      message: err.message,
      stack: err.stack,
      orderId: req.params.id,
      status: req.body.status,
    });
    res.status(500).json({ message: err.message });
  }
});

// Admin: trigger a specific email for an order (debug/test)
router.post('/:id/send-email', protect, admin, async (req, res) => {
  try {
    const type = req.query.type || req.body.type;
    if (!type || !['shipped', 'delivered', 'cancelled', 'paymentReceipt', 'orderConfirmation', 'refundProcessed'].includes(type)) {
      return res.status(400).json({ message: 'Invalid or missing email type' });
    }

    const { data: order, error: oErr } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', order.user_id).single();
    if (!userData?.email) return res.status(400).json({ message: 'Order user has no email' });

    if (type === 'shipped') {
      await emailService.sendEmailTemplate({ type: 'orderShipped', to: userData.email, data: { name: userData.name, email: userData.email, order, trackingUrl: req.body.trackingUrl || `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/orders/${order.id}` } });
    } else if (type === 'delivered') {
      await emailService.sendEmailTemplate({ type: 'orderDelivered', to: userData.email, data: { name: userData.name, email: userData.email, order } });
    } else if (type === 'cancelled') {
      await emailService.sendEmailTemplate({ type: 'orderCancelled', to: userData.email, data: { name: userData.name, email: userData.email, order } });
    } else if (type === 'paymentReceipt') {
      await emailService.sendEmailTemplate({ type: 'paymentReceipt', to: userData.email, data: { name: userData.name, email: userData.email, order } });
    } else if (type === 'orderConfirmation') {
      await emailService.sendEmailTemplate({ type: 'orderConfirmation', to: userData.email, data: { name: userData.name, email: userData.email, order, orderUrl: `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/orders/${order.id}` } });
    } else if (type === 'refundProcessed') {
      await emailService.sendEmailTemplate({ type: 'refundProcessed', to: userData.email, data: { name: userData.name, email: userData.email, refundAmount: req.body.refundAmount, orderId: order.id } });
    }

    res.json({ message: 'Email triggered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/fix-cod-paid', protect, admin, async (req, res) => {
  try {
    // Find delivered orders that are not marked paid
    const { data: candidates, error: cErr } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'delivered')
      .eq('is_paid', false);
    if (cErr) throw cErr;

    const codOrders = (candidates || []).filter(o => {
      const pm = (o.payment_method || '').toLowerCase();
      return pm === 'cod' || pm.includes('cash');
    });

    if (!codOrders.length) return res.json({ message: 'No delivered COD orders found that are unpaid', updated: 0 });

    const ids = codOrders.map(o => o.id);
    const { data: updated, error: uErr } = await supabase
      .from('orders')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .in('id', ids)
      .select();
    if (uErr) throw uErr;

    // Send payment receipt email for each updated order
    for (const ord of updated || []) {
      try {
        const { data: userData } = await supabase.from('users').select('name, email').eq('id', ord.user_id).single();
        if (userData?.email) {
          await emailService.sendEmailTemplate({
            type: 'paymentReceipt',
            to: userData.email,
            data: { name: userData.name, email: userData.email, order: ord },
          });
          // generate invoice if missing
          try {
            if (!ord.invoice_url) {
              const { invoiceUrl, invoiceData } = await createInvoiceFile(ord, userData);
              await supabase.from('orders').update({ invoice_url: invoiceUrl, invoice_number: invoiceData.invoiceNumber, invoice_data: invoiceData }).eq('id', ord.id);
              await emailService.sendMail({ to: userData.email, subject: 'Your invoice - StyleHub', html: `<p>Hi ${userData.name},</p><p>Your invoice is available <a href="${invoiceUrl}">here</a>.</p>` });
            }
          } catch (e) {
            console.warn('Invoice generation failed while fixing COD orders:', e.message || e);
          }
        }
      } catch (e) {
        console.warn('Failed to send payment receipt for order', ord.id, e.message || e);
      }
    }

    res.json({ message: 'Updated delivered COD orders to paid', updated: updated.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer: cancel own order (if not already shipped/delivered)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (oErr || !order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.user_id) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized to cancel this order' });
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel an order that has been shipped or delivered' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    const { data: userData } = await supabase.from('users').select('name, email').eq('id', data.user_id).single();
    if (userData?.email) {
      await emailService.sendEmailTemplate({
        type: 'orderCancelled',
        to: userData.email,
        data: { name: userData.name, email: userData.email, order: data },
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
