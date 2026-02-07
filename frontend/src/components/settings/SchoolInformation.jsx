import { School } from "lucide-react";

const SchoolInformation = () => {
  return (
    <div className="bg-white rounded-xl border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <School className="text-green-700" size={22} />
        <h2 className="text-lg font-semibold text-gray-800">
          School Information
        </h2>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Manage official school details used across the EduGuard system.
      </p>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-700">
            School Name
          </label>
          <input
            type="text"
            placeholder="Our Lady of the Holy Rosary School"
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <input
            type="text"
            placeholder="09XXXXXXXXX"
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            placeholder="school@email.com"
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            School Address
          </label>
          <input
            type="text"
            placeholder="City, Province"
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            School Details
          </label>
          <textarea
            rows={4}
            placeholder="Brief description about the school..."
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Action */}
      <div className="mt-6">
        <button className="bg-green-700 text-white px-5 py-2 rounded-md text-sm hover:bg-green-800 transition">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SchoolInformation;