import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { getActiveRushHour } from "../../api/rushHour";
import { formatPrice, getFinalPrice } from "../../utils/format";

const formatCountdown = (ms) => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const RushHourBanner = () => {
  const [data, setData] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    getActiveRushHour().then(({ data }) => setData(data)).catch(() => setData({ active: false }));
  }, []);

  useEffect(() => {
    if (!data?.active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [data]);

  if (!data?.active) return null;

  const endsAt = new Date(data.rush_hour.ends_at).getTime();
  const remaining = endsAt - now;
  if (remaining <= 0) return null; // window just ended — quietly hide, next poll of the page will confirm

  return (
    <section className="bg-amber-500 text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Zap size={22} className="fill-ink" />
            <div>
              <p className="font-display text-2xl leading-none">{data.rush_hour.name}</p>
              <p className="text-xs uppercase tracking-wide text-ink/70 mt-1">
                {data.rush_hour.discount_percent}% off selected items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-ink text-paper px-4 py-2 font-mono text-lg tabular-nums">
            {formatCountdown(remaining)}
          </div>
        </div>

        {data.products?.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {data.products.slice(0, 5).map((p) => {
              const primary = p.images?.find((i) => i.is_primary) || p.images?.[0];
              return (
                <Link key={p.id} to={`/product/${p.slug}`} className="group bg-paper">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img src={primary?.image_url || "/placeholder.svg"} alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-medium">{formatPrice(getFinalPrice(p.price, p.discount))}</span>
                      <span className="text-[10px] text-charcoal/50 line-through">{formatPrice(p.price)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default RushHourBanner;
