import { WHATSAPP_URL } from "@/lib/landingConstants";

export default function CTASection() {
  return (
    <section className="py-20 bg-brand-dark text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-bold mb-3">立即行動，搶佔市場先機</h2>
        <p className="text-lg text-white/80 mb-8">首階段名額有限！立即聯繫我們</p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-white text-brand-dark font-semibold text-base hover:bg-white/90 transition-colors shadow-lg"
        >
          立即免費評估
        </a>
      </div>
    </section>
  );
}