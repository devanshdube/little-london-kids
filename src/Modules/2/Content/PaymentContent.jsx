import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import SmartAlert from "../../../Components/Alerts/SmartAlert";
import { UploadCloud } from "lucide-react";
import QRCode from "./../../../assets/upi-qr.jpg";

const API_URL = "https://ngo-admin.doaguru.com/auth/api/ngo/post/postPayment";

const PaymentContent = () => {
  // form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI"); // "UPI" | "Cash" | "Net Banking"
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [bankTxnRef, setBankTxnRef] = useState("");
  const [txnId, setTxnId] = useState("");
  const [panNo, setPanNo] = useState("");
  const [remarks, setRemarks] = useState("");

  // file upload
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileRef = useRef(null);

  // UI
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submittedId, setSubmittedId] = useState(null);

  const showAlert = (type, message, autoClose = 4000) => {
    setAlert({ type, message });
    if (autoClose)
      setTimeout(() => setAlert({ type: "", message: "" }), autoClose);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setAmount("");
    setPaymentMethod("UPI");
    setBankName("");
    setBranchName("");
    setBankTxnRef("");
    setTxnId("");
    setPanNo("");
    setRemarks("");
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = null;
    setProgress(0);
    setUploading(false);
    setSubmittedId(null);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      showAlert("error", "Only image or PDF files allowed for screenshot.");
      return;
    }
    // limit 5MB
    if (f.size > 5 * 1024 * 1024) {
      showAlert("error", "File must be smaller than 5 MB.");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = null;
  };

  // validate before sending to API (per your rules)
  const validateBeforeSubmit = () => {
    if (!name.trim()) return "Name is required.";
    if (!phone.trim()) return "Phone is required.";
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) return "Enter a valid amount.";
    const pm = paymentMethod;

    if (pm === "Cash") {
      if (!panNo.trim()) return "PAN is required for Cash payments.";
      return null;
    }

    if (pm === "UPI") {
      if (!txnId.trim()) return "Transaction ID (txnId) is required for UPI.";
      if (!panNo.trim()) return "PAN is required for UPI.";
      if (!file) return "Please upload a screenshot/receipt for UPI.";
      return null;
    }

    if (pm === "Net Banking") {
      if (!bankName.trim() || !branchName.trim())
        return "Bank name & branch are required for Net Banking.";
      if (!panNo.trim()) return "PAN is required for Net Banking.";
      if (!file) return "Please upload a screenshot/receipt for Net Banking.";
      return null;
    }

    return "Invalid payment method.";
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const validationError = validateBeforeSubmit();
    if (validationError) {
      showAlert("error", validationError);
      return;
    }

    // build FormData for multipart
    const formData = new FormData();
    // append only fields that make sense for each payment method
    if (paymentMethod === "UPI") {
      formData.append("txnId", txnId.trim());
      formData.append("panNo", panNo.trim());
    }

    if (paymentMethod === "Net Banking") {
      formData.append("bankName", bankName.trim());
      formData.append("branchName", branchName.trim());
      formData.append("bankTxnRef", bankTxnRef.trim());
      formData.append("panNo", panNo.trim());
    }

    if (paymentMethod === "Cash") {
      formData.append("panNo", panNo.trim());
    }

    formData.append("name", name.trim());
    formData.append("phone", phone.trim());
    formData.append("amount", String(amount));
    formData.append("paymentMethod", paymentMethod);
    formData.append("remarks", remarks.trim());
    if (file) formData.append("screenshot", file);

    // formData.append("name", name.trim());
    // formData.append("phone", phone.trim());
    // formData.append("amount", String(amount));
    // formData.append("paymentMethod", paymentMethod);
    // formData.append("bankName", bankName.trim());
    // formData.append("branchName", branchName.trim());
    // formData.append("bankTxnRef", bankTxnRef.trim());
    // formData.append("txnId", txnId.trim());
    // formData.append("panNo", panNo.trim());
    // formData.append("remarks", remarks.trim());
    // if (file) formData.append("screenshot", file);

    try {
      setUploading(true);
      setProgress(0);

      const res = await axios.post(API_URL, formData, {
        // DO NOT set Content-Type manually for FormData
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.round((evt.loaded * 100) / evt.total);
            setProgress(pct);
          }
        },
        timeout: 60000,
      });

      if (res?.data?.status === "Success" || res?.status === 201) {
        showAlert("success", res.data?.message || "Payment recorded.");
        setSubmittedId(res.data?.insertedId || res.data?.inserted_id || null);
        setTimeout(() => resetForm(), 1700);
      } else {
        showAlert(
          "error",
          res.data?.error ||
            res.data?.message ||
            "Server error while saving payment."
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        "Network/server error.";
      showAlert("error", msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Static organization bank details (edit with your real info)
  const ORGANIZATION_BANK = {
    bankName: "State Bank of India",
    accountNo: "123456789012",
    ifsc: "SBIN0001234",
    branch: "Jabalpur Main Branch",
  };

  // auto-fill bankName & branchName when method is Net Banking
  useEffect(() => {
    if (paymentMethod === "Net Banking") {
      setBankName(ORGANIZATION_BANK.bankName);
      setBranchName(ORGANIZATION_BANK.branch);
    }
  }, [paymentMethod]);

  return (
    <div className="container mx-auto p-4">
      <SmartAlert
        alert={alert}
        onClose={() => setAlert({ type: "", message: "" })}
      />

      {/* Layout: left = form, right = QR + upload; stacked on small/medium, side-by-side on XL */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Record Payment</h3>

        {/* key change: only make two columns on XL screens */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT: form */}
          <div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="Payer name"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      // Allow only numbers
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setPhone(value);
                    }}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="Phone number"
                    required
                    minLength={10}
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Amount (INR)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="e.g. 1500.00"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full mt-1 p-2 border rounded bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              {/* conditional fields */}
              {paymentMethod === "UPI" && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Txn ID</label>
                    <input
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="UPI transaction id"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">PAN No</label>
                    <input
                      value={panNo}
                      onChange={(e) => setPanNo(e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="ABCDE1234F"
                      required
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "Cash" && (
                <div className="mt-4">
                  <label className="text-sm font-medium">PAN No</label>
                  <input
                    value={panNo}
                    onChange={(e) => setPanNo(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="PAN required for cash"
                    required
                  />
                </div>
              )}

              {paymentMethod === "Net Banking" && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Bank Name</label>
                    <input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="e.g. State Bank"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Branch Name</label>
                    <input
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="Branch"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">PAN No</label>
                    <input
                      value={panNo}
                      onChange={(e) => setPanNo(e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="PAN"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Bank Txn Ref (optional)
                    </label>
                    <input
                      value={bankTxnRef}
                      onChange={(e) => setBankTxnRef(e.target.value)}
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="Bank reference id (if any)"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="text-sm font-medium">
                  Remarks (optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                  rows={2}
                />
              </div>

              {/* file upload for screenshot (UPI/NetBanking required; Cash optional) */}
              <div className="mt-4">
                <label className="text-sm font-medium">
                  Upload Screenshot / Receipt
                </label>
                <div className="mt-2 border border-dashed rounded p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded">
                    <UploadCloud size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1 bg-purple-600 text-white rounded cursor-pointer">
                        Choose file
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>

                      {file && (
                        <button
                          type="button"
                          onClick={removeFile}
                          className="px-3 py-1 border rounded"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG/JPG/PDF up to 5MB. Required for UPI & Net Banking.
                    </p>

                    {filePreview && (
                      <div className="mt-2 flex items-center gap-3">
                        <img
                          src={filePreview}
                          alt="preview"
                          className="w-28 h-20 object-cover rounded border"
                        />
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {Math.round(file.size / 1024)} KB
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-4 py-2 rounded text-white font-medium ${
                    uploading
                      ? "bg-gray-400"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {uploading ? `Uploading ${progress}%` : "Submit Payment"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    showAlert("success", "Form cleared.");
                  }}
                  className="px-4 py-2 rounded border"
                >
                  Clear
                </button>
              </div>

              {submittedId && (
                <div className="mt-3 text-sm text-green-700">
                  Saved with id: {submittedId}
                </div>
              )}
            </form>
          </div>

          {/* RIGHT: QR image + small instructions */}
          <div className="flex flex-col items-stretch">
            <div className="bg-gray-50 p-4 rounded border">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Scan / Payment</h4>
                <div className="text-xs text-gray-500">
                  Method: {paymentMethod}
                </div>
              </div>

              {/* layout: stacked for small/medium, row for XL */}
              <div className="mt-3 flex flex-col xl:flex-row xl:items-start gap-4">
                {/* LEFT: QR or Bank card or placeholder */}
                <div className="flex-shrink-0 w-full xl:w-auto">
                  {paymentMethod === "UPI" ? (
                    <div className="mx-auto xl:mx-0 w-full max-w-[220px] xl:max-w-[320px]">
                      <img
                        src={QRCode}
                        alt="UPI QR"
                        className="w-full h-auto object-contain rounded border"
                      />
                    </div>
                  ) : paymentMethod === "Net Banking" ? (
                    <div className="w-full max-w-[320px] mx-auto xl:mx-0 bg-white rounded border p-4">
                      <h5 className="font-semibold mb-2 text-sm">
                        Bank Details
                      </h5>

                      <div className="text-sm text-gray-700 space-y-2">
                        <div>
                          <strong>Bank Name:</strong>{" "}
                          {ORGANIZATION_BANK.bankName}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          <div>
                            <strong>Account No.:</strong>{" "}
                            {ORGANIZATION_BANK.accountNo}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                ORGANIZATION_BANK.accountNo
                              );
                              showAlert(
                                "success",
                                "Account number copied to clipboard."
                              );
                            }}
                            className="mt-1 sm:mt-0 px-2 py-1 text-xs border rounded"
                          >
                            Copy
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          <div>
                            <strong>IFSC:</strong> {ORGANIZATION_BANK.ifsc}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                ORGANIZATION_BANK.ifsc
                              );
                              showAlert(
                                "success",
                                "IFSC code copied to clipboard."
                              );
                            }}
                            className="mt-1 sm:mt-0 px-2 py-1 text-xs border rounded"
                          >
                            Copy
                          </button>
                        </div>

                        <div>
                          <strong>Branch:</strong> {ORGANIZATION_BANK.branch}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-[320px] mx-auto xl:mx-0 h-40 flex items-center justify-center bg-white rounded border text-sm text-gray-500">
                      Cash payment (no QR)
                    </div>
                  )}
                </div>

                {/* RIGHT: instructions / actions */}
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">
                    {paymentMethod === "UPI" ? (
                      <>
                        Scan the QR (left) using any UPI app and complete the
                        payment for <strong>₹{amount || "0.00"}</strong>. After
                        payment, copy the transaction id and upload the payment
                        screenshot below.
                      </>
                    ) : paymentMethod === "Net Banking" ? (
                      <>
                        Make net-banking transfer using the bank details shown
                        on the left. Upload bank transaction screenshot and fill
                        bank reference.
                      </>
                    ) : (
                      <>Receive cash and record PAN & receipt details.</>
                    )}
                  </p>

                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Ensure amount matches before confirming.</li>
                    {paymentMethod === "UPI" && (
                      <li>Txn ID is required for UPI.</li>
                    )}
                    {paymentMethod === "Net Banking" && (
                      <li>
                        Include bank tx ref & upload transaction screenshot.
                      </li>
                    )}
                    <li>Screenshot is stored and used for verification.</li>
                  </ul>

                  {/* Quick actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {paymentMethod === "UPI" && (
                      <button
                        onClick={() => {
                          window.open(QRCode, "_blank");
                        }}
                        className="px-3 py-1 rounded border text-sm"
                      >
                        Open QR
                      </button>
                    )}

                    <button
                      onClick={() => {
                        showAlert(
                          "info",
                          "Remember to upload screenshot after paying."
                        );
                      }}
                      className="px-3 py-1 rounded border text-sm"
                    >
                      Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* On small/medium screens show the QR/bank preview area below the form too */}
            <div className="mt-4 xl:mt-6">
              <div className="text-xs text-gray-500">Preview / Notes</div>
              <div className="mt-2 text-sm text-gray-600">
                {paymentMethod === "UPI" ? (
                  <>
                    Tip: For UPI keep the payer app ready, scan the QR, confirm
                    amount, then take a screenshot and upload.
                  </>
                ) : paymentMethod === "Net Banking" ? (
                  <>
                    Tip: For Net Banking, confirm account & IFSC, then upload
                    bank transaction screenshot and enter bank reference.
                  </>
                ) : (
                  <>Tip: For cash payments, collect PAN & receipt details.</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentContent;
