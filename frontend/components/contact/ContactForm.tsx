"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

const ENQUIRY_TYPES = [
  "Order & Shipping",
  "Product Question",
  "Brewing Help",
  "Wholesale & Partnerships",
  "Feedback",
  "Something Else",
];

function MatessaSelect({
  value,
  onChange,
  options,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-[14px] border-[1.5px] bg-white/10 px-4 py-3.5 text-left font-body text-[15.5px] outline-none transition-all duration-250 ${
          hasError ? "border-[#F26323]" : "border-white/20 hover:border-white/40 focus:border-[#EADBA2] focus:shadow-[0_0_0_4px_rgba(234,219,162,0.16)]"
        }`}
      >
        <span className={`${value ? "text-[#F9F7F3] font-semibold" : "text-white/45 font-medium"}`}>
          {value || placeholder}
        </span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#EADBA2" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`flex-none transition-transform duration-250 ${open ? "rotate-180" : "rotate-0"}`}
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>
      
      {open && (
        <div className="absolute z-30 top-[calc(100%+8px)] left-0 right-0 flex flex-col gap-[2px] rounded-[14px] border-[1.5px] border-[#E2E0D8] bg-[#F9F7F3] p-1.5 shadow-[0_18px_44px_rgba(47,59,40,0.22)]">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="rounded-[10px] px-3.5 py-3 text-left font-body text-[15px] font-semibold text-[#2F3B28] transition-colors duration-200 hover:bg-[#EADBA2]"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [queryType, setQueryType] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [enquiryError, setEnquiryError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryType) {
      setEnquiryError(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // actually persist the query so it reaches the admin inbox (POST /api/contact)
      await api.contact.submit({ email: email.trim(), queryType, message: message.trim() });
      setSent(true);
    } catch {
      setError("Couldn't send your message — please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const labelClass = "font-body text-[13px] font-bold uppercase tracking-[0.08em] text-[#EADBA2]";
  const fieldClass = "w-full rounded-[14px] border-[1.5px] border-white/20 bg-white/10 px-4 py-3.5 font-body text-[15.5px] font-semibold text-[#F9F7F3] outline-none transition-all duration-250 placeholder:font-medium placeholder:text-white/45 hover:border-white/40 focus:border-[#EADBA2] focus:shadow-[0_0_0_4px_rgba(234,219,162,0.16)]";

  return (
    <div className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[2rem] bg-[#2F3B28] shadow-[0_24px_60px_rgba(47,59,40,0.14)]">
      
      {/* HEADER SECTION */}
      <div className="relative border-b-[1.5px] border-white/10 bg-[#28311F] px-[clamp(22px,5vw,48px)] py-[clamp(38px,6vw,56px)] text-center">
        
        {/* PATTERN LAYER */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-center" 
          style={{
            /* 1. FIXED PATH: Changed back to /brand/ to match your Next.js public folder */
            backgroundImage: "url('/brand/matessa-pattern.webp')",
            backgroundSize: "clamp(420px, 60vw, 640px) auto",
            opacity: 0.45,
            
            /* 2. If the pattern STILL doesn't show, delete the next two lines... */
            mixBlendMode: "screen",
            filter: "grayscale(1) invert(1) brightness(2.1) sepia(0.55) saturate(1.4)"
          }}
        />
        
        {/* FADE GRADIENT */}
        <div 
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(47,59,40,0) 35%, rgba(47,59,40,0.88) 100%)" }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="font-heading text-[clamp(26px,4vw,36px)] font-bold leading-[1.3] text-[#F9F7F3]">
            Get in Touch with<br />Matessa Team
          </h1>
        </div>
      </div>

      {/* FORM SECTION */}
      {!sent ? (
        <form onSubmit={submit} className="flex flex-col gap-[22px] px-[clamp(22px,5vw,48px)] py-[clamp(26px,4.5vw,44px)]">
          <div className="flex flex-col gap-2">
            <label htmlFor="cemail" className={labelClass}>
              Email
            </label>
            <input 
              id="cemail" 
              name="email"
              className={fieldClass} 
              type="email" 
              required
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Enquiry type</span>
            <MatessaSelect 
              value={queryType} 
              onChange={(val) => {
                setQueryType(val);
                setEnquiryError(false);
              }} 
              options={ENQUIRY_TYPES} 
              placeholder="Choose a topic…" 
              hasError={enquiryError}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="cmsg" className={labelClass}>
              Message
            </label>
            <textarea 
              id="cmsg" 
              name="message"
              className={`${fieldClass} min-h-[130px] resize-y leading-[1.6]`} 
              required
              rows={5} 
              placeholder="Tell us how we can help…" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
            />
          </div>
          
          {error && (
            <p role="alert" className="rounded-[12px] bg-[#F26323]/15 px-4 py-2.5 font-body text-[14px] font-semibold text-[#F9C6AE]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 w-full rounded-full bg-[#EADBA2] px-8 py-4 font-body text-[15.5px] font-bold text-[#2F3B28] transition-all duration-300 hover:-translate-y-[2px] hover:bg-[#F26323] hover:text-[#F9F7F3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send Message"}
          </button>
        </form>
      ) : (
        /* SUCCESS STATE */
        <div className="flex flex-col items-center gap-4 px-[clamp(22px,5vw,48px)] py-[clamp(44px,7vw,72px)] text-center">
          <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#EADBA2]/15 text-[#EADBA2]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
          </span>
          <h2 className="font-heading text-[clamp(24px,3.4vw,32px)] font-bold text-[#F9F7F3]">Message Sent</h2>
          <p className="max-w-[40ch] font-body text-[15.5px] font-medium leading-[1.7] text-[#F9F7F3]/80">
            Thank you for reaching out. We will get back to you at <strong className="text-[#F9F7F3]">{email}</strong> within 1–2 days.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-2 rounded-full border-[1.5px] border-[#EADBA2]/45 px-[26px] py-3 font-body text-[14.5px] font-bold text-[#EADBA2] transition-colors duration-300 hover:border-[#E85D1F] hover:text-[#E85D1F]"
          >
            Send Another Message
          </button>
        </div>
      )}
    </div>
  );
}