import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { WHATSAPP_URL, LOGO_ORANGE, LOGO_WHITE } from "@/lib/landingConstants";

const NAV_LINKS = [
  { label: "首頁", path: "/" },
  { label: "關於我們", path: "/about" },
  { label: "服務", path: "/services" },
];

export default function LandingNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = isHome && !scrolled && !mobileOpen;
  const textColor = transparent ? "text-white" : "text-foreground";
  const hoverColor = transparent ? "hover:text-white" : "hover:text-brand";

  const handleLogin = () => base44.auth.redirectToLogin("/products");

  return (
    <div
      className={`${
        transparent
          ? "bg-transparent"
          : "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
      } transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={transparent ? LOGO_WHITE : LOGO_ORANGE}
            alt="PetDining PetForm"
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors ${textColor} ${hoverColor} ${
                location.pathname === link.path ? "font-bold" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate("/products")}
              className={`text-sm font-medium ${textColor} ${hoverColor} transition-colors`}
            >
              進入平台
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className={`text-sm font-medium ${textColor} ${hoverColor} transition-colors`}
            >
              客戶登入
            </button>
          )}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-brand hover:bg-brand-dark text-white text-sm font-medium transition-colors"
          >
            立即免費評估
          </a>
        </div>

        <button
          className="md:hidden shrink-0"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className={`h-6 w-6 ${textColor}`} />
          ) : (
            <Menu className={`h-6 w-6 ${textColor}`} />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-foreground hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border space-y-3">
            {user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/products");
                }}
                className="block w-full text-sm font-medium text-foreground text-left"
              >
                進入平台
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogin();
                }}
                className="block w-full text-sm font-medium text-foreground text-left"
              >
                客戶登入
              </button>
            )}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center h-10 leading-10 rounded-md bg-brand text-white text-sm font-medium"
            >
              立即免費評估
            </a>
          </div>
        </div>
      )}
    </div>
  );
}