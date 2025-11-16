import { useState, useEffect } from 'react';
import api from '../utils/axios';

const AdminPanel = () => {
  const [sweets, setSweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSweet, setEditingSweet] = useState(null);
  const [restockingSweet, setRestockingSweet] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    image: null,
  });

  useEffect(() => {
    fetchSweets();
  }, []);

  const fetchSweets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/sweets');
      setSweets(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sweets');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData((prev) => ({ ...prev, image: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      quantity: '',
      image: null,
    });
    setShowAddForm(false);
    setEditingSweet(null);
    setRestockingSweet(null);
    setRestockAmount('');
  };

  const handleAddSweet = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('quantity', formData.quantity);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await api.post('/api/sweets', formDataToSend);

      setSuccess('Sweet added successfully!');
      resetForm();
      fetchSweets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add sweet');
    }
  };

  const handleUpdateSweet = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      if (formData.name !== undefined && formData.name !== '') {
        formDataToSend.append('name', formData.name);
      }
      if (formData.category !== undefined && formData.category !== '') {
        formDataToSend.append('category', formData.category);
      }
      if (formData.price !== undefined && formData.price !== '') {
        formDataToSend.append('price', formData.price);
      }
      if (formData.quantity !== undefined && formData.quantity !== '') {
        formDataToSend.append('quantity', formData.quantity);
      }
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await api.put(`/api/sweets/${editingSweet._id}`, formDataToSend);

      setSuccess('Sweet updated successfully!');
      resetForm();
      fetchSweets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update sweet');
    }
  };

  const handleDeleteSweet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sweet?')) {
      return;
    }

    try {
      await api.delete(`/api/sweets/${id}`);
      setSuccess('Sweet deleted successfully!');
      fetchSweets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete sweet');
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post(`/api/sweets/${restockingSweet._id}/restock`, {
        amount: Number(restockAmount),
      });

      setSuccess('Sweet restocked successfully!');
      resetForm();
      fetchSweets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restock sweet');
    }
  };

  const startEdit = (sweet) => {
    setEditingSweet(sweet);
    setFormData({
      name: sweet.name,
      category: sweet.category,
      price: sweet.price.toString(),
      quantity: sweet.quantity.toString(),
      image: null,
    });
    setShowAddForm(true);
  };

  const startRestock = (sweet) => {
    setRestockingSweet(sweet);
    setRestockAmount('');
  };

  if (loading && sweets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
          >
            + Add New Sweet
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingSweet ? 'Edit Sweet' : 'Add New Sweet'}
            </h2>
            <form
              onSubmit={editingSweet ? handleUpdateSweet : handleAddSweet}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!editingSweet}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required={!editingSweet}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required={!editingSweet}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required={!editingSweet}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition"
                >
                  {editingSweet ? 'Update' : 'Add'} Sweet
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {restockingSweet && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">
              Restock: {restockingSweet.name}
            </h2>
            <form onSubmit={handleRestock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Add *
                </label>
                <input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Restock
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sweets.map((sweet) => (
                  <tr key={sweet._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sweet.imageUrl ? (
                        <img
                          src={sweet.imageUrl}
                          alt={sweet.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      ) : (
                        <span className="text-2xl">🍭</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sweet.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sweet.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{sweet.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={
                          sweet.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {sweet.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(sweet)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => startRestock(sweet)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => handleDeleteSweet(sweet._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sweets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No sweets found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

