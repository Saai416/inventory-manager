import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Dashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchAllItems();
  }, []);

  async function fetchCategories() {
    try {
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (catError) throw catError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('category_id, quantity, min_stock');
      
      if (itemsError) throw itemsError;

      const categoriesWithCounts = categoriesData.map((cat) => {
        const categoryItems = itemsData.filter(item => item.category_id === cat.id);
        const lowStockItems = categoryItems.filter(item => item.quantity <= item.min_stock);
        
        return {
          ...cat,
          itemCount: categoryItems.length,
          lowStockCount: lowStockItems.length
        };
      });

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllItems() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, categories(name, icon)');
      
      if (error) throw error;
      setAllItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error.message);
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  async function handleAddCategory(e) {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `category-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategory.name.trim(), 
          icon: newCategory.icon,
          image_url: imageUrl
        }]);
      
      if (error) throw error;
      
      setNewCategory({ name: '', icon: '📦' });
      setImageFile(null);
      setImagePreview(null);
      setShowAddModal(false);
      fetchCategories();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function handleEditCategory(e) {
    e.preventDefault();
    
    if (!editingCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      let imageUrl = editingCategory.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `category-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('categories')
        .update({ 
          name: editingCategory.name.trim(), 
          icon: editingCategory.icon,
          image_url: imageUrl
        })
        .eq('id', editingCategory.id);
      
      if (error) throw error;
      
      setEditingCategory(null);
      setImageFile(null);
      setImagePreview(null);
      setShowEditModal(false);
      fetchCategories();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  function openEditModal(category) {
    setEditingCategory({ ...category });
    setImagePreview(category.image_url);
    setImageFile(null);
    setShowEditModal(true);
  }

  async function handleDeleteCategory(categoryId, categoryName) {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all items in this category.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      alert('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error.message);
      alert('Error deleting category');
    }
  }

  const totalLowStock = categories.reduce((sum, cat) => sum + cat.lowStockCount, 0);

  // Search filtering
  const filteredItems = searchTerm.trim() 
    ? allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categories.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-600">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              {/* UPDATED TITLE: Large, Red, and Bold - ONLY THIS CHANGED */}
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-red-600 uppercase drop-shadow-sm">
  LAKSHMI ENGINEERING
</h1>
              <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">
                Service Center Stock Control
              </p>
            </div>
            {/* Button remains BLUE */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              + New
            </button>
          </div>
          
          <div className="relative">
            {/* Search focus remains BLUE */}
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Results */}
          {searchTerm.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50 mx-4">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No items found</div>
              ) : (
                <div className="p-2">
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        navigate(`/item/${item.id}`);
                        setSearchTerm('');
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
                          {item.categories.icon}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.categories.name} • Stock: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Low Stock Alert */}
        {totalLowStock > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-900 text-sm">Low Stock Alert</h3>
                  <p className="text-xs text-red-700">{totalLowStock} items need attention</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mb-1">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mb-1">Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.reduce((sum, cat) => sum + cat.itemCount, 0)}
              </p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/low-stock')}
            className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">{totalLowStock}</p>
            </div>
          </div>
        </div>

{/* Categories Grid */}
<div>
  <h2 className="text-base font-semibold text-gray-900 mb-3">Categories</h2>
  
  {categories.length === 0 ? (
    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
      <p className="text-gray-500 mb-4">Get started by creating your first category</p>
      <button 
        onClick={() => setShowAddModal(true)}
        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
      >
        Create Category
      </button>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
        >
          {/* Smaller Category Image */}
          <div 
            onClick={() => navigate(`/category?id=${category.id}&name=${category.name}`)}
            className="relative h-32 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {category.image_url ? (
              <img 
                src={category.image_url} 
                alt={category.name} 
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="text-5xl">{category.icon}</div>
            )}
            
            {category.lowStockCount > 0 && (
              <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                {category.lowStockCount}
              </div>
            )}
          </div>

          <div 
            onClick={() => navigate(`/category?id=${category.id}&name=${category.name}`)}
            className="p-2.5 cursor-pointer"
          >
            <h3 className="font-medium text-gray-900 mb-0.5 text-sm line-clamp-1">{category.name}</h3>
            <p className="text-xs text-gray-500">{category.itemCount} items</p>
          </div>
          
          {/* Compact Action Buttons */}
          <div className="border-t border-gray-200 grid grid-cols-2 divide-x divide-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(category);
              }}
              className="py-1.5 text-blue-600 hover:bg-blue-50 text-xs font-medium transition"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(category.id, category.name);
              }}
              className="py-1.5 text-red-600 hover:bg-red-50 text-xs font-medium transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      </main>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="e.g., Gas Stove Parts"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image (optional)
                </label>
                
                {imagePreview && (
                  <div className="mb-3">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-300" />
                  </div>
                )}

                {/* Camera Button */}
<label className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 transition mb-3">
  <svg className="w-12 h-12 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
  </svg>
  <span className="text-sm font-medium text-gray-700">📸 Take Photo with Camera</span>
  <input
    type="file"
    accept="image/*"
    capture="environment"
    onChange={handleImageChange}
    className="hidden"
  />
</label>

{/* Gallery Button */}
<label className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:border-green-500 transition">
  <svg className="w-12 h-12 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
  <span className="text-sm font-medium text-gray-700">🖼️ Choose from Gallery</span>
  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="hidden"
  />
</label>

              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or choose an icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['📦', '🔥', '⚙️', '🔧', '🔩', '⚡', '🛠️', '📊'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCategory({...newCategory, icon: emoji})}
                      className={`w-12 h-12 rounded-lg border-2 text-2xl hover:border-blue-500 transition ${
                        newCategory.icon === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategory({ name: '', icon: '📦' });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Category</h2>
            <form onSubmit={handleEditCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  placeholder="e.g., Gas Stove Parts"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image (optional)
                </label>
                
                {imagePreview && (
                  <div className="mb-3">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-300" />
                  </div>
                )}

                {/* Camera Button */}
<label className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 transition mb-3">
  <svg className="w-12 h-12 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
  </svg>
  <span className="text-sm font-medium text-gray-700">📸 Take Photo with Camera</span>
  <input
    type="file"
    accept="image/*"
    capture="environment"
    onChange={handleImageChange}
    className="hidden"
  />
</label>

{/* Gallery Button */}
<label className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:border-green-500 transition">
  <svg className="w-12 h-12 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
  <span className="text-sm font-medium text-gray-700">🖼️ Choose from Gallery</span>
  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="hidden"
  />
</label>

              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or choose an icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['📦', '🔥', '⚙️', '🔧', '🔩', '⚡', '🛠️', '📊'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditingCategory({...editingCategory, icon: emoji})}
                      className={`w-12 h-12 rounded-lg border-2 text-2xl hover:border-blue-500 transition ${
                        editingCategory.icon === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;