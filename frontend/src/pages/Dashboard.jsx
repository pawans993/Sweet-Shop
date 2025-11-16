import { useState, useEffect } from 'react';
import api from '../utils/axios';
import SweetCard from '../components/SweetCard';
import SearchBar from '../components/SearchBar';

const Dashboard = () => {
  const [sweets, setSweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleSearch = async (filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.name) params.append('name', filters.name);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      const response = await api.get(`/api/sweets/search?${params.toString()}`);
      setSweets(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (updatedSweet) => {
    setSweets((prevSweets) =>
      prevSweets.map((sweet) =>
        sweet._id === updatedSweet._id ? updatedSweet : sweet
      )
    );
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Sweet Shop Dashboard</h1>
        
        <SearchBar onSearch={handleSearch} />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {sweets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No sweets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sweets.map((sweet) => (
              <SweetCard
                key={sweet._id}
                sweet={sweet}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

