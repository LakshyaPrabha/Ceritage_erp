import React from "react";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Solutions from "../components/Solutions";
import WhyCeritage from "../components/WhyCeritage";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#f5f0e7] text-[#241c14]">
      <Navbar />

      <main>
        <Hero />
        <Solutions />
        <WhyCeritage />
        <CTA />
      </main>

      <Footer />
    </div>
  );
};

export default Home;