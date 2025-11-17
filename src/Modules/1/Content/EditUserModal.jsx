import React, { useState, useEffect } from "react";
import { X, User, Users, Camera } from "lucide-react";
import axios from "axios";

const UPDATE_URL_BASE =
  "https://ngo-admin.doaguru.com/auth/api/ngo/login/updateUser";

const EditUserModal = ({ user, onClose, onUpdated }) => {
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
    status: "",
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        f_name: user.f_name || "",
        mobile: user.mobile || "",
        email: user.email || "",
        designation: user.designation || "",
        dob: user.dob || "",
        aadhar: user.aadhar || "",
        address: user.address || "",
        city: user.city || "",
        status: user.status || "active",
      });
      if (user.user_profile) setPreviewUrl(user.user_profile);
    }
  }, [user]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  // Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!form.name || !form.email || !form.designation) {
      setErrorMsg("Name, Email, and Designation are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== undefined && val !== null) fd.append(key, val);
      });
      if (file) fd.append("user_profile", file);

      const res = await axios.put(`${UPDATE_URL_BASE}/${user.id}`, fd);
      if (res?.data?.status === "Success") {
        setSuccessMsg("User updated successfully");
        setTimeout(() => onUpdated && onUpdated(), 800);
      } else {
        setErrorMsg(res?.data?.message || "Update failed");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        onClick={onClose}
        style={{ backgroundColor: "rgba(14, 23, 38, 0.7)" }}
      />

      {/* Modal */}
      <div
        className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div
          className="relative px-6 py-5 border-b border-gray-200"
          style={{ backgroundColor: "#805dca" }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#6385b8] bg-opacity-20">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Edit User</h3>
                <p className="text-sm text-purple-100">
                  Update user details and status
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Profile Image Top Center */}
        <div className="flex flex-col items-center justify-center -mt-10 mb-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={50} className="text-gray-400" />
              )}
            </div>
            <label
              htmlFor="profile-upload"
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera size={24} className="text-white" />
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Click image to upload new profile
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-gray-50 max-h-[70vh] overflow-y-auto"
        >
          {errorMsg && (
            <div className="mb-3 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-3 text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded">
              ✅ {successMsg}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Full Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Father / Guardian Name
              </label>
              <input
                name="f_name"
                value={form.f_name}
                onChange={handleChange}
                placeholder="Enter father/guardian name"
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Email *
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="Enter email address"
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Mobile Number
              </label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    mobile: e.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                  }))
                }
                placeholder="Enter 10-digit mobile number"
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Designation *
              </label>
              <select
                name="designation"
                value={form.designation}
                onChange={handleChange}
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full bg-white"
              >
                <option value="">Select Designation</option>
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Block</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Date of Birth
              </label>
              <input
                name="dob"
                value={form.dob}
                onChange={handleChange}
                type="date"
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Aadhar Number
              </label>
              <input
                name="aadhar"
                value={form.aadhar}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    aadhar: e.target.value.replace(/[^0-9]/g, "").slice(0, 12),
                  }))
                }
                placeholder="Enter 12-digit Aadhar number"
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                City
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter city"
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Address
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter address"
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-full"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2"
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
                  Updating...
                </>
              ) : (
                <>
                  <User size={18} />
                  Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
