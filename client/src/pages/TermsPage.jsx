export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Terms of Service</h1>
      <p className="text-gray-500 mb-8">Last updated: January 2024</p>

      {[
        { title: '1. Acceptance of Terms', content: 'By accessing or using StyleHub, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.' },
        { title: '2. Account Responsibility', content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.' },
        { title: '3. Use of the Platform', content: 'You agree to use StyleHub only for lawful purposes. You must not misuse our platform by introducing viruses, attempting unauthorized access, or engaging in fraudulent activity.' },
        { title: '4. Product Listings', content: 'We reserve the right to remove any product listing that violates our policies. Sellers are responsible for the accuracy of their product descriptions and pricing.' },
        { title: '5. Payments', content: 'All payments are processed securely via Stripe. StyleHub does not store your payment card details. Prices are listed in USD and are subject to change without notice.' },
        { title: '6. Intellectual Property', content: 'All content on StyleHub including logos, text, and images is the property of StyleHub or its content suppliers and is protected by copyright laws.' },
        { title: '7. Limitation of Liability', content: 'StyleHub is not liable for any indirect, incidental, or consequential damages arising from your use of the platform or products purchased through it.' },
        { title: '8. Changes to Terms', content: 'We may update these terms at any time. Continued use of the platform after changes constitutes your acceptance of the new terms.' },
        { title: '9. Contact', content: 'For questions about these terms, contact us at legal@stylehub.com.' },
      ].map(s => (
        <div key={s.title} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{s.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{s.content}</p>
        </div>
      ))}
    </div>
  );
}
