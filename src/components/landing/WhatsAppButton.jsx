import { MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/landingConstants";

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-whatsapp rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
      aria-label="WhatsApp 查詢"
    >
      <MessageCircle className="h-7 w-7 text-white" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
    </a>
  );
}