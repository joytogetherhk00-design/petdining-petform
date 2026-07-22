import { Outlet, useLocation } from "react-router-dom";
import TopBanner from "./TopBanner";
import LandingNav from "./LandingNav";
import LandingFooter from "./LandingFooter";
import WhatsAppButton from "./WhatsAppButton";

export default function LandingLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 w-full z-40">
        <TopBanner />
        <LandingNav />
      </header>
      <main className={`flex-1 ${isHome ? "" : "pt-[100px]"}`}>
        <Outlet />
      </main>
      <LandingFooter />
      <WhatsAppButton />
    </div>
  );
}