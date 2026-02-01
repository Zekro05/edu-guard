import { useState, useEffect } from "react";
import { API } from "../store/authStore";
import toast from "react-hot-toast";

const StudentModal = ({ close, refresh, student, isEditing, students }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    grade: "",
    riskLevel: "Low",
    studentId: "",
    gender: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    if (isEditing && student) {
      setForm({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        grade: student.grade || "",
        riskLevel: student.riskLevel || "Low",
        studentId: student.studentId || "",
        gender: student.gender || "",
        email: student.email || "",
        phone: student.phone || "",
        notes: student.notes || "",
      });
    }
  }, [isEditing, student]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditing) {
      const emailExists = students.some((s) => s.email === form.email);
      const idExists = students.some((s) => s.studentId === form.studentId);

      if (emailExists) return toast.error("A student with this email already exists");
      if (idExists) return toast.error("A student with this Student ID already exists");
    }

    try {
      if (isEditing) {
        await API.put(`/api/students/${student._id}`, form);
        toast.success("Student updated successfully");
      } else {
        await API.post("/api/students", form);
        toast.success("Student added successfully");
      }
      refresh();
      close();
    } catch (err) {
      console.error("Failed to save student:", err.response?.data?.message || err.message);
      toast.error("Failed to save student");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden transform transition-transform duration-300 animate-fadeIn"
      >
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-green-800 to-green-900 text-center">
          <h2 className="text-2xl font-semibold text-white">
            {isEditing ? "Edit Student" : "Add Student"}
          </h2>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "First Name *", name: "firstName", type: "text" },
            { label: "Last Name *", name: "lastName", type: "text" },
            { label: "Grade *", name: "grade", type: "text" },
            { label: "Student ID *", name: "studentId", type: "text" },
            { label: "Email *", name: "email", type: "email" },
            { label: "Phone No.", name: "phone", type: "text" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-gray-700 font-medium mb-1">{field.label}</label>
              <input
                name={field.name}
                type={field.type}
                required={field.label.includes("*")}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.label.replace("*", "")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition duration-200"
              />
            </div>
          ))}

          {/* Risk Level */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Risk Level</label>
            <select
              name="riskLevel"
              value={form.riskLevel}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition duration-200"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition duration-200"
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>

          {/* Notes */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-gray-700 font-medium mb-1">Additional Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional notes..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition duration-200 resize-none"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={close}
            className="w-full sm:w-auto px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition duration-200"
          >
            {isEditing ? "Save Changes" : "Add Student"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentModal;
