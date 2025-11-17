import React, { useId } from "react";

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  error = "",
}) => {
  const id = useId();

  return (
    <div className="flex flex-col mb-4 w-full">
      {label && (
        <label htmlFor={id} className="mb-1 font-semibold text-gray-200">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full ${
            Icon ? "pl-10" : "pl-3"
          } pr-4 py-2 rounded-lg bg-[#0f1724] border ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-700 focus:ring-purple-500"
          } text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 transition`}
        />
      </div>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default InputField;

// import React from "react";

// const InputField = ({
//   label,
//   type = "text",
//   value,
//   onChange,
//   placeholder,
//   icon: Icon, // icon ko prop ke through pass karenge
// }) => {
//   return (
//     <div className="flex flex-col mb-4">
//       {label && <label className="mb-1 font-semibold">{label}</label>}
//       <div className="relative">
//         {Icon && (
//           <Icon
//             className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//             size={20}
//           />
//         )}
//         <input
//           type={type}
//           value={value}
//           onChange={onChange}
//           placeholder={placeholder}
//           className={`w-full pl-${Icon ? "10" : "3"} pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
//         />
//       </div>
//     </div>
//   );
// };

// export default InputField;
