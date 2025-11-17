import React, { useState } from "react";
import { X, User, Upload, Users } from "lucide-react";
import axios from "axios";

const API_URL = "https://ngo-admin.doaguru.com/auth/api/ngo/login/register";

const AddUserModal = ({ onClose, onUserAdded }) => {
  const [form, setForm] = useState({
    name: "",
    f_name: "",
    mobile: "",
    email: "",
    designation: "",
    dob: "",
    aadhar: "",
    address: "",
    city: "",
    password: "",
  });

  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // handle file upload
  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(f);
  };

  // validation
  const validate = () => {
    if (!form.name?.trim()) return "Name is required";
    if (!form.email?.trim()) return "Email is required";
    if (!form.designation?.trim()) return "Designation is required";
    if (!form.password) return "Password is required";
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

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("f_name", form.f_name || "");
      fd.append("mobile", form.mobile || "");
      fd.append("email", form.email);
      fd.append("designation", form.designation);
      fd.append("dob", form.dob || "");
      fd.append("aadhar", form.aadhar || "");
      fd.append("address", form.address || "");
      fd.append("city", form.city || "");
      fd.append("password", form.password);

      if (file) {
        fd.append("user_profile", file);
      }

      // DON'T manually set Content-Type
      const res = await axios.post(API_URL, fd, {
        timeout: 20000,
      });

      if (res?.data?.status === "Success") {
        setSuccessMsg("User added successfully");
        setTimeout(() => {
          onUserAdded && onUserAdded();
        }, 800);
      } else {
        setErrorMsg(res?.data?.message || "Unexpected response from server");
      }
    } catch (err) {
      console.error("Add user error:", err);
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
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full Name *"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    autoComplete="name"
                  />
                </div>

                {/* Father / Guardian Name */}
                <div>
                  <input
                    name="f_name"
                    value={form.f_name}
                    onChange={handleChange}
                    placeholder="Father / Guardian Name"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    autoComplete="organization"
                  />
                </div>

                {/* DOB */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block pl-1">
                    Date of Birth
                  </label>
                  <input
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                  />
                </div>

                {/* Aadhar */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block pl-1">
                    Aadhar Number
                  </label>
                  <input
                    name="aadhar"
                    value={form.aadhar}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setForm((prev) => ({ ...prev, aadhar: value }));
                    }}
                    placeholder="Aadhar Number"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    inputMode="numeric"
                    minLength={12}
                    maxLength={12}
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4
                className="text-sm font-semibold uppercase tracking-wide mb-3 text-gray-700"
                style={{ color: "#805dca" }}
              >
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email Address *"
                    type="email"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setForm((prev) => ({ ...prev, mobile: value }));
                    }}
                    placeholder="Mobile Number"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    inputMode="numeric"
                    minLength={10}
                    maxLength={10}
                  />
                </div>

                {/* Address */}
                <div>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Address"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                  />
                </div>

                {/* City */}
                <div>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Professional */}
            <div>
              <h4
                className="text-sm font-semibold uppercase tracking-wide mb-3 text-gray-700"
                style={{ color: "#805dca" }}
              >
                Professional Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Designation */}
                <div>
                  <select
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                  >
                    <option value="">Select Designation *</option>
                    <option value="Admin">Admin</option>
                    <option value="Employee">Team</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password *"
                    type="password"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* File upload */}
            <div>
              <h4
                className="text-sm font-semibold uppercase tracking-wide mb-3 text-gray-700"
                style={{ color: "#805dca" }}
              >
                Profile Image
              </h4>
              <div className="relative">
                <div className="flex items-center gap-3 p-4 rounded-lg border transition-colors bg-white border-gray-200 hover:border-purple-400">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Upload size={20} style={{ color: "#805dca" }} />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-sm text-gray-600"
                    />
                    {file && (
                      <p className="text-xs text-green-500 mt-1">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
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
                  Creating Account...
                </>
              ) : (
                <>
                  <User size={18} />
                  Create Account
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
