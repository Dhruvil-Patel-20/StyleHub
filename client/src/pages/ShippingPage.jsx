export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Shipping & Delivery</h1>
      <p className="text-gray-500 mb-8">Last updated: January 2024</p>

      {[
        { title: 'Processing Time', content: 'All orders are processed within 1–2 business days. Orders placed on weekends or public holidays will be processed the next business day.' },
        { title: 'Standard Shipping', content: 'Standard shipping takes 5–7 business days. Orders over $50 qualify for free standard shipping. Orders under $50 are charged a flat rate of $5.99.' },
        { title: 'Express Shipping', content: 'Express shipping (2–3 business days) is available at checkout for $12.99 on all orders regardless of order value.' },
        { title: 'International Shipping', content: 'We currently ship to the US, Canada, UK, and Australia. International orders may take 10–15 business days and may be subject to customs duties.' },
        { title: 'Order Tracking', content: 'Once your order is shipped, you will receive a confirmation email with a tracking number. You can also track your order from the My Orders page in your account.' },
        { title: 'Delays', content: 'StyleHub is not responsible for delays caused by customs, weather, or carrier issues. We will always do our best to keep you informed.' },
      ].map(s => (
        <div key={s.title} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{s.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{s.content}</p>
        </div>
      ))}
    </div>
  );
}
