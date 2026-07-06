export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-8">Last updated: January 2024</p>

      {[
        { title: '1. Information We Collect', content: 'We collect information you provide when registering, placing orders, or contacting us — including your name, email address, shipping address, and payment details.' },
        { title: '2. How We Use Your Information', content: 'We use your information to process orders, send order updates, improve our platform, and communicate with you about promotions (only if you opt in).' },
        { title: '3. Data Sharing', content: 'We do not sell your personal data. We share data only with trusted third parties necessary to operate our service, such as payment processors (Stripe) and shipping carriers.' },
        { title: '4. Cookies', content: 'We use cookies to maintain your session and improve your browsing experience. You can disable cookies in your browser settings, though some features may not work correctly.' },
        { title: '5. Data Security', content: 'We use industry-standard encryption and security practices to protect your data. However, no method of transmission over the internet is 100% secure.' },
        { title: '6. Your Rights', content: 'You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@stylehub.com to make a request.' },
        { title: '7. Children\'s Privacy', content: 'StyleHub is not intended for children under 13. We do not knowingly collect personal information from children.' },
        { title: '8. Changes to This Policy', content: 'We may update this policy periodically. We will notify you of significant changes via email or a notice on our website.' },
      ].map(s => (
        <div key={s.title} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{s.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{s.content}</p>
        </div>
      ))}
    </div>
  );
}
