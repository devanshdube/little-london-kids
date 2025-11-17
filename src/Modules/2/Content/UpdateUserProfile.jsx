// UpdateUserProfile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

const GET_USER_URL = "https://ngo-admin.doaguru.com/auth/api/ngo/get/getUser";
const UPDATE_USER_URL =
  "https://ngo-admin.doaguru.com/auth/api/ngo/login/updateUser";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function UpdateUserProfile() {
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.user?.currentUser);
  const token = useSelector((state) => state.user?.token);

  // form state
  const [name, setName] = useState("");
  const [fName, setFName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [dob, setDob] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");

  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false); // for update
  const [fetching, setFetching] = useState(false); // for GET
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const allowedDesignations = ["Admin", "Employee"];

  const makeAbsoluteUrl = (url) => {
    if (!url) return null;

    // already complete URL
    if (url.startsWith("http")) return url;

    // relative path case
    return `https://ngo-admin.doaguru.com/${url.replace(/^\//, "")}`;
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setFName(currentUser.f_name || "");
      setMobile(currentUser.mobile || "");
      setEmail(currentUser.email || "");
      setDesignation(currentUser.designation || "");
      setDob(currentUser.dob || "");
      setAadhar(currentUser.aadhar || "");
      setAddress(currentUser.address || "");
      setCity(currentUser.city || "");
      setStatus(currentUser.status || "");
    }
  }, [currentUser]);

  //   useEffect(() => {
  //     if (currentUser) {
  //       setName(currentUser.name || "");
  //       setFName(currentUser.f_name || "");
  //       setMobile(currentUser.mobile || "");
  //       setEmail(currentUser.email || "");
  //       setDesignation(currentUser.designation || "");
  //       setDob(currentUser.dob || "");
  //       setAadhar(currentUser.aadhar || "");
  //       setAddress(currentUser.address || "");
  //       setCity(currentUser.city || "");
  //       setStatus(currentUser.status || "");
  //       if (currentUser?.user_profile) {
  //         const abs = makeAbsoluteUrl(currentUser?.user_profile);
  //         console.log("prefill preview (from redux):", abs);
  //         setFilePreviewUrl(abs);
  //       } else {
  //         setFilePreviewUrl(null);
  //       }
  //     }
  //   }, [currentUser]);

  useEffect(() => {
    const id = currentUser?.id;
    if (!id) return;

    let cancelled = false;
    const fetchUser = async () => {
      setFetching(true);
      setError(null);

      try {
        const url = `${GET_USER_URL}/${id}`;
        const res = await axios.get(url, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          timeout: 20000,
        });

        if (!cancelled) {
          if (res?.data?.status === "Success" && res?.data?.data) {
            const u = res.data.data;
            setName(u.name || "");
            setFName(u.f_name || "");
            setMobile(u.mobile || "");
            setEmail(u.email || "");
            setDesignation(u.designation || "");
            setDob(u.dob || "");
            setAadhar(u.aadhar || "");
            setAddress(u.address || "");
            setCity(u.city || "");
            setStatus(u.status || "");
            setFile(null);
            // const abs = makeAbsoluteUrl(u.user_profile);
            const abs = makeAbsoluteUrl((u.user_profile || "").trim());

            console.log("fetched preview (from API):", abs);
            setFilePreviewUrl(abs);
          } else {
            const msg =
              res?.data?.message ||
              res?.data?.error ||
              "Unable to fetch user data from server.";
            setError(String(msg));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("fetchUser error:", err);
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Network or server error (GET user).";
          setError(String(msg));
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, token, dispatch]);

  const resetMessages = () => {
    setMessage(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    resetMessages();
    const f = e.target.files && e.target.files[0];
    console.log("selected file:", f);
    if (!f) {
      setFile(null);
      //   setFilePreviewUrl(
      //     currentUser?.user_profile
      //       ? makeAbsoluteUrl(currentUser.user_profile)
      //       : null
      //   );
      setFilePreviewUrl(null);

      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
      setError("Only JPG/PNG images are allowed for profile picture.");
      e.target.value = null;
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("Profile image must be less than 2 MB.");
      e.target.value = null;
      return;
    }

    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      console.log(
        "filereader onload result (truncated):",
        String(ev.target.result).slice(0, 80)
      );
      setFilePreviewUrl(ev.target.result); // data:image/...
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setFilePreviewUrl(null);
      setError("Unable to read the selected file for preview.");
    };
    reader.readAsDataURL(f);
  };

  const removeFile = () => {
    setFile(null);
    setFilePreviewUrl(null);
  };

  const validate = () => {
    if (!String(name || "").trim()) {
      setError("Name is required.");
      return false;
    }

    if (mobile) {
      const onlyDigits = String(mobile).replace(/\D/g, "");
      if (onlyDigits.length !== 10) {
        setError("Mobile must be 10 digits long (numbers only).");
        return false;
      }
    }

    if (aadhar) {
      const onlyDigits = String(aadhar).replace(/\D/g, "");
      if (onlyDigits.length !== 12) {
        setError("Aadhar must be 12 digits long (numbers only).");
        return false;
      }
    }

    if (designation && !allowedDesignations.includes(designation)) {
      setError("Designation must be Admin or Employee.");
      return false;
    }

    return true;
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    resetMessages();

    if (!validate()) return;
    if (!currentUser || !currentUser.id) {
      setError("User id missing in Redux store.");
      return;
    }

    const id = currentUser.id;
    const url = `${UPDATE_USER_URL}/${id}`;

    const fd = new FormData();
    fd.append("name", name);
    fd.append("f_name", fName || "");
    fd.append("mobile", mobile || "");
    fd.append("email", email || "");
    fd.append("designation", designation || "");
    fd.append("dob", dob || "");
    fd.append("aadhar", aadhar || "");
    fd.append("address", address || "");
    fd.append("city", city || "");
    fd.append("status", status || "");
    if (file) fd.append("user_profile", file);

    try {
      setLoading(true);
      const res = await axios.put(url, fd, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        timeout: 30000,
      });

      if (res?.data?.status === "Success" || res?.status === 200) {
        setMessage(res?.data?.message || "Profile updated successfully.");
      } else {
        const rmsg =
          res?.data?.message ||
          res?.data?.error ||
          "Unexpected server response.";
        setError(String(rmsg));
      }
    } catch (err) {
      console.error("UpdateUser error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Network or server error";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">Update User Profile</h2>

        {/* show fetching loader */}
        {fetching && (
          <div className="mb-3 text-sm text-gray-600">
            Loading latest user data...
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded bg-green-50 text-green-800 border border-green-100">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-800 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  resetMessages();
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Full name"
              />
            </div>

            {/* Father's name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father's Name
              </label>
              <input
                value={fName}
                onChange={(e) => {
                  setFName(e.target.value);
                  resetMessages();
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Father's name"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  if (onlyDigits.length <= 10) setMobile(onlyDigits);
                  resetMessages();
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="10 digit mobile"
              />
              <p className="text-xs text-gray-400 mt-1">
                Only numbers allowed (exactly 10 digits)
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  resetMessages();
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="email@example.com"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              <select
                disabled
                value={designation}
                onChange={(e) => {
                  setDesignation(e.target.value);
                  resetMessages();
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select --</option>
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
              </select>
            </div>

            {/* DOB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob || ""}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Aadhar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aadhar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                value={aadhar}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  if (onlyDigits.length <= 12) setAadhar(onlyDigits);
                  resetMessages();
                }}
                placeholder="12 digit Aadhar"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Only numbers allowed (exactly 12 digits)
              </p>
            </div>

            {/* Address full width */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  resetMessages();
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Address"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  resetMessages();
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <input
                readOnly
                value={status}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                placeholder="Active / Inactive (as used by API)"
              />
            </div>
          </div>

          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Image (optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="text-sm text-gray-600"
              />

              {filePreviewUrl ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-20 h-20 rounded border overflow-hidden flex items-center justify-center bg-white"
                    style={{ minWidth: 80, minHeight: 80 }}
                  >
                    <img
                      src={filePreviewUrl}
                      alt="profile preview"
                      className="object-cover w-full h-full"
                      onError={() =>
                        console.log("IMAGE FAILED:", filePreviewUrl)
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      removeFile();
                    }}
                    className="px-3 py-2 bg-red-400 text-white rounded"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No preview available
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Allowed: JPG, PNG. Max 2MB.
            </p>
          </div>

          {/* actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>

            <button
              type="button"
              onClick={() => {
                // reset to redux values
                if (currentUser) {
                  setName(currentUser.name || "");
                  setFName(currentUser.f_name || "");
                  setMobile(currentUser.mobile || "");
                  setEmail(currentUser.email || "");
                  setDesignation(currentUser.designation || "");
                  setDob(currentUser.dob || "");
                  setAadhar(currentUser.aadhar || "");
                  setAddress(currentUser.address || "");
                  setCity(currentUser.city || "");
                  setStatus(currentUser.status || "");
                  setFile(null);
                  setFilePreviewUrl(
                    currentUser.user_profile
                      ? makeAbsoluteUrl(currentUser.user_profile)
                      : null
                  );
                }
                resetMessages();
              }}
              className="px-3 py-2 border rounded text-sm"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
