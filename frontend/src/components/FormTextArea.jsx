// src/components/FormTextArea.jsx
const FormTextArea = ({ label, value }) => (
  <div className="mb-3">
    <label className="text-sm font-medium">{label}</label>
    <textarea value={value} readOnly className="mt-1 w-full p-2 bg-gray-100 rounded h-24"></textarea>
  </div>
);

export default FormTextArea;
