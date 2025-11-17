import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const SignInputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error = "",
  icon: Icon,
  className = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="mb-5 w-full">
      {label && (
        <label htmlFor={name} className="block text-sm mb-2 text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={20} />
          </span>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-[#1a1d3a] text-gray-200 px-4 py-3 rounded-md outline-none focus:ring-2 focus:ring-purple-600 placeholder-gray-500 text-sm ${
            Icon ? "pl-10" : "pl-3"
          } ${type === "password" ? "pr-10" : ""} ${className}`}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default SignInputField;
