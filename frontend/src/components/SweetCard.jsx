import { useState } from 'react';
import api from '../utils/axios';

const SweetCard = ({ sweet, onPurchase }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    if (sweet.quantity <= 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/api/sweets/${sweet._id}/purchase`);
      onPurchase(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {sweet.imageUrl ? (
        <img
          src={sweet.imageUrl}
          alt={sweet.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
          <span className="text-6xl">🍭</span>
        </div>
      )}

      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{sweet.name}</h3>
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-semibold">Category:</span> {sweet.category}
        </p>
        <p className="text-lg font-bold text-pink-600 mb-2">
          ₹{sweet.price.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-semibold">Quantity:</span>{' '}
          <span
            className={sweet.quantity > 0 ? 'text-green-600' : 'text-red-600'}
          >
            {sweet.quantity}
          </span>
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        <button
          onClick={handlePurchase}
          disabled={sweet.quantity <= 0 || loading}
          className={`w-full py-2 px-4 rounded-md font-semibold transition ${
            sweet.quantity <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-pink-600 text-white hover:bg-pink-700'
          }`}
        >
          {loading ? 'Processing...' : sweet.quantity <= 0 ? 'Out of Stock' : 'Purchase'}
        </button>
      </div>
    </div>
  );
};

export default SweetCard;

