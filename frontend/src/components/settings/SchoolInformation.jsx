import { School, Lock } from "lucide-react";

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
              Official school details used across the system.
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
          <Lock size={13} className="text-gray-400" />

          <span className="text-xs font-medium text-gray-500">
            Read Only
          </span>
        </div>
      </div>

      {/* =====================================================
          READ-ONLY NOTICE
      ===================================================== */}
      <div
        className="
          mb-8
          flex
          items-start
          gap-3
          px-4
          py-3.5
          rounded-xl
          bg-amber-50
          border
          border-amber-100
        "
      >
        <Lock
          size={17}
          strokeWidth={2}
          className="text-amber-600 mt-0.5 flex-shrink-0"
        />

        <div>
          <p className="text-sm font-semibold text-amber-800">
            School information is read-only
          </p>

          <p className="text-xs text-amber-700 mt-0.5">
            These details are official school records and cannot be edited
            from the system.
          </p>
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
                value="Our Lady of the Holy Rosary School"
              />

              <Field
                label="Contact Number"
                value="09XXXXXXXXX"
              />

              <Field
                label="Email Address"
                value="school@email.com"
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
              value="General Trias, Cavite"
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

              <div className="relative">
                <textarea
                  rows={6}
                  value="Our Lady of the Holy Rosary School - General Trias Campus"
                  readOnly
                  className="
                    w-full
                    bg-gray-50
                    border
                    border-gray-200
                    rounded-xl
                    px-4
                    py-3
                    pr-11
                    text-sm
                    text-gray-600
                    resize-none
                    cursor-not-allowed
                    focus:outline-none
                  "
                />

                <Lock
                  size={15}
                  className="
                    absolute
                    right-4
                    top-4
                    text-gray-400
                  "
                />
              </div>

              <p className="text-[11px] text-gray-400 mt-2">
                This information is maintained as an official school record.
              </p>
            </div>

          </div>
        </section>

      </div>

      {/* =====================================================
          READ-ONLY FOOTER
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
        <div className="flex items-center gap-2">
          <Lock
            size={14}
            className="text-gray-400"
          />

          <p className="text-xs text-gray-400">
            School information is managed by the system administrator.
          </p>
        </div>

        <span
          className="
            hidden
            sm:inline-flex
            items-center
            gap-1.5
            px-3
            py-1.5
            rounded-lg
            bg-gray-50
            border
            border-gray-100
            text-[11px]
            font-semibold
            text-gray-500
          "
        >
          <Lock size={11} />
          Read Only
        </span>
      </div>

    </div>
  );
};

export default SchoolInformation;

/* =========================================================
   READ-ONLY FIELD COMPONENT
========================================================= */

const Field = ({
  label,
  value,
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

      <div className="relative">
        <input
          type={type}
          value={value}
          readOnly
          className="
            w-full
            bg-gray-50
            border
            border-gray-200
            rounded-xl
            px-4
            py-3
            pr-11
            text-sm
            text-gray-600
            cursor-not-allowed
            focus:outline-none
          "
        />

        <Lock
          size={14}
          className="
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            text-gray-400
          "
        />
      </div>
    </div>
  );
};