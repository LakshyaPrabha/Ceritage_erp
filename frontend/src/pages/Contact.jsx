import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
              -left-40 -top-40
              h-[500px] w-[500px]
              rounded-full
              border border-[#c18a00]/10
            "
          />

          <div
            className="
              pointer-events-none absolute
              -left-16 -top-16
              h-[340px] w-[340px]
              rounded-full
              border border-[#c18a00]/10
            "
          />

          <div
            className="
              pointer-events-none absolute
              -right-40 -bottom-48
              h-[480px] w-[480px]
              rounded-full
              border border-[#c18a00]/8
            "
          />

          <div
            className="
              pointer-events-none absolute
              right-[18%] top-[30%]
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
                Contact Ceritage
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
                Let&apos;s talk about your business.
              </h1>

              <p
                className="
                  mt-7 max-w-2xl
                  text-base leading-8
                  text-[#756656]
                  sm:text-lg
                "
              >
                Have a question about Ceritage, our platform or how it can
                support your jewellery business? Send us a message and
                we&apos;ll be happy to help.
              </p>

            </div>
          </div>
        </section>

        {/* =====================================================
            CONTACT SECTION
        ====================================================== */}

        <section
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
          {/* Subtle grid */}
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
              -right-40 top-16
              h-[420px] w-[420px]
              rounded-full
              border border-[#c18a00]/8
            "
          />

          <div
            className="
              pointer-events-none absolute
              -left-40 bottom-0
              h-[380px] w-[380px]
              rounded-full
              border border-[#c18a00]/7
            "
          />

          <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">

            {/* =================================================
                LEFT INFO
            ================================================== */}

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
                Get in touch
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
                We&apos;re here to help.
              </h2>

              <p
                className="
                  mt-5 max-w-md
                  text-sm leading-7
                  text-[#756656]
                  sm:text-base
                "
              >
                Tell us a little about what you are looking for and our team
                can help you understand the platform better.
              </p>

              {/* Contact information */}
              <div className="mt-8 space-y-4">

                <ContactInfo
                  icon="✉"
                  label="Email"
                  value="hello@ceritage.in"
                />

                <ContactInfo
                  icon="⌂"
                  label="Location"
                  value="Mumbai, India"
                />

                <ContactInfo
                  icon="◷"
                  label="Support"
                  value="Business hours support"
                />

              </div>

              {/* Small note */}
              <div
                className="
                  mt-6
                  rounded-2xl
                  border border-[#dfd1bb]
                  bg-[#fffdf9]
                  p-5
                  shadow-sm
                "
              >
                <div className="flex gap-3">

                  <div
                    className="
                      flex h-9 w-9 shrink-0
                      items-center justify-center
                      rounded-lg
                      bg-[#f6edda]
                      text-sm
                      font-bold
                      text-[#b98200]
                    "
                  >
                    ✦
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#4b3827]">
                      Let&apos;s build better workflows.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#81715f]">
                      Whether you are exploring Ceritage or already planning
                      your setup, we&apos;re happy to talk.
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* =================================================
                FORM
            ================================================== */}

            <div
              className="
                relative
                overflow-hidden
                rounded-[28px]
                border border-[#dfd1bb]
                bg-[#fffdf9]
                p-6
                shadow-xl
                shadow-[#70521d]/8
                sm:p-8
              "
            >
              {/* Form decoration */}
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
                  pointer-events-none absolute
                  -bottom-20 -left-20
                  h-48 w-48
                  rounded-full
                  bg-[#c18a00]/5
                  blur-3xl
                "
              />

              {submitted ? (
                <SuccessMessage onReset={() => setSubmitted(false)} />
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="relative z-10"
                >

                  {/* Form heading */}
                  <div className="mb-7">
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.2em]
                        text-[#a87500]
                      "
                    >
                      Send a message
                    </p>

                    <h3
                      className="
                        mt-2
                        text-2xl font-bold
                        tracking-[-0.025em]
                        text-[#34261b]
                      "
                    >
                      How can we help?
                    </h3>

                    <p className="mt-2 text-sm text-[#81715f]">
                      Fill in the details below and our team will get back
                      to you.
                    </p>
                  </div>

                  {/* Name + Email */}
                  <div className="grid gap-5 sm:grid-cols-2">

                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="Your name"
                      required
                    />

                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />

                  </div>

                  {/* Business */}
                  <div className="mt-5">
                    <Input
                      label="Business Name"
                      type="text"
                      placeholder="Your jewellery business"
                    />
                  </div>

                  {/* Message */}
                  <div className="mt-5">
                    <label
                      className="
                        text-xs
                        font-bold
                        text-[#514334]
                      "
                    >
                      Message
                    </label>

                    <textarea
                      required
                      rows={6}
                      placeholder="How can we help?"
                      className="
                        mt-2
                        w-full
                        resize-none
                        rounded-xl
                        border border-[#dfd2bf]
                        bg-[#fffdf9]
                        px-4 py-3
                        text-sm
                        text-[#34261b]
                        outline-none
                        transition
                        placeholder:text-[#b5a798]
                        focus:border-[#c18a00]
                        focus:ring-4
                        focus:ring-[#c18a00]/10
                      "
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="
                      group
                      mt-6
                      inline-flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[#c18a00]
                      px-6 py-3.5
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
                    Send Message

                    <span
                      className="
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    >
                      →
                    </span>
                  </button>

                </form>
              )}
            </div>

          </div>
        </section>

        {/* =====================================================
            BOTTOM CTA
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

          <div className="relative mx-auto max-w-3xl text-center">

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
              See what Ceritage can do for your business.
            </h2>

            <p
              className="
                mx-auto mt-4
                max-w-xl
                text-sm leading-7
                text-[#756656]
              "
            >
              Explore the platform and discover a simpler way to manage your
              jewellery business.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

              <a
                href="/features"
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
                Explore Features

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>

              <a
                href="/register"
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
                Get Started
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
   INPUT
============================================================ */

const Input = ({
  label,
  type,
  placeholder,
  required = false,
}) => {
  return (
    <div>
      <label
        className="
          text-xs
          font-bold
          text-[#514334]
        "
      >
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        required={required}
        className="
          mt-2
          w-full
          rounded-xl
          border border-[#dfd2bf]
          bg-[#fffdf9]
          px-4 py-3
          text-sm
          text-[#34261b]
          outline-none
          transition
          placeholder:text-[#b5a798]
          focus:border-[#c18a00]
          focus:ring-4
          focus:ring-[#c18a00]/10
        "
      />
    </div>
  );
};


/* ============================================================
   CONTACT INFO
============================================================ */

const ContactInfo = ({
  icon,
  label,
  value,
}) => {
  return (
    <div
      className="
        group
        flex
        items-center
        gap-4
        rounded-2xl
        border border-[#dfd2bf]
        bg-[#fffdf9]
        p-4
        shadow-sm
        transition
        duration-300
        hover:-translate-y-0.5
        hover:border-[#d4b978]
        hover:shadow-md
      "
    >
      <div
        className="
          flex h-10 w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-[#f6edda]
          text-[#b98200]
          transition
          duration-300
          group-hover:bg-[#c18a00]
          group-hover:text-white
        "
      >
        {icon}
      </div>

      <div>
        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.16em]
            text-[#9a866f]
          "
        >
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-[#4b3827]">
          {value}
        </p>
      </div>
    </div>
  );
};


/* ============================================================
   SUCCESS MESSAGE
============================================================ */

const SuccessMessage = ({ onReset }) => {
  return (
    <div
      className="
        relative z-10
        flex min-h-[470px]
        flex-col
        items-center
        justify-center
        text-center
      "
    >
      <div
        className="
          flex h-16 w-16
          items-center
          justify-center
          rounded-2xl
          bg-[#f6edda]
          text-2xl
          font-bold
          text-[#b98200]
        "
      >
        ✓
      </div>

      <h3
        className="
          mt-6
          text-2xl font-bold
          text-[#34261b]
        "
      >
        Message received.
      </h3>

      <p
        className="
          mt-3
          max-w-sm
          text-sm leading-6
          text-[#756656]
        "
      >
        Thank you for reaching out. Our team will get back to you soon.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="
          mt-7
          rounded-xl
          border border-[#d7c5a6]
          bg-[#fffdf9]
          px-5 py-3
          text-sm font-bold
          text-[#4b3827]
          transition
          hover:border-[#c18a00]
          hover:bg-[#faf3e2]
        "
      >
        Send another message
      </button>
    </div>
  );
};

export default Contact;