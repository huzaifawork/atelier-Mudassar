"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const socials = [
  { label: "Email", value: "mudassarg@gmail.com", href: "mailto:mudassarg@gmail.com" },
  { label: "Instagram", value: "@ateliermudassar", href: "https://instagram.com/ateliermudassar" },
  { label: "LinkedIn", value: "mudassar-ghaffar", href: "https://linkedin.com/in/mudassar-ghaffar" },
  { label: "YouTube", value: "@Mudassar81", href: "https://youtube.com/@Mudassar81" },
  { label: "Behance", value: "mudassarghaffar", href: "https://behance.net/mudassarghaffar" },
];

type Status = "idle" | "loading" | "success" | "error";

type FieldErrors = { name?: string; email?: string; message?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClasses =
  "w-full bg-ink/40 border rounded-sm px-4 py-3 text-porcelain text-base placeholder:text-cream-dim/30 focus:outline-none focus:ring-1 transition-colors";

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="h-4 w-4 rounded-full border-2 border-ink/30 border-t-ink"
    />
  );
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!email.trim()) next.email = "Please enter your email.";
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = "Please enter a valid email address.";
    if (!message.trim()) next.message = "Please add a short message.";
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setStatus("loading");
    setStatusMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, company }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setStatusMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setStatusMessage("Thank you — your message has been sent. I'll be in touch soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setStatusMessage("Something went wrong. Please check your connection and try again.");
    }
  }

  return (
    <section id="contact" className="relative bg-espresso pt-28 sm:pt-36 pb-14 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(205,163,95,0.10),transparent_55%)]" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <span className="text-copper text-xs tracking-[0.4em] uppercase">Let&rsquo;s Connect</span>
          <h2 className="font-display text-4xl sm:text-5xl text-porcelain mt-4 mb-3">Start a Conversation</h2>
          <p className="text-cream-dim/85 leading-relaxed">
            Have a project or idea in mind? Send a message below and I&rsquo;ll get back to you
            personally — I read and reply to every note.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          noValidate
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid sm:grid-cols-2 gap-x-6 gap-y-5 max-w-2xl mt-12"
        >
          {/* Honeypot field — hidden from real users, catches basic spam bots */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-xs tracking-[0.2em] uppercase text-cream-dim/60 mb-2">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={`${inputClasses} ${
                errors.name
                  ? "border-red-400/60 focus:ring-red-400/40"
                  : "border-gold/15 focus:border-gold focus:ring-gold/40"
              }`}
              placeholder="Your name"
            />
            {errors.name && (
              <p id="name-error" className="mt-1.5 text-xs text-red-300/90">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs tracking-[0.2em] uppercase text-cream-dim/60 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`${inputClasses} ${
                errors.email
                  ? "border-red-400/60 focus:ring-red-400/40"
                  : "border-gold/15 focus:border-gold focus:ring-gold/40"
              }`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p id="email-error" className="mt-1.5 text-xs text-red-300/90">
                {errors.email}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="message" className="block text-xs tracking-[0.2em] uppercase text-cream-dim/60 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
              className={`${inputClasses} resize-none ${
                errors.message
                  ? "border-red-400/60 focus:ring-red-400/40"
                  : "border-gold/15 focus:border-gold focus:ring-gold/40"
              }`}
              placeholder="Tell me a little about your project or idea…"
            />
            {errors.message && (
              <p id="message-error" className="mt-1.5 text-xs text-red-300/90">
                {errors.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-5 mt-2">
            <motion.button
              type="submit"
              disabled={status === "loading"}
              whileHover={status === "loading" ? undefined : { scale: 1.03 }}
              whileTap={status === "loading" ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="group relative isolate inline-flex items-center gap-3 overflow-hidden px-8 py-3.5 rounded-full bg-gold text-ink text-sm tracking-[0.15em] uppercase disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
              <span className="relative z-10">{status === "loading" ? "Sending" : "Send Message"}</span>
              <span className="relative z-10">
                {status === "loading" ? (
                  <Spinner />
                ) : (
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                )}
              </span>
            </motion.button>

            <p
              role="status"
              aria-live="polite"
              className={`text-sm ${
                status === "success"
                  ? "text-gold-bright"
                  : status === "error"
                    ? "text-red-300/90"
                    : "sr-only"
              }`}
            >
              {statusMessage}
            </p>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 pt-10 border-t border-gold/10"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="flex items-center gap-4">
              <Image src="/art/logo.png" alt="Atelier Mudassar crest" width={40} height={40} className="rounded-full opacity-80" />
              <div>
                <p className="font-display text-porcelain text-lg">Mudassar Ghaffar</p>
                <p className="font-accent italic text-gold-bright/80 text-sm">Founder · Atelier Mudassar</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.label !== "Email" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group flex flex-col"
                >
                  <span className="text-cream-dim/70 tracking-[0.2em] uppercase text-[11px]">{s.label}</span>
                  <span className="text-porcelain/90 text-sm group-hover:text-gold-bright transition-colors">
                    {s.value}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <p className="mt-10 pt-6 border-t border-gold/10 text-cream-dim/60 text-xs tracking-[0.15em] uppercase text-center">
            © {new Date().getFullYear()} Atelier Mudassar. All rights reserved.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
