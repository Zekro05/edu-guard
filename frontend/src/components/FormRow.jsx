// src/components/FormRow.jsx
const FormRow = ({ label, value }) => (
  <div className="mb-3">
    <label className="text-sm font-medium">{label}</label>
    <input type="text" value={value} readOnly className="mt-1 w-full p-2 bg-gray-100 rounded" />
  </div>
);

export default FormRow;
