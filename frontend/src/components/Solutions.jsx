import React from "react";

const solutions = [
  {
    // icon: "",
    title: "Smart Billing",
    description:
      "Create professional GST invoices and manage billing faster with a connected sales workflow.",
  },
  {
    // icon: "",
    title: "Inventory Control",
    description:
      "Track jewellery, gold, diamonds, stock movements and low-stock items from one place.",
  },
  {
    // icon: "♢",
    title: "Sales Management",
    description:
      "Keep customer sales, orders and transactions organized across your business.",
  },
  {
    // icon: "↗",
    title: "Business Analytics",
    description:
      "Understand sales, purchases and performance with clear, decision-ready insights.",
  },
  {
    // icon: "⚒",
    title: "Repair Management",
    description:
      "Track repair jobs, delivery commitments and workshop activity without the paperwork.",
  },
  {
    // icon: "⌂",
    title: "Multi-Branch",
    description:
      "Manage multiple branches with centralized visibility and controlled operations.",
  },
];

const Solutions = () => {
  return (
    <section
      id="features"
      className="relative overflow-hidden border-y border-[#e8dfd1] bg-[#f3ecdf] px-5 py-20 sm:px-6 lg:px-8 lg:py-24"
    >
      {/* =========================================
          BACKGROUND DECORATION
      ========================================== */}

      {/* Subtle grid */}
      <div
        className="
          pointer-events-none absolute inset-0
          opacity-60
          bg-[linear-gradient(to_right,rgba(193,138,0,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(193,138,0,0.045)_1px,transparent_1px)]
          bg-[size:56px_56px]
        "
      />

      {/* Large top-right circle */}
      <div
        className="
          pointer-events-none absolute
          -right-32 -top-32
          h-[420px] w-[420px]
          rounded-full
          border border-[#c18a00]/10
        "
      />

      {/* Second circle */}
      <div
        className="
          pointer-events-none absolute
          -right-16 -top-16
          h-[300px] w-[300px]
          rounded-full
          border border-[#c18a00]/8
        "
      />

      {/* Bottom-left circle */}
      <div
        className="
          pointer-events-none absolute
          -bottom-48 -left-40
          h-[480px] w-[480px]
          rounded-full
          border border-[#c18a00]/8
        "
      />

      {/* Soft gold glow */}
      <div
        className="
          pointer-events-none absolute
          left-[8%] top-[25%]
          h-44 w-44
          rounded-full
          bg-[#c18a00]/5
          blur-3xl
        "
      />

      {/* Small decorative dots */}
      <div className="pointer-events-none absolute left-[7%] top-24 h-2 w-2 rounded-full bg-[#c18a00]/25" />

      <div className="pointer-events-none absolute right-[9%] bottom-28 h-2.5 w-2.5 rounded-full bg-[#c18a00]/20" />

      {/* =========================================
          CONTENT
      ========================================== */}

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">

          <span
            className="
              inline-flex items-center gap-2
              rounded-full
              border border-[#dfcda9]
              bg-[#fffdf8]
              px-4 py-2
              text-[10px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-[#a87500]
              shadow-sm
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#c18a00]" />

            One Complete Platform
          </span>

          <h2
            className="
              mt-5
              text-3xl font-bold
              tracking-[-0.035em]
              text-[#302218]
              sm:text-4xl
            "
          >
            Everything your jewellery business needs.
          </h2>

          <p
            className="
              mt-4
              text-sm leading-7
              text-[#7b6b5a]
              sm:text-base
            "
          >
            Replace disconnected tools with one connected platform designed
            around the way jewellery businesses actually operate.
          </p>

        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {solutions.map((item) => (
            <div
              key={item.title}
              className="
                group
                relative
                overflow-hidden
                rounded-2xl
                border border-[#e7dccb]
                bg-[#fffdf9]
                p-6
                shadow-sm
                transition
                duration-300
                hover:-translate-y-1
                hover:border-[#d5bb83]
                hover:shadow-xl
                hover:shadow-[#70521d]/5
              "
            >

              {/* Tiny card decoration */}
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-8
                  -top-8
                  h-20
                  w-20
                  rounded-full
                  border border-[#c18a00]/8
                  transition
                  duration-500
                  group-hover:scale-125
                "
              />

              {/* Icon */}
              <div
                className="
                  relative
                  flex h-11 w-11
                  items-center justify-center
                  rounded-xl
                  bg-[#f6edda]
                  text-lg font-bold
                  text-[#b98200]
                  transition
                  duration-300
                  group-hover:bg-[#b98200]
                  group-hover:text-white
                "
              >
                {item.icon}
              </div>

              {/* Content */}
              <h3 className="mt-5 text-base font-bold text-[#34261b]">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#7d6d5c]">
                {item.description}
              </p>

              {/* Explore */}
              <div
                className="
                  mt-5
                  text-xs font-bold
                  text-[#b98200]
                  opacity-0
                  transition
                  duration-300
                  group-hover:opacity-100
                "
              >
                Explore →
              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default Solutions;