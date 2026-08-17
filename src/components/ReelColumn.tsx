import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cryptoRng } from "../lib/rng";
import { pickSymbol, type SlotSymbol } from "../lib/slots";
import { SlotGlyph } from "./SlotGlyph";

interface ReelColumnProps {
  index: number;
  visible: SlotSymbol[];
  landing: SlotSymbol[] | null;
  hotRows: boolean[];
  onStopped: () => void;
}

export function ReelColumn({ index, visible, landing, hotRows, onStopped }: ReelColumnProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(onStopped);
  const [strip, setStrip] = useState<SlotSymbol[]>(visible);
  const [run, setRun] = useState(0);
  stopRef.current = onStopped;

  useEffect(() => {
    if (!landing) {
      setStrip(visible);
      return;
    }
    const filler = 8 + index * 5;
    const pad: SlotSymbol[] = Array.from({ length: filler }, () => pickSymbol(cryptoRng()));
    setStrip([...visible, ...pad, ...landing]);
    setRun((n) => n + 1);
  }, [landing, index]);

  useLayoutEffect(() => {
    if (!landing || !run) return;
    const el = stripRef.current;
    if (!el || el.children.length < 4) return;
    const height = (el.children[0] as HTMLElement).offsetHeight;
    const distance = (strip.length - 3) * height;
    const animation = el.animate(
      [
        { transform: "translate3d(0,0,0)", filter: "blur(0)" },
        { filter: "blur(3px)", offset: 0.4 },
        { transform: `translate3d(0, ${-distance}px, 0)`, filter: "blur(0)" },
      ],
      {
        duration: 750 + index * 360,
        easing: "cubic-bezier(0.12, 0.75, 0.18, 1)",
        fill: "forwards",
      },
    );
    const finish = () => stopRef.current();
    animation.addEventListener("finish", finish);
    return () => {
      animation.removeEventListener("finish", finish);
      animation.cancel();
    };
  }, [run, landing, index, strip.length]);

  return (
    <div className="reel">
      <div className="reel-window">
        <div ref={stripRef} className="reel-strip">
          {strip.map((symbol, i) => {
            const row = i < 3 ? i : -1;
            const hot = row >= 0 && !landing && hotRows[row];
            return (
              <div key={`${i}-${symbol}`} className={`reel-cell ${hot ? "hot" : ""}`}>
                <SlotGlyph symbol={symbol} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
