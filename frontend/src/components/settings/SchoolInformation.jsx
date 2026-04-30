import { School } from "lucide-react";

const SchoolInformation = () => {
  return (
    <div className="flex-1 w-full h-full text-white p-6 overflow-y-auto">

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl border border-white/10">
            <School className="text-green-400" size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">School Information</h1>
            <p className="text-sm text-gray-400">
              Manage official school details used across the EduGuard system.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT WRAPPER (MATCH DASHBOARD STYLE) */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT */}
          <div>
            <h2 className="text-green-400 font-semibold mb-4">
              Basic Details
            </h2>

            <div className="space-y-4">

              <div>
                <label className="text-sm text-gray-300">School Name</label>
                <input
                  type="text"
                  placeholder="Our Lady of the Holy Rosary School"
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Contact Number</label>
                <input
                  type="text"
                  placeholder="09XXXXXXXXX"
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Email Address</label>
                <input
                  type="email"
                  placeholder="school@email.com"
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>

            </div>
          </div>

          {/* RIGHT */}
          <div>
            <h2 className="text-green-400 font-semibold mb-4">
              Additional Information
            </h2>

            <div className="space-y-4">

              <div>
                <label className="text-sm text-gray-300">School Address</label>
                <input
                  type="text"
                  placeholder="City, Province"
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">School Details</label>
                <textarea
                  rows={6}
                  placeholder="Brief description about the school..."
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-green-500 outline-none resize-none"
                />
              </div>

            </div>
          </div>

        </div>

        {/* ACTION */}
        <div className="mt-6 flex justify-end">
          <button className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-lg transition">
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default SchoolInformation;