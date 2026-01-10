import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function LowStockItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  async function fetchLowStockItems() {
    try {
      // Fetch ALL items first
      const { data: allItems, error } = await supabase
        .from('items')
        .select('*, categories(name, icon)')
        .order('quantity', { ascending: true });

      if (error) throw error;

      // Filter client-side where quantity <= min_stock
      const lowStockItems = (allItems || []).filter(item => 
        item.quantity <= item.min_stock
      );

      console.log('Total items:', allItems?.length);
      console.log('Low stock items:', lowStockItems.length);
      
      setItems(lowStockItems);
    } catch (error) {
      console.error('Error:', error.message);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(itemId, currentQuantity, change) {
    const newQuantity = Math.max(0, currentQuantity + change);
    
    try {
      const { error } = await supabase
        .from('items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      // Refresh the list after update
      fetchLowStockItems();
    } catch (error) {
      console.error('Error:', error.message);
      alert('Error updating quantity');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Low Stock Items</h1>
              <p className="text-sm text-gray-500">{items.length} items need attention</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Good!</h3>
            <p className="text-gray-500">No items are running low on stock</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const isOutOfStock = item.quantity === 0;

              return (
                <div
                  key={item.id}
                  className="bg-white border-2 border-red-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  <div 
                    onClick={() => navigate(`/item/${item.id}`)}
                    className="h-40 bg-gray-50 flex items-center justify-center cursor-pointer"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </div>

                  <div className="p-4">
                    <div 
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="cursor-pointer mb-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{item.categories?.icon || '📦'}</span>
                        <span className="text-xs text-gray-500 truncate">{item.categories?.name || 'Unknown'}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">{item.name}</h3>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Stock</p>
                          <p className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600' : 'text-orange-600'}`}>
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Min</p>
                          <p className="text-lg font-semibold text-gray-600">{item.min_stock}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, item.quantity, -1);
                        }}
                        disabled={item.quantity === 0}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-md hover:shadow-lg flex items-center justify-center font-semibold disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, item.quantity, 1);
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-md hover:shadow-lg flex items-center justify-center font-semibold"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default LowStockItems;
