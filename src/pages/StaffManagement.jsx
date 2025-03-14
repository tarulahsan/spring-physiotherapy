import { useState } from 'react';
import { FaUserMd, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

export default function StaffManagement() {
  const [staff, setStaff] = useState([
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      role: 'Senior Physiotherapist',
      specialization: 'Sports Rehabilitation',
      email: 'sarah.j@springphysio.com',
      phone: '+880 1234567890',
      joinDate: '2022-01-15',
      status: 'Active',
      image: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      role: 'Physiotherapist',
      specialization: 'Neurological Rehabilitation',
      email: 'michael.c@springphysio.com',
      phone: '+880 1234567891',
      joinDate: '2022-03-20',
      status: 'Active',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialization: '',
    email: '',
    phone: '',
    status: 'Active',
  });

  const handleAddEdit = (staffMember = null) => {
    if (staffMember) {
      setFormData(staffMember);
      setEditingStaff(staffMember);
    } else {
      setFormData({
        name: '',
        role: '',
        specialization: '',
        email: '',
        phone: '',
        status: 'Active',
      });
      setEditingStaff(null);
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStaff) {
      setStaff(staff.map(s => s.id === editingStaff.id ? { ...formData, id: s.id } : s));
    } else {
      setStaff([...staff, { ...formData, id: staff.length + 1, joinDate: new Date().toISOString().split('T')[0] }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <button
          onClick={() => handleAddEdit()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-500 hover:scale-105"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-gray-600">{member.role}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddEdit(member)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-gray-600">
                  <span className="font-semibold w-32">Specialization:</span>
                  <span>{member.specialization}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-semibold w-32">Email:</span>
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-semibold w-32">Phone:</span>
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-semibold w-32">Join Date:</span>
                  <span>{member.joinDate}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-semibold w-32">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-semibold
                    ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {member.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingStaff ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
