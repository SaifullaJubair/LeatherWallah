/**
 * PaymentInitModal — F1a.
 *
 * Shown right after a successful order placement when `payment_init.kind` is
 * NOT "none". Handles:
 *
 *   kind="redirect"     — kicks the browser to payment_init.redirect_url
 *                         (SSLCommerz). Just shows a "redirecting…" notice.
 *   kind="instruction"  — shows the manual_mfs / bank_transfer instructions
 *                         + an inline trxId submission form that PATCHes
 *                         /payment/submit/:order_id with the buyer's trxId.
 *
 * Bank-transfer screenshot upload is deferred to F1b — for now the buyer
 * submits a trxId / reference, admin verifies, screenshot upload comes later.
 */

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { BASE_URL } from "@/components/utils/baseURL";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import { Button } from "@/components/ui/button";
import { FaCheckCircle, FaExternalLinkAlt } from "react-icons/fa";

const PaymentInitModal = ({ result, paymentMethod, onClose }) => {
  const router = useRouter();
  const init = result?.payment_init || { kind: "none" };
  const orderId = result?.order_id;
  const invoiceId = result?.invoice_id;

  const [trxId, setTrxId] = useState("");
  const [payerNumber, setPayerNumber] = useState("");
  const [methodName, setMethodName] = useState(""); // bKash / Nagad / ...
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // F1b — bank-transfer screenshot upload (optional but recommended).
  const [screenshot, setScreenshot] = useState(null);
  const isBank = paymentMethod === "bank_transfer";

  // ── kind="redirect" → kick browser to the gateway ──────────────────────
  useEffect(() => {
    if (init.kind === "redirect" && init.redirect_url) {
      // Tiny delay so the user can see what happened before they bounce.
      const t = setTimeout(() => {
        window.location.href = init.redirect_url;
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [init.kind, init.redirect_url]);

  const handleSubmitTrxId = async () => {
    if (!trxId.trim()) {
      toast.error("Transaction ID is required.");
      return;
    }
    setSubmitting(true);
    try {
      // F1b — bank_transfer + attached screenshot → multipart endpoint;
      // otherwise the regular JSON submit endpoint.
      let res;
      if (isBank && screenshot) {
        const fd = new FormData();
        fd.append("transaction_id", trxId.trim());
        if (methodName.trim()) fd.append("method_name", methodName.trim());
        if (payerNumber.trim()) fd.append("payer_number", payerNumber.trim());
        fd.append("screenshot", screenshot);
        res = await fetch(
          `${BASE_URL}/payment/submit-with-screenshot/${orderId}`,
          { method: "PATCH", credentials: "include", body: fd },
        );
      } else {
        res = await fetch(`${BASE_URL}/payment/submit/${orderId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_id: trxId.trim(),
            method_name: methodName.trim() || undefined,
            payer_number: payerNumber.trim() || undefined,
          }),
        });
      }
      const json = await res.json();
      if (json?.statusCode === 200 && json?.success === true) {
        toast.success(
          "Transaction submitted. Admin will verify shortly.",
          { autoClose: 2000 },
        );
        setSubmitted(true);
      } else {
        toast.error(json?.message || "Submit failed.");
      }
    } catch (e) {
      toast.error(e?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    onClose?.();
    router.push("/orders");
  };

  if (!init || init.kind === "none") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        {/* ── Redirect (SSLCommerz) ─────────────────────────────────── */}
        {init.kind === "redirect" && (
          <div className="p-6 text-center space-y-3">
            <div className="text-emerald-600">
              <FaCheckCircle size={40} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Order placed!</h3>
            <p className="text-sm text-gray-500">
              Invoice <span className="font-mono">{invoiceId}</span>. Redirecting
              you to the secure payment page…
            </p>
            <a
              href={init.redirect_url}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              Click here if you're not redirected automatically{" "}
              <FaExternalLinkAlt size={11} />
            </a>
          </div>
        )}

        {/* ── Instruction (manual_mfs / bank_transfer) ──────────────── */}
        {init.kind === "instruction" && (
          <div>
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="text-emerald-600">
                  <FaCheckCircle size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Order placed!
                  </h3>
                  <p className="text-xs text-gray-500">
                    Invoice <span className="font-mono">{invoiceId}</span> · Amount
                    due ৳{init?.manual_instruction?.amount_due ??
                      init?.bank_instruction?.amount_due ??
                      "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Manual MFS path */}
              {init.manual_instruction && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Send Money to one of these numbers
                  </p>
                  {init.manual_instruction.note && (
                    <p className="text-xs text-gray-600 mb-3">
                      {init.manual_instruction.note}
                    </p>
                  )}
                  <div className="space-y-2">
                    {(init.manual_instruction.methods || []).map((m, i) => (
                      <div
                        key={i}
                        className="bg-pink-50 border border-pink-100 rounded p-2.5 flex items-start justify-between"
                      >
                        <div>
                          <p className="font-semibold text-sm text-gray-800">
                            {m.name}
                          </p>
                          <p className="font-mono text-sm text-pink-700">
                            {m.number}
                          </p>
                          {m.instruction && (
                            <p className="text-[11px] text-gray-500 italic mt-0.5">
                              {m.instruction}
                            </p>
                          )}
                        </div>
                        {m.account_type && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">
                            {m.account_type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bank transfer path */}
              {init.bank_instruction && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Transfer to one of these bank accounts
                  </p>
                  {init.bank_instruction.note && (
                    <p className="text-xs text-gray-600 mb-3">
                      {init.bank_instruction.note}
                    </p>
                  )}
                  <div className="space-y-2">
                    {(init.bank_instruction.accounts || []).map((a, i) => (
                      <div
                        key={i}
                        className="bg-amber-50 border border-amber-100 rounded p-2.5 text-xs"
                      >
                        <p className="font-semibold text-sm text-gray-800">
                          {a.bank_name}
                          {a.branch && (
                            <span className="text-gray-400 font-normal">
                              {" "}
                              · {a.branch}
                            </span>
                          )}
                        </p>
                        <p className="text-gray-700">
                          <span className="text-gray-400">A/C name:</span>{" "}
                          {a.account_name}
                        </p>
                        <p className="text-gray-700 font-mono">
                          <span className="text-gray-400 font-sans">A/C #:</span>{" "}
                          {a.account_number}
                        </p>
                        {a.routing && (
                          <p className="text-gray-500 font-mono">
                            <span className="text-gray-400 font-sans">
                              Routing:
                            </span>{" "}
                            {a.routing}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-700 mt-2">
                    Upload the deposit slip screenshot below for faster admin
                    verification.
                  </p>
                </div>
              )}

              {/* Trx ID submission form */}
              {!submitted ? (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">
                    After sending the money, submit your details
                  </p>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Transaction ID
                      <span className="text-red-600"> *</span>
                    </label>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. 9X7Y2ABCDE"
                      className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Method used
                      </label>
                      <input
                        type="text"
                        value={methodName}
                        onChange={(e) => setMethodName(e.target.value)}
                        placeholder="bKash / Nagad / DBBL"
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Your sending number
                      </label>
                      <input
                        type="text"
                        value={payerNumber}
                        onChange={(e) => setPayerNumber(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  {/* F1b — bank-transfer screenshot upload */}
                  {isBank && (
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Deposit slip screenshot{" "}
                        <span className="text-gray-400">(recommended)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setScreenshot(e.target.files?.[0] || null)
                        }
                        className="mt-1 w-full text-xs file:cursor-pointer file:bg-primary file:text-white file:border-none file:rounded file:px-3 file:py-1.5 file:mr-3"
                      />
                      {screenshot && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          Selected: {screenshot.name} (
                          {(screenshot.size / 1024).toFixed(0)} KB)
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={handleDone} type="button">
                      I'll submit later
                    </Button>
                    {submitting ? (
                      <div className="px-6 py-2 flex items-center justify-center bg-primary text-white rounded">
                        <MiniSpinner />
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleSubmitTrxId}
                        className="px-6"
                      >
                        Submit Transaction ID
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4 text-center space-y-3">
                  <div className="text-emerald-600">
                    <FaCheckCircle size={32} className="mx-auto" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Submitted. Admin will verify shortly.
                  </p>
                  <Button onClick={handleDone} className="w-full">
                    Go to my orders
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Errored init (rare; gateway misconfigured) ────────────── */}
        {init.kind === "none" && init.error && (
          <div className="p-6 space-y-3">
            <h3 className="text-lg font-bold text-gray-800">Order placed</h3>
            <p className="text-sm text-red-600">
              Payment setup hiccup: {init.error}
            </p>
            <p className="text-xs text-gray-500">
              Your order was saved. Contact support with invoice{" "}
              <span className="font-mono">{invoiceId}</span>.
            </p>
            <Button onClick={handleDone} className="w-full">
              Go to my orders
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentInitModal;
