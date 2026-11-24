import Image from "next/image";
import { StarIcon } from "@/components/ui/icons";

// Static testimonial trio (ported from the old client's review.jsx). Photos live in
// public/brand; storefront StarIcon replaces lucide, CSS hover replaces framer-motion.
const reviews = [
  {
    id: 1,
    name: "Amit Sharma",
    photo: "/brand/custmer1.webp",
    stars: 5,
    review: "Matessa mate with masala became my favorite ritual drink every morning.",
  },
  {
    id: 2,
    name: "Ghoro Vishal",
    photo: "/brand/customer3.webp",
    stars: 5,
    review: "Love the refreshing taste of mate and Indian spices together.",
  },
  {
    id: 3,
    name: "Rahul Mehta",
    photo: "/brand/customer2.webp",
    stars: 4,
    review: "Great for work sessions, keeps me focused.",
  },
];

export function CustomerReviews() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-14 nav:px-8">
      <h2 className="mb-8 text-center font-heading text-3xl font-bold text-green md:text-4xl">Customers Reviews</h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl bg-white p-6 shadow-lg transition-transform duration-300 hover:scale-[1.03]"
          >
            <div className="relative mb-4 h-[360px] w-full overflow-hidden rounded-lg shadow-md">
              <Image
                src={review.photo}
                alt={review.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>

            <h3 className="text-center font-heading text-lg font-bold text-darkgreen">{review.name}</h3>

            <div className="my-2 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < review.stars ? "text-lightgreen" : "text-gray-300"}>
                  <StarIcon size={20} filled={i < review.stars} />
                </span>
              ))}
            </div>

            <p className="text-center font-body text-gray-600">{review.review}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
