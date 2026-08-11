"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Process() {
  return (
    <section id="process" className="relative bg-cream py-28 sm:py-36 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-copper text-xs tracking-[0.4em] uppercase">Behind the Work</span>
          <h2 className="font-display text-4xl sm:text-5xl text-charcoal mt-4">Painting Process</h2>
          <p className="text-charcoal/60 max-w-xl mx-auto mt-5 leading-relaxed">
            Each work is developed entirely by hand using a painterly digital approach inspired by
            traditional fine art practices — from initial sketch, to color block-in, to final refinement.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-sm overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] border border-charcoal/10 aspect-[16/8.3]"
        >
          <Image
            src="/art/process1.png"
            alt="Painting process: initial sketch, color block-in, and final rendering"
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>

        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-accent italic text-2xl sm:text-3xl text-charcoal text-center max-w-2xl mx-auto my-14 leading-snug"
        >
          &ldquo;Regardless of subject or style, this is how I build a painting.&rdquo;
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-sm overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] border border-charcoal/10 aspect-[16/8.8]"
        >
          <Image
            src="/art/process2.png"
            alt="Three examples of the painting process across different subjects"
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>
      </div>
    </section>
  );
}
