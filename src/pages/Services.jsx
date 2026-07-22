import { ShoppingCart, Stethoscope, PhoneCall, Megaphone, CheckCircle } from "lucide-react";
import { SERVICES } from "@/lib/landingConstants";

const ICONS = { ShoppingCart, Stethoscope, PhoneCall, Megaphone };

export default function Services() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">4大核心服務</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PetDining PetForm 提供全方位解決方案，讓您的餐廳無縫轉型為寵物友善場所
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {SERVICES.map((service) => {
            const Icon = ICONS[service.icon];
            return (
              <div
                key={service.id}
                className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                    {Icon && <Icon className="h-7 w-7 text-brand" />}
                  </div>
                  <h2 className="text-xl font-semibold pt-2">{service.title}</h2>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-brand shrink-0" /> {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}