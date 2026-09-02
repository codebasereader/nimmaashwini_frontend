import { useEffect, useRef, useState } from "react";
import { isValidIndianPincode, lookupPincode } from "../lib/pincodeLookup";

/**
 * Autofill city / district / state when a valid Indian pincode is entered.
 *
 * @param {object} options
 * @param {string} options.pincode
 * @param {(result: { city: string, district: string, state: string }) => void} options.onResolved
 * @param {boolean} [options.enabled=true]
 * @param {number} [options.debounceMs=300]
 */
export function usePincodeAutofill({
  pincode,
  onResolved,
  enabled = true,
  debounceMs = 300,
}) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const onResolvedRef = useRef(onResolved);
  const lastResolvedPinRef = useRef("");

  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setMessage("");
      return undefined;
    }

    const pin = String(pincode || "").trim();

    if (!isValidIndianPincode(pin)) {
      lastResolvedPinRef.current = "";
      setStatus("idle");
      setMessage("");
      return undefined;
    }

    if (pin === lastResolvedPinRef.current) {
      return undefined;
    }

    let cancelled = false;
    setStatus("loading");
    setMessage("Looking up…");

    const timer = window.setTimeout(async () => {
      try {
        const result = await lookupPincode(pin);
        if (cancelled) return;
        lastResolvedPinRef.current = pin;
        onResolvedRef.current?.({
          city: result.city,
          district: result.district,
          state: result.state,
        });
        setStatus("success");
        setMessage("City, district & state filled");
      } catch (error) {
        if (cancelled) return;
        lastResolvedPinRef.current = "";
        setStatus("error");
        setMessage(error.message || "Pincode not found");
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pincode, enabled, debounceMs]);

  return { status, message };
}
