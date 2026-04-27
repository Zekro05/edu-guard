import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../store/authStore";
import toast from "react-hot-toast";
import { User } from "lucide-react";

const StudentModal = ({ close, refresh, student, isEditing, students }) => {
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
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >

        <motion.form
          onSubmit={handleSubmit}
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-3xl rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl text-white shadow-2xl"
        >

          {/* HEADER */}
          <div className="relative p-6 bg-gradient-to-r from-green-600 to-emerald-600">
            <h2 className="text-2xl font-bold tracking-wide">
              {isEditing ? "Edit Student Profile" : "Create Student Profile"}
            </h2>
            <p className="text-white/80 text-sm">
              EduGuard Secure Student Management System
            </p>
          </div>

          {/* BODY */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* AVATAR */}
            <div className="col-span-2 flex flex-col items-center">
              <div className="w-28 h-28 rounded-full border border-green-400/40 shadow-lg overflow-hidden flex items-center justify-center bg-white/10">
                {form.newPhoto ? (
                  <img src={URL.createObjectURL(form.newPhoto)} className="w-full h-full object-cover" />
                ) : form.profilePhoto ? (
                  <img src={form.profilePhoto} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-gray-300 w-10 h-10" />
                )}
              </div>

              <input
                type="file"
                onChange={(e) =>
                  setForm({ ...form, newPhoto: e.target.files[0] })
                }
                className="mt-3 text-sm text-gray-300"
              />
            </div>

            {/* INPUTS */}
            {[
              ["firstName", "First Name"],
              ["middleName", "Middle Name"],
              ["lastName", "Last Name"],
              ["grade", "Grade"],
              ["studentId", "Student ID"],
              ["email", "Email"],
              ["phone", "Phone"],
            ].map(([name, label]) => (
              <div
                key={name}
                className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-green-400/40 transition"
              >
                <p className="text-xs text-gray-400">{label}</p>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none text-white"
                />
              </div>
            ))}

            {/* SELECTS */}
            <select
              name="riskLevel"
              value={form.riskLevel}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-xl p-3"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-xl p-3"
            >
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            {/* NOTES */}
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional intelligence notes..."
              className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3 h-24"
            />
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 p-5 border-t border-white/10 bg-white/5">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition"
            >
              {isEditing ? "Save Changes" : "Create Student"}
            </button>
          </div>

        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudentModal;