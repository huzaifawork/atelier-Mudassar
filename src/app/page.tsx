import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Statement from "./components/Statement";
import Gallery from "./components/Gallery";
import Process from "./components/Process";
import Contact from "./components/Contact";
import ScrollProgress from "./components/ScrollProgress";
import { GalleryProvider } from "./lib/galleryStore";
import { fetchGallery } from "./lib/galleryServer";

// Admin edits should show up on the next visit without a redeploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { items, settings } = await fetchGallery();

  return (
    <>
      <ScrollProgress />
      <div className="grain" />
      <Navbar />
      <Hero />
      <About />
      <Statement />
      <GalleryProvider initialItems={items} initialSettings={settings}>
        <Gallery />
      </GalleryProvider>
      <Process />
      <Contact />
    </>
  );
}
