import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { LOGO_WHITE, WHATSAPP_URL } from "@/lib/landingConstants";

export default function LandingFooter() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <img
            src={LOGO_WHITE}
            alt="PetDining PetForm"
            className="h-10 w-auto mb-4"
          />
          <p className="text-sm text-sidebar-foreground/70 leading-relaxed">
            一站式寵物友善餐廳解決方案，對接政府新法例，助力餐飲業把握寵物經濟新商機。
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">快速連結</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/70">
            <li>
              <Link to="/" className="hover:text-white">
                首頁
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-white">
                關於我們
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-white">
                服務
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">聯絡我們</h4>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-white"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp 9867 3497
          </a>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-4 text-center text-xs text-sidebar-foreground/50">
        © 2026 PetDining PetForm. All rights reserved.
      </div>
    </footer>
  );
}