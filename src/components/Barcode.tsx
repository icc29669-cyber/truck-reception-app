"use client";
import { useEffect, useRef } from "react";

interface Props {
  value: string;
}

export default function Barcode({ value }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    import("jsbarcode").then((mod) => {
      const JsBarcode = mod.default;
      JsBarcode(ref.current!, value, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 11,
        margin: 4,
      });
    });
  }, [value]);

  return <svg ref={ref} className="w-full" />;
}
