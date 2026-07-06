export default function HowToCarePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">How to Care for Your Items</h1>
      <p className="text-gray-500 mb-8">Keep your StyleHub purchases looking great with these care tips.</p>

      {[
        { emoji: '👔', title: 'Clothing — General', content: 'Always check the care label before washing. Most garments should be washed in cold water on a gentle cycle. Avoid over-drying as it can shrink fabrics and fade colors.' },
        { emoji: '👗', title: 'Delicate Fabrics (Silk, Lace)', content: 'Hand wash in cold water with a mild detergent. Do not wring or twist. Lay flat to dry away from direct sunlight.' },
        { emoji: '🧥', title: 'Outerwear & Jackets', content: 'Spot clean when possible. For full washes, follow the label instructions. Store on a hanger to maintain shape. Use a fabric brush to remove lint.' },
        { emoji: '👟', title: 'Footwear', content: 'Wipe shoes with a damp cloth after each use. Use appropriate cleaners for leather, suede, or canvas. Store in a cool dry place and use shoe trees to maintain shape.' },
        { emoji: '💍', title: 'Jewelry', content: 'Avoid contact with water, perfume, and lotions. Clean with a soft dry cloth. Store in a jewelry box or pouch to prevent scratches and tarnishing.' },
        { emoji: '🧒', title: 'Kids Clothing', content: "Children's clothes are designed for frequent washing. Use a gentle, fragrance-free detergent. Wash at 30°C to preserve colors and elasticity." },
      ].map(s => (
        <div key={s.title} className="mb-6 flex gap-4">
          <div className="text-3xl">{s.emoji}</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{s.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{s.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
