import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Statement from "./components/Statement";
import Gallery from "./components/Gallery";
import Process from "./components/Process";
import Contact from "./components/Contact";
import ScrollProgress from "./components/ScrollProgress";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <div className="grain" />
      <Navbar />
      <Hero />
      <About />
      <Statement />
      <Gallery />
      <Process />
      <Contact />
    </>
  );
}
