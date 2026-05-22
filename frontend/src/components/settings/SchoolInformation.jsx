import { School } from "lucide-react";

const SchoolInformation = () => {
  return (
    <div className="flex-1 w-full h-full bg-gray-50 text-gray-900 p-6 overflow-y-auto">

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-start gap-4">

          <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
            <School className="text-green-600" size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              School Information
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage official school details used across the system.
            </p>
          </div>

        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT */}
          <div>
            <h2 className="text-sm font-semibold text-green-700 mb-5 uppercase tracking-wide">
              Basic Details
            </h2>

            <div className="space-y-5">

              <Field label="School Name" placeholder="Our Lady of the Holy Rosary School" />
              <Field label="Contact Number" placeholder="09XXXXXXXXX" />
              <Field label="Email Address" placeholder="school@email.com" type="email" />

            </div>
          </div>

          {/* RIGHT */}
          <div>
            <h2 className="text-sm font-semibold text-green-700 mb-5 uppercase tracking-wide">
              Additional Information
            </h2>

            <div className="space-y-5">

              <Field label="School Address" placeholder="City, Province" />

              <div>
                <label className="text-sm text-gray-600 font-medium">
                  School Details
                </label>

                <textarea
                  rows={6}
                  placeholder="Brief description about the school..."
                  className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                />
              </div>

            </div>
          </div>

        </div>

        {/* ACTION BAR */}
        <div className="mt-8 flex justify-end border-t border-gray-100 pt-5">
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-xl transition shadow-sm">
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default SchoolInformation;

/* ================= FIELD COMPONENT ================= */
const Field = ({ label, placeholder, type = "text" }) => {
  return (
    <div>
      <label className="text-sm text-gray-600 font-medium">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
      />
    </div>
  );
};