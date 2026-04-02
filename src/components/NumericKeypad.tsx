"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}

export default function NumericKeypad({ value, onChange, maxLength = 11 }: Props) {
  function press(d: string) {
    if (value.length >= maxLength) return;
    onChange(value + d);
  }
  function del() {
    onChange(value.slice(0, -1));
  }

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {keys.map((k, i) =>
        k === "" ? (
          <div key={i} />
        ) : k === "⌫" ? (
          <button
            key={i}
            onPointerDown={del}
            className="h-20 bg-gray-600 hover:bg-gray-500 active:bg-gray-400 rounded-2xl text-3xl font-bold flex items-center justify-center transition-colors"
          >
            ⌫
          </button>
        ) : (
          <button
            key={i}
            onPointerDown={() => press(k)}
            className="h-20 bg-gray-700 hover:bg-gray-600 active:bg-blue-600 rounded-2xl text-4xl font-bold flex items-center justify-center transition-colors"
          >
            {k}
          </button>
        )
      )}
    </div>
  );
}
