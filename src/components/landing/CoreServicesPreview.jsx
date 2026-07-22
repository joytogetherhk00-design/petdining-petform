import { Link } from "react-router-dom";
import { ShoppingCart, Stethoscope, PhoneCall, Megaphone, ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/landingConstants";

const ICONS = { ShoppingCart, Stethoscope, PhoneCall, Megaphone };

export default function CoreServicesPreview() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center mb-12">四大核心服務模組</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service) => {
            const Icon = ICONS[service.icon];
            return (
              <div
                key={service.id}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  {Icon && <Icon className="h-7 w-7 text-brand" />}
                </div>
                <h3 className="font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.short}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-brand font-medium hover:gap-3 transition-all"
          >
            了解更多服務詳情 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}