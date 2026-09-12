import React from "react";
import { Star } from "lucide-react";

const RatingStars = ({ rating = 0, size = 14, showCount, count = 0 }) => {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={i <= rounded ? "fill-ink text-ink" : "fill-none text-ink/25"}
            strokeWidth={1.5}
          />
        ))}
      </div>
      {showCount && <span className="text-xs text-charcoal/60">({count})</span>}
    </div>
  );
};

export default RatingStars;
