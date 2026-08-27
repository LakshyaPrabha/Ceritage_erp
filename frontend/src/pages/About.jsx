import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const About = () => {
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
                About Ceritage
              </span>

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
                Technology built around the way jewellery businesses actually
                work.
              </h1>

              <p
                className="
                  mt-7 max-w-2xl
                  text-base leading-8
                  text-[#756656]
                  sm:text-lg
                "
              >
                Ceritage brings the essential parts of a jewellery business
                together in one connected platform — from customers and
                inventory to billing, purchases, repairs and business
                insights.
              </p>

            </div>
          </div>
        </section>

        {/* =====================================================
            STORY / APPROACH
        ====================================================== */}

        <section
          className="
            relative overflow-hidden
            border-y border-[#e2d7c5]
            bg-[#f3ecdf]
          "
        >
          {/* Grid background */}
          <div
            className="
              pointer-events-none absolute inset-0
              opacity-60
              bg-[linear-gradient(to_right,rgba(193,138,0,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(193,138,0,0.045)_1px,transparent_1px)]
              bg-[size:56px_56px]
            "
          />

          {/* Decorative circles */}
          <div
            className="
              pointer-events-none absolute
              -right-40 top-10
              h-[420px] w-[420px]
              rounded-full
              border border-[#c18a00]/8
            "
          />

          <div
            className="
              pointer-events-none absolute
              -left-40 bottom-0
              h-[400px] w-[400px]
              rounded-full
              border border-[#c18a00]/7
            "
          />

          <div
            className="
              relative z-10
              mx-auto grid max-w-7xl
              gap-14
              px-5 py-20
              sm:px-6
              lg:grid-cols-2
              lg:gap-20
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
                Our approach
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
                One platform. Less complexity.
              </h2>

              <p
                className="
                  mt-6
                  text-sm leading-7
                  text-[#756656]
                  sm:text-base
                "
              >
                Jewellery businesses manage a unique combination of products,
                customers, precious metals, transactions and workshop
                operations. When these workflows live in disconnected systems,
                everyday work becomes harder than it needs to be.
              </p>

              <p
                className="
                  mt-5
                  text-sm leading-7
                  text-[#756656]
                  sm:text-base
                "
              >
                Ceritage is designed to bring those workflows together so
                teams can work with better visibility, cleaner processes and
                fewer disconnected tools.
              </p>

              {/* Small stats */}
              <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
                <div
                  className="
                    rounded-2xl
                    border border-[#dfd1bb]
                    bg-[#fffdf9]
                    p-5
                    shadow-sm
                  "
                >
                  <p className="text-2xl font-bold text-[#b98200]">01</p>

                  <p className="mt-1 text-xs font-semibold text-[#584533]">
                    Connected Platform
                  </p>
                </div>

                <div
                  className="
                    rounded-2xl
                    border border-[#dfd1bb]
                    bg-[#fffdf9]
                    p-5
                    shadow-sm
                  "
                >
                  <p className="text-2xl font-bold text-[#b98200]">08+</p>

                  <p className="mt-1 text-xs font-semibold text-[#584533]">
                    Business Modules
                  </p>
                </div>
              </div>
            </div>

            {/* Right cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <AboutCard
                number="01"
                title="Connected"
                text="Keep important business operations connected instead of scattered across multiple systems."
              />

              <AboutCard
                number="02"
                title="Practical"
                text="Designed around everyday jewellery business workflows and operational needs."
              />

              <AboutCard
                number="03"
                title="Scalable"
                text="A platform that can support growing teams, products, customers and branches."
              />

              <AboutCard
                number="04"
                title="Insightful"
                text="Turn business activity into useful information for better decisions."
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            VALUES
        ====================================================== */}

        <section className="ceritage-bg relative overflow-hidden">
          {/* Decorative glow */}
          <div
            className="
              pointer-events-none absolute
              -right-40 -top-32
              h-96 w-96
              rounded-full
              bg-[#c18a00]/5
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none absolute
              -left-32 bottom-0
              h-80 w-80
              rounded-full
              border border-[#c18a00]/8
            "
          />

          <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">

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
                What matters to us
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
                Built with clarity at the centre.
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#7b6b5a]">
                Every part of Ceritage is designed around making business
                operations easier to understand, manage and grow.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <ValueCard
                icon="✦"
                title="Clarity"
                text="Make complex business information easier to understand and act on."
              />

              <ValueCard
                icon="◇"
                title="Trust"
                text="Give teams a dependable system for managing important business operations."
              />

              <ValueCard
                icon="↗"
                title="Growth"
                text="Create a stronger operational foundation for a growing jewellery business."
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            HOW CERITAGE CONNECTS
        ====================================================== */}

        <section className="bg-[#f3ecdf] px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">

            {/* Visual */}
            <div
              className="
                order-2
                rounded-[28px]
                border border-[#dfd1bb]
                bg-[#fffdf9]
                p-5
                shadow-xl
                shadow-[#70521d]/8
                lg:order-1
              "
            >
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  border border-[#e4d8c6]
                  bg-[#f8f2e6]
                  p-6
                "
              >
                {/* Circle */}
                <div
                  className="
                    pointer-events-none absolute
                    -right-12 -top-12
                    h-32 w-32
                    rounded-full
                    border border-[#c18a00]/10
                  "
                />

                <p className="relative text-xs font-bold text-[#4b3827]">
                  One connected business
                </p>

                <p className="relative mt-1 text-[10px] text-[#8a7864]">
                  Everything working together
                </p>

                <div className="relative mt-6 grid grid-cols-2 gap-3">
                  {[
                    "Customers",
                    "Inventory",
                    "Billing",
                    "Sales",
                    "Purchases",
                    "Repairs",
                  ].map((item) => (
                    <div
                      key={item}
                      className="
                        rounded-xl
                        border border-[#e2d4be]
                        bg-[#fffdf9]
                        px-4 py-4
                        text-sm font-semibold
                        text-[#4b3827]
                        shadow-sm
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

            {/* Text */}
            <div className="order-1 lg:order-2">
              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-[#a87500]
                "
              >
                Designed for the real world
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
                Less switching. More visibility.
              </h2>

              <p className="mt-6 text-sm leading-7 text-[#756656] sm:text-base">
                Your team should not have to search through different systems
                to understand what is happening in the business.
              </p>

              <p className="mt-5 text-sm leading-7 text-[#756656] sm:text-base">
                Ceritage brings your core workflows into one environment,
                helping your team move from customer interaction to operations
                with greater clarity.
              </p>

              <a
                href="/features"
                className="
                  group
                  mt-8
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border border-[#d7c5a6]
                  bg-[#fffdf9]
                  px-6 py-3
                  text-sm font-bold
                  text-[#4b3827]
                  shadow-sm
                  transition
                  duration-300
                  hover:-translate-y-0.5
                  hover:border-[#c18a00]
                  hover:bg-[#faf3e2]
                "
              >
                Explore Features

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* =====================================================
            CTA
        ====================================================== */}

        <section className="ceritage-bg relative overflow-hidden px-5 py-20 sm:px-6 lg:px-8 lg:py-24">

          <div
            className="
              pointer-events-none absolute
              -right-32 -top-32
              h-80 w-80
              rounded-full
              border border-[#c18a00]/10
            "
          />

          <div
            className="
              pointer-events-none absolute
              -left-24 bottom-0
              h-64 w-64
              rounded-full
              bg-[#c18a00]/5
              blur-3xl
            "
          />

          <div className="relative mx-auto max-w-4xl text-center">

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
              Explore Ceritage
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
              Ready for a better way to run your jewellery business?
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#756656]">
              Explore the platform or get in touch with our team to learn
              more.
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
                Contact Us
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
   ABOUT CARD
============================================================ */

const AboutCard = ({ number, title, text }) => {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border border-[#e2d5c1]
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
      <div
        className="
          pointer-events-none
          absolute
          -right-8 -top-8
          h-24 w-24
          rounded-full
          border border-[#c18a00]/8
          transition
          duration-500
          group-hover:scale-125
        "
      />

      <span className="relative text-xs font-bold tracking-wider text-[#b98200]">
        {number}
      </span>

      <h3 className="relative mt-5 text-lg font-bold text-[#34261b]">
        {title}
      </h3>

      <p className="relative mt-3 text-sm leading-6 text-[#7d6d5c]">
        {text}
      </p>

      <div
        className="
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


/* ============================================================
   VALUE CARD
============================================================ */

const ValueCard = ({ icon, title, text }) => {
  return (
    <div
      className="
        group
        rounded-2xl
        border border-[#e2d5c1]
        bg-[#fffdf9]
        p-7
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-[#d4b978]
        hover:shadow-xl
        hover:shadow-[#70521d]/8
      "
    >
      <div
        className="
          flex h-11 w-11
          items-center justify-center
          rounded-xl
          bg-[#f6edda]
          text-lg
          font-bold
          text-[#b98200]
          transition
          duration-300
          group-hover:bg-[#c18a00]
          group-hover:text-white
        "
      >
        {icon}
      </div>

      <h3 className="mt-6 text-lg font-bold text-[#34261b]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[#7d6d5c]">
        {text}
      </p>
    </div>
  );
};

export default About;