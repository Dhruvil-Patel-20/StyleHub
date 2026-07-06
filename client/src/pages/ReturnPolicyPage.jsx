export default function ReturnPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Return Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: January 2024</p>

      {[
        { title: '30-Day Returns', content: 'We accept returns within 30 days of delivery. Items must be unused, unwashed, and in their original packaging with all tags attached.' },
        { title: 'Non-Returnable Items', content: 'The following items cannot be returned: underwear, swimwear, pierced jewelry, and items marked as final sale.' },
        { title: 'How to Initiate a Return', content: 'Go to My Orders, select the order, and click "Request Return". Fill in the reason and submit. Our team will review and respond within 2 business days.' },
        { title: 'Refunds', content: 'Once we receive and inspect the returned item, your refund will be processed within 5–7 business days to your original payment method.' },
        { title: 'Exchanges', content: 'We do not offer direct exchanges. Please return the item and place a new order for the desired product.' },
        { title: 'Damaged or Wrong Items', content: 'If you received a damaged or incorrect item, contact us at support@stylehub.com within 48 hours of delivery with photos and we will resolve it immediately.' },
      ].map(s => (
        <div key={s.title} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{s.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{s.content}</p>
        </div>
      ))}
    </div>
  );
}
