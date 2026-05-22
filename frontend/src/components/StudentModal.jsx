import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../../lib/api";
import toast from "react-hot-toast";
import { User, X } from "lucide-react";

const StudentModal = ({ close, refresh, student, isEditing }) => {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    grade: "",
    studentId: "",
    email: "",
    phone: "",
    gender: "",
    riskLevel: "Low",
    notes: "",
    profilePhoto: "",
    newPhoto: null,
  });

  useEffect(() => {
    if (isEditing && student) {
      setForm({ ...student, newPhoto: null });
    }
  }, [isEditing, student]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      Object.keys(form).forEach((k) => {
        if (k === "newPhoto" && form.newPhoto) {
          data.append("profilePhoto", form.newPhoto);
        } else if (k !== "newPhoto") {
          data.append(k, form[k]);
        }
      });

      if (isEditing) {
        await API.put(`/api/students/${student._id}`, data);
        toast.success("Student updated");
      } else {
        await API.post("/api/students", data);
        toast.success("Student created");
      }

      refresh();
      close();
    } catch {
      toast.error("Failed to save student");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >

        {/* MODAL SHELL */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >

          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-green-50 to-white">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing ? "Edit Student Profile" : "Create Student Profile"}
              </h2>
              <p className="text-sm text-slate-500">
                Manage student identity and behavioral profile
              </p>
            </div>

            <button
              type="button"
              onClick={close}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>

          </div>

          {/* BODY */}
          <div className="p-6 grid grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-5">

              <SectionTitle title="Identity" />

              <Input name="firstName" label="First Name" form={form} onChange={handleChange} />
              <Input name="middleName" label="Middle Name" form={form} onChange={handleChange} />
              <Input name="lastName" label="Last Name" form={form} onChange={handleChange} />

              <SectionTitle title="Academic Info" />
              <Input name="grade" label="Grade Level" form={form} onChange={handleChange} />
              <Input name="studentId" label="Student ID" form={form} onChange={handleChange} />

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-5">

              <SectionTitle title="Contact" />

              <Input name="email" label="Email" form={form} onChange={handleChange} />
              <Input name="phone" label="Phone" form={form} onChange={handleChange} />

              <SectionTitle title="Classification" />

              <Select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={["Male", "Female"]}
                label="Gender"
              />

              <Select
                name="riskLevel"
                value={form.riskLevel}
                onChange={handleChange}
                options={["Low", "Medium", "High"]}
                label="Risk Level"
              />

            </div>

            {/* FULL WIDTH NOTES */}
            <div className="col-span-2">

              <SectionTitle title="Notes" />

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add behavioral notes, guidance remarks, or observations..."
                className="w-full border border-slate-200 rounded-xl p-3 h-28 outline-none focus:ring-2 focus:ring-green-500"
              />

            </div>

            {/* PHOTO */}
            <div className="col-span-2 flex items-center justify-between border-t pt-4">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <User size={18} className="text-slate-500" />
                </div>

                <div>
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-slate-500">Optional upload</p>
                </div>

              </div>

              <input
                type="file"
                onChange={(e) =>
                  setForm({ ...form, newPhoto: e.target.files[0] })
                }
                className="text-sm"
              />

            </div>

          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">

            <button
              type="button"
              onClick={close}
              className="px-4 py-2 rounded-xl border hover:bg-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800"
            >
              {isEditing ? "Save Changes" : "Create Student"}
            </button>

          </div>

        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
};

/* ================= UI HELPERS ================= */

const SectionTitle = ({ title }) => (
  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
    {title}
  </h3>
);

const Input = ({ name, label, form, onChange }) => (
  <div>
    <label className="text-xs text-slate-500">{label}</label>
    <input
      name={name}
      value={form[name]}
      onChange={onChange}
      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
    />
  </div>
);

const Select = ({ name, value, onChange, options, label }) => (
  <div>
    <label className="text-xs text-slate-500">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </div>
);

export default StudentModal;