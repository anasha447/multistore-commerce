"use client";

// Draggable card-stack gallery (ported from the prototype's stackGallery.jsx + stackUsage.jsx).
// Drag or click the top card to shuffle it to the back. Used in the What-is-Mate intro.

import { type ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";

const IMAGES = [
  "/wim/matee2.webp",
  "/wim/matee3.webp",
  "/wim/matee4.webp",
  "/wim/matee5.webp",
  "/wim/matee6.webp",
];

interface AnimConfig {
  stiffness: number;
  damping: number;
}

function CardRotate({
  children,
  onSendToBack,
  sensitivity,
}: {
  children: ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
          onSendToBack();
        } else {
          x.set(0);
          y.set(0);
        }
      }}
    >
      {children}
    </motion.div>
  );
}

interface Card {
  id: number;
  content: ReactNode;
}

function Stack({
  randomRotation = true,
  sensitivity = 180,
  cards,
  animationConfig = { stiffness: 200, damping: 20 },
}: {
  randomRotation?: boolean;
  sensitivity?: number;
  cards: ReactNode[];
  animationConfig?: AnimConfig;
}) {
  const [stack, setStack] = useState<Card[]>([]);

  useEffect(() => {
    setStack(cards.map((content, index) => ({ id: index + 1, content })));
  }, [cards]);

  const sendToBack = (id: number) =>
    setStack((prev) => {
      const next = [...prev];
      const index = next.findIndex((c) => c.id === id);
      if (index < 0) return prev;
      const [card] = next.splice(index, 1);
      next.unshift(card);
      return next;
    });

  return (
    <div className="relative h-full w-full" style={{ perspective: 600 }}>
      {stack.map((card, index) => {
        const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;
        return (
          <CardRotate key={card.id} onSendToBack={() => sendToBack(card.id)} sensitivity={sensitivity}>
            <motion.div
              className="absolute left-0 top-0 h-full w-full overflow-hidden rounded-2xl border-[2.5px] border-white bg-white shadow-xl"
              onClick={() => sendToBack(card.id)}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: "90% 90%",
              }}
              initial={false}
              transition={{ type: "spring", stiffness: animationConfig.stiffness, damping: animationConfig.damping }}
            >
              {card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}

export function StackGallery() {
  const cards = IMAGES.map((src, i) => (
    <Image
      key={src}
      src={src}
      alt={`Mate ritual ${i + 1}`}
      width={340}
      height={340}
      draggable={false}
      className="pointer-events-none h-full w-full object-cover"
    />
  ));

  return (
    <div className="flex flex-col items-center justify-center py-1">
      <div className="relative h-64 w-64 md:h-80 md:w-80">
        <Stack cards={cards} randomRotation sensitivity={180} animationConfig={{ stiffness: 200, damping: 20 }} />
      </div>
      <p className="mt-8 animate-pulse font-body text-sm uppercase tracking-widest text-darkgreen/80">
        Click or Drag to Shuffle
      </p>
    </div>
  );
}
