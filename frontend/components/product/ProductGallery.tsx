"use client";

// PDP gallery (design: Product Page.dc.html) — main square image + thumbnail rail.
import { useState } from "react";
import Image from "next/image";
import { mediaUrl } from "@/lib/utils/media";
import type { ProductImageView } from "@/lib/server/product";

export function ProductGallery({ images, name }: { images: ProductImageView[]; name: string }) {
  const [i, setI] = useState(0);
  const list = images.length > 0 ? images : [{ url: "/brand/leaf-pattern-light.webp", alt: name }];
  const current = list[Math.min(i, list.length - 1)];

  return (
    <div>
      <div className="overflow-hidden rounded-[2rem] bg-gray-100">
        <Image
          src={mediaUrl(current.url)}
          alt={current.alt || name}
          width={720}
          height={720}
          priority
          className="aspect-square w-full object-contain mix-blend-multiply"
        />
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-3">
          {list.map((img, idx) => (
            <button
              key={img.url + idx}
              type="button"
              aria-label={`Photo ${idx + 1}`}
              aria-current={idx === i}
              onClick={() => setI(idx)}
              className={`overflow-hidden rounded-2xl border-2 bg-gray-100 transition-colors ${
                idx === i ? "border-orange" : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={mediaUrl(img.url)}
                alt=""
                width={96}
                height={96}
                className="aspect-square w-20 object-contain mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
