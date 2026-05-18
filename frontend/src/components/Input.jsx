import React from "react";

const Input = ({ icon: Icon, ...props }) => {
  return (
    <div className="relative w-full">
      {/* INPUT FIELD */}
      <input
        {...props}
        className="
          w-full h-14 pl-12 pr-4
          rounded-2xl border
          bg-white
          text-gray-900
          placeholder-gray-400

          focus:outline-none
          focus:ring-2
          focus:ring-green-600/30
          focus:border-green-600

          transition-all duration-200

          shadow-sm
        "
        style={{
          borderColor: "#d1d5db",
        }}
      />

      {/* ICON */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        {Icon && (
          <Icon
            className="w-5 h-5"
            style={{
              color: "#1B5E20",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Input;