import { ShieldCheck, Layers, Heart } from "lucide-react";
import { ABOUT_IMG } from "@/lib/landingConstants";

const REASONS = [
  {
    icon: ShieldCheck,
    title: "100% 合規",
    desc: "嚴格按照政府指引，確保您的申請100%合規",
  },
  {
    icon: Layers,
    title: "一站式服務",
    desc: "從申請到營運，我們全程支援",
  },
  {
    icon: Heart,
    title: "用心服務",
    desc: "以客為本，提供最專業的建議與支援",
  },
];

export default function About() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">關於 PetDining PetForm</h1>
          <p className="text-lg text-muted-foreground">
            專業、可靠、創新 — 成為您的寵物友善餐廳升級夥伴
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={ABOUT_IMG}
              alt="PetDining PetForm"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">我們的使命</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              PetDining PetForm 成立於香港，致力於幫助餐飲業界把握寵物友善商機。我們提供一站式解決方案，讓您的餐廳輕鬆升級為寵物友善場所。
            </p>
            <p className="text-muted-foreground leading-relaxed">
              對接政府新法例、供應合規物資、培訓員工、市場推廣 — 我們一手包辦，讓您專注於餐廳營運。
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-center mb-8">為什麼選擇我們</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {REASONS.map((reason) => (
              <div
                key={reason.title}
                className="bg-card border border-border rounded-2xl p-8 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <reason.icon className="h-7 w-7 text-brand" />
                </div>
                <h3 className="font-semibold mb-2">{reason.title}</h3>
                <p className="text-sm text-muted-foreground">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}