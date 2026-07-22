import { Link } from "react-router-dom";
import { PawPrint, ArrowRight } from "lucide-react";
import { WHATSAPP_URL, HERO_BG, HERO_CIRCLE } from "@/lib/landingConstants";

export default function Hero() {
  return (
    <section className="relative min-h-[600px] flex items-center bg-brand-dark">
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/30" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20 w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white">
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <PawPrint className="h-4 w-4" /> 政府新法例正式生效 | 抓住寵物友善商機
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
            PetDining PetForm
          </h1>
          <p className="text-xl md:text-2xl font-medium text-white/90 mb-4">
            一站式寵物友善餐廳解決方案
          </p>
          <p className="text-base text-white/70 mb-8 leading-relaxed">
            對接寵物友善政府新法例
            <br />
            零門檻合規 · 鎖定寵物經濟新商機
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-brand hover:bg-brand-dark text-white font-medium text-sm transition-colors shadow-lg"
            >
              立即免費評估
            </a>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-md bg-white/10 border border-white/30 text-white hover:bg-white/20 font-medium text-sm transition-colors"
            >
              了解核心服務 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="hidden md:flex justify-center">
          <div className="w-72 h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
            <img
              src={HERO_CIRCLE}
              alt="寵物友善餐廳"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.parentElement.style.display = "none"; }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}