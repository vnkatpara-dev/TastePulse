import { Star } from "lucide-react";

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${star <= rating ? "fill-primary text-primary" : "text-border"}`}
        size={size}
      />
    ))}
  </div>
);

export default StarRating;
