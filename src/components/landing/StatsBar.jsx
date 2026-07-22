import { STATS } from "@/lib/landingConstants";

export default function StatsBar() {
  return (
    <section className="bg-brand text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-white/80">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}