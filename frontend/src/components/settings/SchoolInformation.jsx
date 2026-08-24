import { School, Save } from "lucide-react";

const SchoolInformation = () => {
  return (
    <div className="w-full text-gray-900">

      {/* =====================================================
          SECTION HEADER
      ===================================================== */}
      <div className="flex items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">

          {/* ICON */}
          <div
            className="
              w-11
              h-11
              rounded-xl
              bg-green-50
              text-green-600
              border
              border-green-100
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >
            <School size={20} strokeWidth={2.1} />
          </div>

          {/* TITLE */}
          <div>
            <h1
              className="
                text-xl
                font-black
                tracking-tight
                text-gray-900
              "
            >
              School Information
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Manage official school details used across the system.
            </p>
          </div>
        </div>

        {/* STATUS */}
        <div
          className="
            hidden
            sm:flex
            items-center
            gap-2
            px-3
            py-2
            rounded-xl
            bg-gray-50
            border
            border-gray-100
          "
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />

          <span className="text-xs font-medium text-gray-500">
            School Profile
          </span>
        </div>
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}
      <div className="space-y-8">

        {/* ===================================================
            BASIC DETAILS
        =================================================== */}
        <section
          className="
            border
            border-gray-100
            rounded-2xl
            overflow-hidden
          "
        >
          {/* SECTION HEADER */}
          <div
            className="
              px-5
              py-4
              bg-gray-50/70
              border-b
              border-gray-100
            "
          >
            <h2 className="text-sm font-bold text-gray-900">
              Basic Details
            </h2>

            <p className="text-xs text-gray-400 mt-0.5">
              Primary contact information for the school.
            </p>
          </div>

          {/* FIELDS */}
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <Field
                label="School Name"
                placeholder="Our Lady of the Holy Rosary School"
              />

              <Field
                label="Contact Number"
                placeholder="09XXXXXXXXX"
              />

              <Field
                label="Email Address"
                placeholder="school@email.com"
                type="email"
              />

            </div>
          </div>
        </section>

        {/* ===================================================
            ADDITIONAL INFORMATION
        =================================================== */}
        <section
          className="
            border
            border-gray-100
            rounded-2xl
            overflow-hidden
          "
        >
          {/* SECTION HEADER */}
          <div
            className="
              px-5
              py-4
              bg-gray-50/70
              border-b
              border-gray-100
            "
          >
            <h2 className="text-sm font-bold text-gray-900">
              Additional Information
            </h2>

            <p className="text-xs text-gray-400 mt-0.5">
              Additional details displayed throughout the system.
            </p>
          </div>

          {/* FIELDS */}
          <div className="p-5 space-y-6">

            <Field
              label="School Address"
              placeholder="City, Province"
            />

            <div>
              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                School Details
              </label>

              <textarea
                rows={6}
                placeholder="Brief description about the school..."
                className="
                  w-full
                  bg-white
                  border
                  border-gray-200
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  text-gray-900
                  placeholder-gray-400
                  resize-none
                  transition-all
                  duration-200
                  focus:outline-none
                  focus:ring-2
                  focus:ring-green-100
                  focus:border-green-500
                  hover:border-gray-300
                "
              />

              <p className="text-[11px] text-gray-400 mt-2">
                Keep this description concise and relevant to the school.
              </p>
            </div>

          </div>
        </section>

      </div>

      {/* =====================================================
          ACTION BAR
      ===================================================== */}
      <div
        className="
          mt-8
          pt-5
          border-t
          border-gray-100
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <p className="hidden sm:block text-xs text-gray-400">
          Changes will be applied across the system.
        </p>

        <button
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            bg-green-600
            hover:bg-green-700
            text-white
            font-semibold
            text-sm
            px-5
            py-2.5
            rounded-xl
            shadow-sm
            hover:shadow-md
            transition-all
            duration-200
          "
        >
          <Save size={16} strokeWidth={2.2} />
          Save Changes
        </button>
      </div>

    </div>
  );
};

export default SchoolInformation;

/* =========================================================
   FIELD COMPONENT
========================================================= */

const Field = ({
  label,
  placeholder,
  type = "text",
}) => {
  return (
    <div>
      <label
        className="
          block
          text-sm
          font-semibold
          text-gray-700
          mb-2
        "
      >
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="
          w-full
          bg-white
          border
          border-gray-200
          rounded-xl
          px-4
          py-3
          text-sm
          text-gray-900
          placeholder-gray-400
          transition-all
          duration-200
          hover:border-gray-300
          focus:outline-none
          focus:ring-2
          focus:ring-green-100
          focus:border-green-500
        "
      />
    </div>
  );
};