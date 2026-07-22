import { BarChart3, Scale, AlertTriangle } from "lucide-react";

const PAIN_POINTS = [
  {
    icon: BarChart3,
    title: "市場需求龐大",
    desc: "香港寵物家庭佔比不斷創新高，帶寵物外出用餐成為新常態。",
  },
  {
    icon: Scale,
    title: "法例正式生效",
    desc: "政府修例容許狗隻進入獲批食肆，正式生效。首階段限額申請，先到先得。",
  },
  {
    icon: AlertTriangle,
    title: "合規門檻與痛點",
    desc: "不知如何申請？我們為您解決所有轉型煩惱，實現無縫過渡。",
  },
];

export default function MarketPainPoints() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center mb-12">
          寵物友善餐廳 — 餐飲業新風口
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((point) => (
            <div
              key={point.title}
              className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
                <point.icon className="h-6 w-6 text-brand" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{point.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}