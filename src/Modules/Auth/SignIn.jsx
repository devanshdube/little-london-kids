import React, { useState } from "react";
import { Mail, Lock } from "lucide-react";
import SignInputField from "../../Components/SignInputField";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import SuccessAlert from "../../Components/Alerts/SuccessAlert";
import ErrorAlert from "../../Components/Alerts/ErrorAlert";
import { setUser } from "../../Redux/user/userSlice";

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: "", message: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is Required";
    if (!formData.password) newErrors.password = "Password is Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await axios.post(
        "https://ngo-admin.doaguru.com/auth/api/ngo/login/login",
        formData
      );

      if (response.data?.status === "Success") {
        const { user, token } = response.data;

        // Save token to localStorage first (so any immediate subsequent code can read it)
        try {
          localStorage.setItem("token", token);
          // Optional: store minimal user info only
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: user.id,
              name: user.name,
              designation: user.designation,
            })
          );
        } catch (err) {
          console.warn("Could not save token to localStorage", err);
        }

        // Store in Redux
        dispatch(setUser({ user, token }));

        // Success alert
        setAlert({ type: "success", message: `Welcome ${user.name}!` });

        // Navigate — use replace to avoid keeping signin in history
        setTimeout(() => {
          if (user.designation?.toLowerCase() === "admin")
            navigate("/admin", { replace: true });
          else if (user.designation?.toLowerCase() === "employee")
            navigate("/employee", { replace: true });
          else navigate("/", { replace: true });
        }, 900); // slightly shorter delay is often nicer
      } else {
        setAlert({
          type: "error",
          message: response.data?.message || "Login failed.",
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!validateForm()) return;

  //   try {
  //     setLoading(true);

  //     // 👇 Update this URL according to your backend
  //     const response = await axios.post(
  //       "https://ngo-admin.doaguru.com/auth/api/ngo/login/login",
  //       formData
  //     );

  //     if (response.data.status === "Success") {
  //       const { user, token } = response.data; // ✅ Expecting {status, user, token}

  //       // ✅ Store in Redux
  //       dispatch(setUser({ user, token }));

  //       // ✅ Show success alert
  //       setAlert({ type: "success", message: `Welcome ${user.name}!` });

  //       // ✅ Redirect after short delay
  //       setTimeout(() => {
  //         if (user.designation?.toLowerCase() === "admin") navigate("/admin");
  //         else if (user.designation?.toLowerCase() === "employee")
  //           navigate("/employee");
  //         else navigate("/");
  //       }, 1500);
  //     } else {
  //       setAlert({
  //         type: "error",
  //         message: response.data.message || "Login failed.",
  //       });
  //     }
  //   } catch (error) {
  //     setAlert({
  //       type: "error",
  //       message:
  //         error.response?.data?.message ||
  //         "Something went wrong. Please try again.",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0b0c18] text-white px-4 font-sans"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ✅ Custom Alert */}
      <div className="absolute top-5 right-5 z-50">
        {alert.type === "success" && (
          <SuccessAlert
            message={alert.message}
            onClose={() => setAlert({ type: "", message: "" })}
          />
        )}
        {alert.type === "error" && (
          <ErrorAlert
            message={alert.message}
            onClose={() => setAlert({ type: "", message: "" })}
          />
        )}
      </div>

      {/* ✅ Login Card */}
      <div className="bg-[#111326] p-10 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg transition-all duration-300">
        <h2 className="text-3xl font-semibold mb-3 text-center">Sign In</h2>
        <p className="text-sm text-gray-400 mb-8 text-center">
          Enter your email and password to login
        </p>

        <form onSubmit={handleSubmit}>
          <SignInputField
            lable="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            error={errors.email}
            icon={Mail}
          />

          <SignInputField
            lable="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            error={errors.password}
            icon={Lock}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? "bg-gray-600" : "bg-purple-600 hover:bg-purple-700"
            } text-white py-3 mt-2 rounded-md font-semibold transition-all text-sm tracking-wide shadow-md hover:shadow-purple-700/40`}
          >
            {loading ? "Signing In..." : "SIGN IN"}
          </button>
        </form>

        <div className="flex items-center my-8">
          <hr className="flex-1 border-gray-700" />
          <span className="px-3 text-gray-500 text-sm">Or continue with</span>
          <hr className="flex-1 border-gray-700" />
        </div>

        <p>
          <Link to="/forgot-password"> Forgot Password?</Link>
          {/* <a href="#" className="text-purple-400 hover:underline">
            Forgot Password?
          </a> */}
        </p>
      </div>
    </div>
  );
};

export default SignIn;
