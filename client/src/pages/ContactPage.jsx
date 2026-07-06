import { useState } from 'react';
import { toast } from 'react-toastify';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-10">We'd love to hear from you. Fill out the form or reach us directly.</p>

      <div className="grid md:grid-cols-2 gap-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Your Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          <input type="email" placeholder="Your Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          <input placeholder="Subject" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          <textarea placeholder="Your message..." required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 font-medium">Send Message</button>
        </form>

        <div className="space-y-6">
          {[
            { emoji: '📧', label: 'Email', value: 'support@stylehub.com' },
            { emoji: '📞', label: 'Phone', value: '+1 (800) 123-4567' },
            { emoji: '🕐', label: 'Support Hours', value: 'Mon–Fri, 9am–6pm EST' },
            { emoji: '📍', label: 'Address', value: '123 Fashion Ave, New York, NY 10001' },
          ].map(c => (
            <div key={c.label} className="flex gap-4 items-start">
              <div className="text-2xl">{c.emoji}</div>
              <div>
                <p className="font-semibold text-gray-700">{c.label}</p>
                <p className="text-sm text-gray-500">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
