import React, { useState } from "react";
import { X, User, Upload, Users } from "lucide-react";
import axios from "axios";

const API_URL =
  "https://kidschool.futurekidfoundation.org/auth/api/ngo/post/postSchoolNoticeData";

const AddUserModal = ({ onClose, onUserAdded }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // validation
  const validate = () => {
    if (!form.title?.trim()) return "Title is required";
    if (!form.description?.trim()) return "Description is required";
    return null;
  };

  // submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const v = validate();
    if (v) {
      setErrorMsg(v);
      return;
    }

    try {
      setIsSubmitting(true);

      // SEND JSON INSTEAD OF FORMDATA
      const res = await axios.post(
        API_URL,
        {
          title: form.title,
          description: form.description,
        },
        {
          timeout: 20000,
        }
      );

      if (res?.data?.status === "Success") {
        setSuccessMsg("Notice added successfully");
        setTimeout(() => {
          onUserAdded && onUserAdded();
        }, 800);
      } else {
        setErrorMsg(res?.data?.message || "Unexpected response from server");
      }
    } catch (err) {
      console.error("Add notice error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Network or server error";
      setErrorMsg(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        onClick={() => onClose && onClose()}
        style={{ zIndex: 9998, backgroundColor: "rgba(14, 23, 38, 0.7)" }}
      />

      {/* Modal Body */}
      <div
        className="relative w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden bg-white"
        style={{ zIndex: 9999 }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-6 py-5 border-b border-gray-200"
          style={{ backgroundColor: "#805dca" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#6385b8] bg-opacity-20">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add New User</h3>
                <p className="text-sm text-purple-100">
                  Fill in the details to create a new account
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose && onClose()}
              className="p-2 rounded-lg transition-colors text-white hover:bg-[#6385b8] hover:bg-opacity-20"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 max-h-[70vh] overflow-y-auto bg-gray-50"
        >
          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 px-4 py-3 rounded-lg flex items-start gap-3 bg-red-50 border border-red-200 text-red-700">
              <span className="text-lg">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 px-4 py-3 rounded-lg flex items-start gap-3 bg-green-50 border border-green-200 text-green-700">
              <span className="text-lg">✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sections */}
          <div className="space-y-6">
            {/* Personal */}
            <div>
              <h4
                className="text-sm font-semibold uppercase tracking-wide mb-3 text-gray-700"
                style={{ color: "#805dca" }}
              >
                Notice Information
              </h4>
              <div className="flex flex-col gap-4">
                {/* Title */}
                <div>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Title *"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    autoComplete="title"
                  />
                </div>

                {/* Description - Bigger Box */}
                <div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter Your Notice Description..."
                    rows={6} // height increased
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700 resize-none"
                    autoComplete="description"
                  />
                </div>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Title *"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    autoComplete="title"
                  />
                </div>

                <div>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter Your Notice Description..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    autoComplete="description"
                  />
                </div>
              </div> */}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose && onClose()}
              className="px-6 py-2.5 rounded-lg font-medium transition-all text-gray-700 hover:bg-gray-200 bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
              style={{ backgroundColor: "#805dca" }}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Creating Notice...
                </>
              ) : (
                <>
                  <User size={18} />
                  Create Notice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
