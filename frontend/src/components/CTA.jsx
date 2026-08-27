import React from "react";

const CTA = () => {
  return (
    <section className="ceritage-bg px-5 py-20 sm:px-6 lg:px-8 lg:py-24">

      <div className="mx-auto max-w-7xl">

        <div
          className="
            relative overflow-hidden rounded-[30px]
            border border-[#dfcda9]
            bg-[#fffaf0]
            shadow-xl shadow-[#8b671c]/10
          "
        >

          {/* Background Grid */}
          <div
            className="
              pointer-events-none absolute inset-0 opacity-70
              bg-[linear-gradient(to_right,rgba(193,138,0,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(193,138,0,0.055)_1px,transparent_1px)]
              bg-[size:48px_48px]
            "
          />

          {/* Decorative Gold Circle */}
          <div
            className="
              pointer-events-none absolute
              -right-24 -top-24
              h-80 w-80
              rounded-full
              border border-[#c18a00]/15
            "
          />

          <div
            className="
              pointer-events-none absolute
              -right-12 -top-12
              h-56 w-56
              rounded-full
              border border-[#c18a00]/10
            "
          />

          {/* Soft Gold Glow */}
          <div
            className="
              pointer-events-none absolute
              -bottom-32 -left-24
              h-80 w-80
              rounded-full
              bg-[#c18a00]/8
              blur-3xl
            "
          />

          {/* Content */}
          <div className="relative px-7 py-14 text-center sm:px-12 lg:px-20 lg:py-20">

            {/* Small Label */}
            <span
              className="
                inline-flex items-center gap-2
                rounded-full
                border border-[#dec995]
                bg-[#fffdf8]
                px-4 py-2
                text-[10px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-[#a57400]
                shadow-sm
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#c18a00]" />

              Ready to grow?
            </span>

            {/* Heading */}
            <h2
              className="
                mx-auto mt-6 max-w-3xl
                text-3xl font-bold
                leading-tight
                tracking-[-0.04em]
                text-[#302218]
                sm:text-4xl
                lg:text-5xl
              "
            >
              Bring your jewellery business into{" "}
              <span className="text-[#b98200]">
                one smarter system.
              </span>
            </h2>

            {/* Description */}
            <p
              className="
                mx-auto mt-5 max-w-xl
                text-sm leading-7
                text-[#756656]
                sm:text-base
              "
            >
              Simplify operations, get better visibility and give your team
              the tools they need to move faster.
            </p>

            {/* Buttons */}
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

              {/* Primary */}
              <a
                href="/register"
                className="
                  group
                  inline-flex items-center justify-center gap-2
                  rounded-xl
                  bg-[#c18a00]
                  px-7 py-3.5
                  text-sm font-bold
                  text-white
                  shadow-lg shadow-[#b98200]/20
                  transition duration-300
                  hover:-translate-y-0.5
                  hover:bg-[#aa7700]
                  hover:shadow-xl
                "
              >
                Get Started

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>

              {/* Secondary */}
              <a
                href="/contact"
                className="
                  inline-flex items-center justify-center
                  rounded-xl
                  border border-[#d8c7a7]
                  bg-[#fffdf9]
                  px-7 py-3.5
                  text-sm font-bold
                  text-[#4b3827]
                  transition duration-300
                  hover:-translate-y-0.5
                  hover:border-[#c18a00]
                  hover:bg-[#faf3e2]
                "
              >
                Talk to Us
              </a>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default CTA;