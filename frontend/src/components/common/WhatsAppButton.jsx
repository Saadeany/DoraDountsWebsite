import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const WA_NUMBER = "201104678135"; // Update this to the real store WhatsApp number

const WhatsAppButton = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show tooltip after 3 seconds on first load
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (!sessionStorage.getItem("wa_tooltip_shown")) {
        setShowTooltip(true);
        sessionStorage.setItem("wa_tooltip_shown", "1");
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  const handleClick = () => {
    const message = encodeURIComponent(
      "Hi! I was browsing the Dora Donuts store and had a question."
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${message}`, "_blank", "noopener");
    setShowTooltip(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Tooltip bubble */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-paper border border-ink/10 shadow-lg px-4 py-3 max-w-[200px] rounded-lg"
          >
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute -right-1.5 -top-1.5 h-5 w-5 bg-charcoal text-paper rounded-full flex items-center justify-center"
              aria-label="Close"
            >
              <X size={10} />
            </button>
            <p className="text-xs font-medium text-ink">Chat with us 👋</p>
            <p className="text-[11px] text-charcoal/60 mt-0.5">
              Ask about sizing, delivery, or anything else.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        aria-label="Chat on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg hover:bg-[#20b858] transition-colors"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.16 8.16 0 00-.57-.01c-.198 0-.52.074-.792.372C7.75 9.44 6.71 10.16 6.71 11.62c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.534 5.857L0 24l6.335-1.518A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.574-.5-5.063-1.375L2.5 21.5l.906-4.313A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
      </motion.button>
    </div>
  );
};

export default WhatsAppButton;
