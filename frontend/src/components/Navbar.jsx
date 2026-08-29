import React, { useState } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e6dccb] bg-[#fffdf9]/95 backdrop-blur-xl">

      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

        {/* Logo */}
        <a href="/" className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c18a00] shadow-lg shadow-[#b98500]/20">
            <span className="text-xl">💎</span>
          </div>

          <div className="leading-none">
            <p className="text-[18px] font-bold tracking-tight text-[#33251a]">
              Ceritage
            </p>

            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9a8872]">
              Jewellery ERP
            </p>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-[#e5dac7] bg-[#f8f4ec] p-1 md:flex">

          <a
            href="/"
            className="rounded-full bg-[#fffdf9] px-5 py-2.5 text-sm font-semibold text-[#302218] shadow-sm"
          >
            Home
          </a>

          <a
            href="/features"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-[#796a59] transition hover:bg-[#fffdf9] hover:text-[#302218] hover:shadow-sm"
          >
            Features
          </a>

          <a
            href="/about"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-[#796a59] transition hover:bg-[#fffdf9] hover:text-[#302218] hover:shadow-sm"
          >
            About
          </a>

          <a
            href="/contact"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-[#796a59] transition hover:bg-[#fffdf9] hover:text-[#302218] hover:shadow-sm"
          >
            Contact
          </a>

        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-4 md:flex">

          <a
            href="/login"
            className="text-sm font-semibold text-[#665646] transition hover:text-[#b17d00]"
          >
            Sign in
          </a>

          <a
            href="/register"
            className="group flex items-center gap-2 rounded-xl bg-[#b98200] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#b98200]/20 transition hover:-translate-y-0.5 hover:bg-[#a87300]"
          >
            Get Started

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>

        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfd3c1] bg-[#fffdf9] md:hidden"
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-5 bg-[#392a1d] transition ${
                menuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />

            <span
              className={`block h-0.5 w-5 bg-[#392a1d] transition ${
                menuOpen ? "opacity-0" : ""
              }`}
            />

            <span
              className={`block h-0.5 w-5 bg-[#392a1d] transition ${
                menuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-[#e6dccb] bg-[#fffdf9] px-5 py-5 md:hidden">

          <nav className="flex flex-col gap-1">

            <a
              href="/"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-[#f5f0e7] px-4 py-3 text-sm font-semibold text-[#302218]"
            >
              Home
            </a>

            <a
              href="/features"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm text-[#665646] hover:bg-[#f5f0e7]"
            >
              Features
            </a>

            <a
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm text-[#665646] hover:bg-[#f5f0e7]"
            >
              About
            </a>

            <a
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm text-[#665646] hover:bg-[#f5f0e7]"
            >
              Contact
            </a>

          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#e6dccb] pt-4">

            <a
              href="/login"
              className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-[#665646] hover:bg-[#f5f0e7]"
            >
              Sign in
            </a>

            <a
              href="/register"
              className="rounded-xl bg-[#b98200] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Get Started →
            </a>

          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;