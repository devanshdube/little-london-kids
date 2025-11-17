import React, { useReducer, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock } from "lucide-react";
import SmartAlert from "../../Components/Alerts/SmartAlert";
import InputField from "../../Components/InputField";

const API_BASE = "http://localhost:5555";

const initialState = {
  email: "",
  otp: "",
  newPassword: "",
  showOtpModal: false,
  otpSent: false,
  loading: false,
  isLoadingReset: false,
  errors: {},
  alert: { type: "", message: "" },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_ERRORS":
      return { ...state, errors: action.errors || {} };

    case "SET_ALERT":
      return { ...state, alert: action.alert || { type: "", message: "" } };

    case "RESET_ALERT":
      return { ...state, alert: { type: "", message: "" } };

    case "TOGGLE_OTP_MODAL":
      return { ...state, showOtpModal: action.value };

    case "SET_LOADING":
      return { ...state, loading: action.value };

    case "SET_LOADING_RESET":
      return { ...state, isLoadingReset: action.value };

    case "OTP_SENT":
      return { ...state, otpSent: true, showOtpModal: true, loading: false };

    case "RESET_FORM":
      return { ...initialState };

    default:
      return state;
  }
}

const ForgotPassword = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const alertTimerRef = useRef(null);

  // helper to show alert for a short time (auto close)
  const showAlert = (type, message, autoClose = 4000) => {
    dispatch({ type: "SET_ALERT", alert: { type, message } });
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
    }
    if (autoClose) {
      alertTimerRef.current = setTimeout(() => {
        dispatch({ type: "RESET_ALERT" });
        alertTimerRef.current = null;
      }, autoClose);
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, []);

  const handleSendOtp = async (e) => {
    e?.preventDefault?.();

    if (!state.email || !state.email.trim()) {
      dispatch({
        type: "SET_ERRORS",
        errors: { email: "User ID is required" },
      });
      return;
    }

    dispatch({ type: "SET_LOADING", value: true });
    dispatch({ type: "SET_ERRORS", errors: {} });

    try {
      const url = `${API_BASE}/auth/api/ngo/login/forgotPassword`;
      console.log("POST", url, { email: state.email.trim() });

      const res = await axios.post(
        url,
        { email: state.email.trim() },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Send OTP response:", res.status, res.data);
      if (res?.data?.status === "Success") {
        showAlert(
          "success",
          res.data.message || "OTP sent (if account exists)."
        );
        dispatch({ type: "OTP_SENT" });
      } else {
        showAlert("error", res?.data?.message || "Unable to send OTP.");
      }
    } catch (err) {
      console.error("Send OTP error:", err);

      // Prefer server-provided message if available
      let friendly = "Error sending OTP. Try again.";
      if (err?.response) {
        const { status, data } = err.response;
        console.error("Server status:", status);
        console.error("Server data:", data);

        // If API returns JSON with message field
        if (data && typeof data === "object" && data.message) {
          friendly = data.message;
        } else if (typeof data === "string") {
          // server returned text/html or plaintext -> give hint
          if (status === 404) friendly = "Requested endpoint not found (404).";
          else if (status === 400)
            friendly = "Bad request (400). Check input values.";
          else friendly = `Server error: ${status}`;
        }
      } else if (err.request) {
        friendly = "No response from server. Check network or server.";
      } else {
        friendly = err.message || friendly;
      }

      showAlert("error", friendly);
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault?.();

    const errors = {};
    if (!state.otp.trim()) errors.otp = "OTP is required";
    if (!state.newPassword || state.newPassword.length < 6)
      errors.newPassword = "Password must be at least 6 characters";

    if (Object.keys(errors).length) {
      dispatch({ type: "SET_ERRORS", errors });
      return;
    }

    dispatch({ type: "SET_ERRORS", errors: {} });
    dispatch({ type: "SET_LOADING_RESET", value: true });

    try {
      const res = await axios.post(
        `${API_BASE}/auth/api/ngo/login/verifyOtpAndResetPassword`,
        {
          email: state.email.trim(),
          otp: state.otp.trim(),
          newPassword: state.newPassword,
        }
      );

      if (res?.data?.status === "Success") {
        showAlert("success", res.data.message || "Password reset successful");
        dispatch({ type: "TOGGLE_OTP_MODAL", value: false });
        setTimeout(() => navigate("/"), 900);
      } else {
        showAlert("error", res?.data?.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      const msg = err?.response?.data?.message || "Error resetting password";
      showAlert("error", msg);
    } finally {
      dispatch({ type: "SET_LOADING_RESET", value: false });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c18] flex items-center justify-center px-4 py-12">
      <SmartAlert
        alert={state.alert}
        onClose={() => dispatch({ type: "RESET_ALERT" })}
      />

      <div className="w-full max-w-md bg-[#0f1724] rounded-2xl shadow-lg p-6">
        <h2 className="text-center text-2xl font-semibold text-gray-100 mb-2">
          Forgot Your Password?
        </h2>
        <p className="text-center text-sm text-gray-400 mb-6">
          Enter your User ID to receive an OTP and reset your password.
        </p>

        <form onSubmit={handleSendOtp}>
          <InputField
            label="User ID"
            name="email"
            value={state.email}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "email",
                value: e.target.value,
              })
            }
            placeholder="Enter your User ID"
            required
            error={state.errors.email}
            icon={Mail}
          />

          <button
            type="submit"
            disabled={state.loading}
            className={`w-full py-3 rounded-md text-white font-medium transition ${
              state.loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {state.loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-400 hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>

      {/* OTP Modal (Tailwind) */}
      {state.showOtpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => dispatch({ type: "TOGGLE_OTP_MODAL", value: false })}
          />

          <div className="relative w-full max-w-lg mx-4">
            <div className="bg-[#0f1724] rounded-xl shadow-xl overflow-hidden">
              <div className="p-5 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-gray-100">
                  Enter OTP & New Password
                </h3>
              </div>

              <div className="p-5">
                {state.otpSent ? (
                  <form onSubmit={handleResetPassword}>
                    <InputField
                      label="OTP"
                      name="otp"
                      value={state.otp}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "otp",
                          value: e.target.value,
                        })
                      }
                      placeholder="Enter the OTP"
                      required
                      error={state.errors.otp}
                    />

                    <InputField
                      label="New Password"
                      name="newPassword"
                      value={state.newPassword}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "newPassword",
                          value: e.target.value,
                        })
                      }
                      placeholder="Enter new password"
                      type="password"
                      required
                      error={state.errors.newPassword}
                      icon={Lock}
                    />

                    <div className="flex gap-3 mt-4">
                      <button
                        type="submit"
                        disabled={state.isLoadingReset}
                        className={`flex-1 py-3 rounded-md text-white font-medium transition ${
                          state.isLoadingReset
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {state.isLoadingReset
                          ? "Resetting..."
                          : "Reset Password"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          dispatch({ type: "TOGGLE_OTP_MODAL", value: false })
                        }
                        className="flex-1 py-3 rounded-md text-gray-200 border border-gray-700 hover:bg-gray-800 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-gray-400">
                    OTP will be sent to the registered email if the account
                    exists.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
