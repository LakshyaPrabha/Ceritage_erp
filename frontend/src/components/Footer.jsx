import React from "react";

const Footer = () => {
  return (
    <footer
      id="contact"
      className="border-t border-[#292940] bg-[#171729] text-white"
    >

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:py-20">

          {/* Brand */}
          <div className="lg:col-span-2">

            <a href="/" className="inline-flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#9b6f00] to-[#d49900] text-white font-serif font-bold text-xl">
                C
              </div>

              <div className="leading-none">

                <p className="text-lg font-bold tracking-tight">
                  Ceritage
                </p>

                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8d897f]">
                  Jewellery ERP
                </p>

              </div>

            </a>

            <p className="mt-6 max-w-md text-sm leading-7 text-[#aaa59c]">
              A complete business platform designed to help modern jewellery
              businesses manage their operations with clarity and confidence.
            </p>

            {/* Social */}
            <div className="mt-7 flex items-center gap-2">

              {["in", "X", "◎"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#37374b] text-xs font-bold text-[#aaa59c] transition hover:border-[#c18a00] hover:bg-[#c18a00] hover:text-white"
                >
                  {icon}
                </a>
              ))}

            </div>
          </div>

          {/* Product */}
          <div>

            <h3 className="text-sm font-bold text-white">
              Product
            </h3>

            <ul className="mt-5 space-y-3">

              <li>
                <a
                  href="/features"
                  className="text-sm text-[#aaa59c] transition hover:text-[#e0b74f]"
                >
                  Features
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-[#aaa59c] transition hover:text-[#e0b74f]"
                >
                  Dashboard
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-[#aaa59c] transition hover:text-[#e0b74f]"
                >
                  Pricing
                </a>
              </li>

            </ul>
          </div>

          {/* Company */}
          <div>

            <h3 className="text-sm font-bold text-white">
              Company
            </h3>

            <ul className="mt-5 space-y-3">

              <li>
                <a
                  href="/about"
                  className="text-sm text-[#aaa59c] transition hover:text-[#e0b74f]"
                >
                  About
                </a>
              </li>

              <li>
                <a
                  href="/contact"
                  className="text-sm text-[#aaa59c] transition hover:text-[#e0b74f]"
                >
                  Contact
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-[#aaa59c] transition hover:text-[#e0b74f]"
                >
                  Privacy
                </a>
              </li>

            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-4 border-t border-[#303044] py-6 text-xs text-[#858178] sm:flex-row sm:items-center sm:justify-between">

          <p>
            © 2026 Ceritage. All rights reserved.
          </p>

          <div className="flex gap-5">

            <a
              href="#"
              className="transition hover:text-[#d9ad48]"
            >
              Privacy Policy
            </a>

            <a
              href="#"
              className="transition hover:text-[#d9ad48]"
            >
              Terms of Service
            </a>

          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;