import React from "react";

const Hero = () => {
  return (
    <section className="ceritage-bg relative overflow-hidden">

      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full border border-[#c18a00]/10" />
      <div className="pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full border border-[#c18a00]/10" />

      <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">

        {/* Left */}
        <div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfcea8] bg-[#fffdf8] px-4 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#c18a00]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#987000]">
              Jewellery Business Suite
            </span>
          </div>

          <h1 className="mt-7 max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-[#2d2118] sm:text-5xl lg:text-6xl">

            Run your jewellery
            <span className="block text-[#b98200]">
              business beautifully.
            </span>

          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-[#756656] sm:text-lg">
            Ceritage brings billing, inventory, sales, purchases, repairs,
            customers and business analytics together in one intelligent
            platform built for modern jewellery businesses.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">

            <a
              href="/register"
              className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#b98200] px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#b98200]/20 transition hover:-translate-y-1 hover:bg-[#a87300]"
            >
              Start Your Journey

              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>

            <a
              href="/features"
              className="inline-flex items-center justify-center rounded-xl border border-[#d9c9ad] bg-[#fffdf9] px-7 py-3.5 text-sm font-bold text-[#4d3b2b] transition hover:border-[#c18a00] hover:bg-[#faf5e9]"
            >
              Explore Features
            </a>

          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-medium text-[#887766]">

            <span className="flex items-center gap-2">
              <span className="text-[#c18a00]">✦</span>
              Built for jewellery businesses
            </span>

            <span className="flex items-center gap-2">
              <span className="text-[#c18a00]">✦</span>
              One complete platform
            </span>

          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative">

          <div className="absolute -inset-5 rounded-[32px] bg-[#c18a00]/5 blur-2xl" />

          <div className="relative overflow-hidden rounded-[24px] border border-[#e4d8c4] bg-[#fffdf9] shadow-2xl shadow-[#5c4420]/10">

            {/* Mini Header */}
            <div className="flex items-center justify-between border-b border-[#eee5d8] px-5 py-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#92765a]">
                  Dashboard
                </p>

                <p className="mt-1 text-sm font-semibold text-[#302319]">
                  Ceritage ERP
                </p>
              </div>

              <div className="rounded-full border border-[#e3d3ad] bg-[#faf4e3] px-3 py-1.5 text-[10px] font-bold text-[#a37600]">
                ● Live
              </div>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-5">

              <div className="rounded-xl border border-[#eee4d5] bg-[#fbf8f2] p-4">
                <p className="text-[10px] font-semibold text-[#927e6b]">
                  TODAY'S SALES
                </p>

                <p className="mt-2 text-2xl font-bold text-[#302319]">
                  ₹8.4L
                </p>

                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  ▲ 12% vs yesterday
                </p>
              </div>

              <div className="rounded-xl border border-[#eee4d5] bg-[#fbf8f2] p-4">
                <p className="text-[10px] font-semibold text-[#927e6b]">
                  CUSTOMERS
                </p>

                <p className="mt-2 text-2xl font-bold text-[#302319]">
                  1,247
                </p>

                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  ▲ 8 this week
                </p>
              </div>

            </div>

            {/* Chart */}
            <div className="px-5 pb-5">

              <div className="rounded-xl border border-[#eee4d5] bg-[#fffdf9] p-5">

                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#382a1d]">
                    Monthly Sales
                  </p>

                  <span className="text-xs font-semibold text-[#b98200]">
                    2026
                  </span>
                </div>

                <div className="mt-6 flex h-32 items-end gap-3">

                  {[42, 65, 52, 78, 68, 88, 96, 74].map((height, index) => (
                    <div
                      key={index}
                      className="flex flex-1 items-end"
                    >
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-[#d8bf7e] to-[#b98200]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}

                </div>

                <div className="mt-3 flex justify-between text-[9px] font-medium text-[#998977]">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;