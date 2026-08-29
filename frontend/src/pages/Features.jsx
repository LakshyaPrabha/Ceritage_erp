import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const features = [
  {
    number: "01",
    icon: "▣",
    title: "Billing & GST",
    text: "Create professional invoices, manage GST billing and keep transaction records organized.",
  },
  {
    number: "02",
    icon: "◇",
    title: "Inventory",
    text: "Track jewellery products, precious metals, stock movements and low-stock items.",
  },
  {
    number: "03",
    icon: "₹",
    title: "Sales",
    text: "Manage sales activity, customer transactions and business performance from one place.",
  },
  {
    number: "04",
    icon: "↗",
    title: "Purchase",
    text: "Organize purchase workflows and maintain better visibility over incoming inventory.",
  },
  {
    number: "05",
    icon: "◫",
    title: "Accounting",
    text: "Keep your financial operations connected with the rest of your business workflows.",
  },
  {
    number: "06",
    icon: "⌁",
    title: "Repairs",
    text: "Track repair jobs, status, customer details and workshop operations with clarity.",
  },
  {
    number: "07",
    icon: "◉",
    title: "Analytics",
    text: "Understand sales, customers, inventory and operational activity through useful insights.",
  },
  {
    number: "08",
    icon: "⌂",
    title: "Multi-Branch",
    text: "Manage multiple jewellery business locations while keeping operations connected.",
  },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-[#f5f0e7] text-[#302218]">
      <Navbar />

      <main>

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="ceritage-bg relative overflow-hidden">

          {/* Decorative circles */}
          <div
            className="
              pointer-events-none absolute
              -right-40 -top-40
              h-[500px] w-[500px]
              rounded-full
              border border-[#c18a00]/10
            "
          />

          <div
            className="
              pointer-events-none absolute
              -right-16 -top-16
              h-[340px] w-[340px]
              rounded-full
              border border-[#c18a00]/10
            "
          />

          <div
            className="
              pointer-events-none absolute
              -bottom-48 -left-40
              h-[480px] w-[480px]
              rounded-full
              border border-[#c18a00]/8
            "
          />

          {/* Soft glow */}
          <div
            className="
              pointer-events-none absolute
              left-[12%] top-[30%]
              h-48 w-48
              rounded-full
              bg-[#c18a00]/5
              blur-3xl
            "
          />

          <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">

            <div className="max-w-3xl">

              {/* Label */}
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

                Platform Features
              </span>

              {/* Heading */}
              <h1
                className="
                  mt-6
                  text-4xl font-bold
                  leading-[1.08]
                  tracking-[-0.045em]
                  text-[#302218]
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                Everything your jewellery business needs.
              </h1>

              <p
                className="
                  mt-7 max-w-2xl
                  text-base leading-8
                  text-[#756656]
                  sm:text-lg
                "
              >
                From the first customer interaction to billing, inventory,
                repairs and reporting — Ceritage connects the workflows that
                keep your business moving.
              </p>

            </div>
          </div>
        </section>

        {/* =====================================================
            FEATURE GRID
        ====================================================== */}

        <section
          id="features"
          className="
            relative overflow-hidden
            border-y border-[#e2d7c5]
            bg-[#f3ecdf]
            px-5 py-20
            sm:px-6
            lg:px-8
            lg:py-28
          "
        >

          {/* Background grid */}
          <div
            className="
              pointer-events-none absolute inset-0
              opacity-60
              bg-[linear-gradient(to_right,rgba(193,138,0,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(193,138,0,0.045)_1px,transparent_1px)]
              bg-[size:56px_56px]
            "
          />

          {/* Background circles */}
          <div
            className="
              pointer-events-none absolute
              -right-36 top-20
              h-96 w-96
              rounded-full
              border border-[#c18a00]/8
            "
          />

          <div
            className="
              pointer-events-none absolute
              -left-40 bottom-0
              h-[420px] w-[420px]
              rounded-full
              border border-[#c18a00]/7
            "
          />

          <div className="relative z-10 mx-auto max-w-7xl">

            {/* Section heading */}
            <div className="mx-auto max-w-2xl text-center">

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-[#a87500]
                "
              >
                Built for jewellery businesses
              </span>

              <h2
                className="
                  mt-4
                  text-3xl font-bold
                  tracking-[-0.035em]
                  text-[#302218]
                  sm:text-4xl
                "
              >
                Powerful tools. One connected platform.
              </h2>

              <p
                className="
                  mt-4
                  text-sm leading-7
                  text-[#7b6b5a]
                  sm:text-base
                "
              >
                Manage the essential parts of your business without jumping
                between disconnected systems.
              </p>

            </div>

            {/* Cards */}
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {features.map((feature) => (
                <FeatureCard
                  key={feature.number}
                  {...feature}
                />
              ))}

            </div>
          </div>
        </section>

        {/* =====================================================
            CONNECTED SYSTEM SECTION
        ====================================================== */}

        <section className="ceritage-bg relative overflow-hidden">

          {/* Decoration */}
          <div
            className="
              pointer-events-none absolute
              -right-32 top-10
              h-80 w-80
              rounded-full
              border border-[#c18a00]/10
            "
          />

          <div
            className="
              pointer-events-none absolute
              -left-32 bottom-0
              h-72 w-72
              rounded-full
              bg-[#c18a00]/5
              blur-3xl
            "
          />

          <div
            className="
              relative mx-auto grid max-w-7xl
              gap-12 px-5 py-20
              sm:px-6
              lg:grid-cols-2
              lg:items-center
              lg:px-8
              lg:py-28
            "
          >

            {/* Left */}
            <div>

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-[#a87500]
                "
              >
                One connected system
              </span>

              <h2
                className="
                  mt-4
                  text-3xl font-bold
                  tracking-[-0.035em]
                  text-[#302218]
                  sm:text-4xl
                "
              >
                Your operations should work together.
              </h2>

              <p
                className="
                  mt-6
                  max-w-xl
                  text-sm leading-7
                  text-[#756656]
                  sm:text-base
                "
              >
                Ceritage is designed so your business information can move
                naturally between the workflows your team uses every day.
              </p>

              <a
                href="/register"
                className="
                  group
                  mt-8
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-[#c18a00]
                  px-6 py-3
                  text-sm font-bold
                  text-white
                  shadow-lg
                  shadow-[#b98200]/20
                  transition
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-[#aa7700]
                "
              >
                Explore Ceritage

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>

            </div>

            {/* Right visual */}
            <div
              className="
                relative
                overflow-hidden
                rounded-[28px]
                border border-[#dfcfb4]
                bg-[#fffdf8]
                p-5
                shadow-xl
                shadow-[#70521d]/8
              "
            >

              {/* Decorative circle */}
              <div
                className="
                  pointer-events-none absolute
                  -right-16 -top-16
                  h-40 w-40
                  rounded-full
                  border border-[#c18a00]/10
                "
              />

              <div
                className="
                  relative
                  rounded-2xl
                  border border-[#eadfcf]
                  bg-[#f8f2e6]
                  p-5
                "
              >

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <p className="text-xs font-bold text-[#4b3827]">
                      Ceritage Platform
                    </p>

                    <p className="mt-1 text-[10px] text-[#8a7864]">
                      Connected business modules
                    </p>
                  </div>

                  <div className="h-2 w-2 rounded-full bg-[#c18a00]" />
                </div>

                <div className="grid grid-cols-2 gap-3">

                  {[
                    "Billing",
                    "Inventory",
                    "Sales",
                    "Purchase",
                    "Accounting",
                    "Repairs",
                    "Analytics",
                    "Branches",
                  ].map((item) => (
                    <div
                      key={item}
                      className="
                        group
                        rounded-xl
                        border border-[#e5d7c1]
                        bg-[#fffdf9]
                        px-4 py-4
                        text-sm font-semibold
                        text-[#4b3827]
                        shadow-sm
                        transition
                        duration-300
                        hover:-translate-y-0.5
                        hover:border-[#c18a00]/40
                        hover:shadow-md
                      "
                    >
                      <div className="flex items-center gap-2">

                        <span
                          className="
                            flex h-7 w-7
                            items-center justify-center
                            rounded-lg
                            bg-[#f6edda]
                            text-xs
                            text-[#b98200]
                            transition
                            group-hover:bg-[#c18a00]
                            group-hover:text-white
                          "
                        >
                          ◇
                        </span>

                        {item}
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================
            CTA
        ====================================================== */}

        <section className="bg-[#f3ecdf] px-5 py-20 sm:px-6 lg:px-8 lg:py-24">

          <div className="mx-auto max-w-4xl text-center">

            <span
              className="
                inline-flex
                rounded-full
                border border-[#dfcda9]
                bg-[#fffdf8]
                px-4 py-2
                text-[10px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-[#a87500]
              "
            >
              Built to simplify
            </span>

            <h2
              className="
                mt-5
                text-3xl font-bold
                tracking-[-0.04em]
                text-[#302218]
                sm:text-4xl
              "
            >
              Ready to bring everything together?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#756656]">
              Give your team one connected system for managing the everyday
              operations of your jewellery business.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

              <a
                href="/register"
                className="
                  group
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#c18a00]
                  px-7 py-3.5
                  text-sm font-bold
                  text-white
                  shadow-lg
                  shadow-[#b98200]/20
                  transition
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-[#aa7700]
                "
              >
                Get Started

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>

              <a
                href="/contact"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  border border-[#d7c5a6]
                  bg-[#fffdf9]
                  px-7 py-3.5
                  text-sm font-bold
                  text-[#4b3827]
                  transition
                  duration-300
                  hover:-translate-y-0.5
                  hover:border-[#c18a00]
                  hover:bg-[#faf3e2]
                "
              >
                Talk to Us
              </a>

            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};


/* ============================================================
   FEATURE CARD
============================================================ */

const FeatureCard = ({ number, icon, title, text }) => {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border border-[#e4d8c6]
        bg-[#fffdf9]
        p-6
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-[#d4b978]
        hover:shadow-xl
        hover:shadow-[#70521d]/8
      "
    >

      {/* Small decorative circle */}
      <div
        className="
          pointer-events-none
          absolute
          -right-8
          -top-8
          h-24
          w-24
          rounded-full
          border border-[#c18a00]/8
          transition
          duration-500
          group-hover:scale-125
        "
      />

      {/* Top */}
      <div className="relative flex items-center justify-between">

        <div
          className="
            flex h-11 w-11
            items-center justify-center
            rounded-xl
            bg-[#f6edda]
            text-lg font-bold
            text-[#b98200]
            transition
            duration-300
            group-hover:bg-[#c18a00]
            group-hover:text-white
          "
        >
          {icon}
        </div>

        <span
          className="
            text-xs
            font-bold
            tracking-wider
            text-[#c49a4b]
          "
        >
          {number}
        </span>

      </div>

      {/* Title */}
      <h3 className="relative mt-7 text-lg font-bold text-[#34261b]">
        {title}
      </h3>

      {/* Description */}
      <p className="relative mt-3 text-sm leading-6 text-[#7d6d5c]">
        {text}
      </p>

      {/* Bottom accent */}
      <div
        className="
          relative
          mt-6
          h-px
          w-8
          bg-[#c18a00]
          transition-all
          duration-300
          group-hover:w-14
        "
      />

    </div>
  );
};

export default Features;