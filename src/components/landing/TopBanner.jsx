import { WHATSAPP_URL } from "@/lib/landingConstants";

export default function TopBanner() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center h-9 bg-brand-dark text-white text-xs sm:text-sm px-4 hover:bg-brand transition-colors overflow-hidden whitespace-nowrap"
    >
      🐾 首次開戶費 <span className="font-bold mx-0.5">HK$688</span>，全數可用作採購寵物貨品 → 立即查詢
    </a>
  );
}