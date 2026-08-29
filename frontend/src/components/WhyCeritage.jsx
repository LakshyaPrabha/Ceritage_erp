import React from "react";

const points = [
  {
    number: "01",
    title: "Built around your workflow",
    text: "Ceritage connects the everyday operations that keep a jewellery business moving.",
  },
  {
    number: "02",
    title: "One source of truth",
    text: "Bring customers, stock, billing, purchases and business activity into one organized system.",
  },
  {
    number: "03",
    title: "Clarity at every level",
    text: "Get the information you need to make faster and more confident business decisions.",
  },
];

const WhyCeritage = () => {
  return (
    <section
      id="about"
      className="ceritage-bg px-5 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">

        {/* Left */}
        <div>

          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b98200]">
            Why Ceritage
          </span>

          <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight tracking-[-0.04em] text-[#302218] sm:text-4xl lg:text-5xl">
            Less juggling.
            <span className="block text-[#b98200]">
              More control.
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-sm leading-7 text-[#756656] sm:text-base">
            Your jewellery business has enough moving parts. Ceritage gives
            your team a clear, connected way to manage them — without making
            everyday work more complicated.
          </p>

          <a
            href="/about"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#a87500] transition hover:gap-3"
          >
            Learn more about Ceritage
            <span>→</span>
          </a>

        </div>

        {/* Right */}
        <div className="space-y-3">

          {points.map((point) => (
            <div
              key={point.number}
              className="group flex gap-5 rounded-2xl border border-[#e5dac8] bg-[#fffdf9] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d4b976]"
            >

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5ead2] text-xs font-bold text-[#a87500]">
                {point.number}
              </div>

              <div>
                <h3 className="text-base font-bold text-[#33251b]">
                  {point.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#7c6d5d]">
                  {point.text}
                </p>
              </div>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default WhyCeritage;