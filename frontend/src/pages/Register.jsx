import React, { useState } from "react";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[#fffdfb] text-[#281c21]">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="border-b border-[#eadfe1] bg-[#fffdfb]/90">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

          <a href="/" className="flex items-center gap-3.5">

            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#351d2a]">
              <span className="text-base font-bold text-white">
                C
              </span>
            </div>

            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-[#281c21]">
                Ceritage
              </p>

              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#9b858b]">
                Jewellery ERP
              </p>
            </div>

          </a>

          <a
            href="/login"
            className="text-sm font-medium text-[#75666c] transition hover:text-[#351d2a]"
          >
            Already have an account?
            <span className="ml-1 font-semibold text-[#9f6872]">
              Sign in
            </span>
          </a>

        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}
      <main className="relative overflow-hidden px-5 py-12 sm:py-16">

        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#f2dfe2] blur-3xl" />

        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#ead0d5]/30 blur-3xl" />

        <div className="relative mx-auto w-full max-w-2xl">

          {/* Heading */}
          <div className="text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6e9eb] text-[#9f6872]">
              ✦
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-[-0.035em] text-[#351d2a] sm:text-4xl">
              Create your Ceritage account
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#75666c]">
              Set up your workspace and bring your jewellery business
              operations together.
            </p>

          </div>

          {/* Form card */}
          <div className="mt-9 rounded-[28px] border border-[#eadfe1] bg-white p-6 shadow-xl shadow-[#351d2a]/5 sm:p-9">

            <form onSubmit={handleSubmit}>

              {/* Business details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a26f78]">
                  Business details
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">

                  <FormInput
                    label="Business Name"
                    placeholder="Your jewellery business"
                    required
                  />

                  <FormInput
                    label="Owner Name"
                    placeholder="Your full name"
                    required
                  />

                </div>
              </div>

              {/* Contact details */}
              <div className="mt-8 border-t border-[#eee3e5] pt-8">

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a26f78]">
                  Account details
                </p>

                <div className="mt-5">

                  <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />

                </div>

                <div className="mt-5">

                  <label className="text-xs font-semibold text-[#51434a]">
                    Password
                  </label>

                  <div className="relative mt-2">

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Create a secure password"
                      className="w-full rounded-xl border border-[#e2d5d8] bg-[#fffdfb] px-4 py-3.5 pr-20 text-sm text-[#351d2a] outline-none transition placeholder:text-[#b4a4a9] focus:border-[#c98791] focus:ring-4 focus:ring-[#c98791]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-xs font-semibold text-[#9b858b] hover:text-[#351d2a]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                </div>

              </div>

              {/* Business type */}
              <div className="mt-8 border-t border-[#eee3e5] pt-8">

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a26f78]">
                  Business profile
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">

                  <div>
                    <label className="text-xs font-semibold text-[#51434a]">
                      Business Type
                    </label>

                    <select
                      defaultValue=""
                      className="mt-2 w-full rounded-xl border border-[#e2d5d8] bg-[#fffdfb] px-4 py-3.5 text-sm text-[#351d2a] outline-none transition focus:border-[#c98791] focus:ring-4 focus:ring-[#c98791]/10"
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      <option value="retail">
                        Jewellery Retail
                      </option>
                      <option value="wholesale">
                        Jewellery Wholesale
                      </option>
                      <option value="manufacturing">
                        Manufacturing
                      </option>
                      <option value="mixed">
                        Retail & Wholesale
                      </option>
                    </select>
                  </div>

                  <FormInput
                    label="City"
                    placeholder="Mumbai"
                  />

                </div>

              </div>

              {/* Terms */}
              <label className="mt-7 flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-[#d8c7cb] accent-[#351d2a]"
                />

                <span className="text-xs leading-5 text-[#75666c]">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="font-semibold text-[#9f6872] hover:text-[#351d2a]"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="font-semibold text-[#9f6872] hover:text-[#351d2a]"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>

              </label>

              {/* Submit */}
              <button
                type="submit"
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#351d2a] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#351d2a]/10 transition hover:-translate-y-0.5 hover:bg-[#482536]"
              >
                Create Account
                <span>→</span>
              </button>

            </form>

          </div>

          <p className="mt-7 text-center text-[11px] text-[#a18c92]">
            Your Ceritage workspace starts here.
          </p>

        </div>
      </main>
    </div>
  );
};

const FormInput = ({
  label,
  type = "text",
  placeholder,
  required = false,
}) => {
  return (
    <div>
      <label className="text-xs font-semibold text-[#51434a]">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-[#e2d5d8] bg-[#fffdfb] px-4 py-3.5 text-sm text-[#351d2a] outline-none transition placeholder:text-[#b4a4a9] focus:border-[#c98791] focus:ring-4 focus:ring-[#c98791]/10"
      />
    </div>
  );
};

export default Register;