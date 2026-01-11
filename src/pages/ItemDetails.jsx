import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    min_stock: ''
  });
  const [addQuantity, setAddQuantity] = useState(''); // New state for add quantity
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  async function fetchItem() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, categories(name, icon)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setItem(data);
      setFormData({
        name: data.name,
        quantity: data.quantity,
        min_stock: data.min_stock
      });
      setImagePreview(data.image_url);
    } catch (error) {
      console.error('Error:', error.message);
      alert('Item not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddQuantity = () => {
    const amountToAdd = parseInt(addQuantity) || 0;
    if (amountToAdd > 0) {
      setFormData({
        ...formData,
        quantity: parseInt(formData.quantity || 0) + amountToAdd
      });
      setAddQuantity(''); // Clear the add box
    }
  };

  const handleRemoveQuantity = () => {
    const amountToRemove = parseInt(addQuantity) || 0;
    if (amountToRemove > 0) {
      setFormData({
        ...formData,
        quantity: Math.max(0, parseInt(formData.quantity || 0) - amountToRemove)
      });
      setAddQuantity(''); // Clear the add box
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = item.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
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
        .from('items')
        .update({
          name: formData.name,
          quantity: parseInt(formData.quantity),
          min_stock: parseInt(formData.min_stock),
          image_url: imageUrl
        })
        .eq('id', id);

      if (error) throw error;

      alert('Item updated successfully!');
      navigate(`/category?id=${item.category_id}&name=${item.categories.name}`);
    } catch (error) {
      console.error('Error:', error.message);
      alert('Error updating item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Item deleted successfully!');
      navigate(`/category?id=${item.category_id}&name=${item.categories.name}`);
    } catch (error) {
      console.error('Error:', error.message);
      alert('Error deleting item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/category?id=${item.category_id}&name=${item.categories.name}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Item</h1>
              <p className="text-sm text-gray-500">in {item.categories.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Item Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Current Quantity (Read Only Display) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Quantity
            </label>
            <div className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-300 rounded-lg text-center">
              <span className="text-3xl font-bold text-gray-900">{formData.quantity}</span>
            </div>
          </div>

          {/* --- UPDATED ADD/REMOVE STOCK SECTION --- */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Add or Remove Stock
            </label>
            
            {/* Input is now full width on its own line */}
            <input
              type="number"
              value={addQuantity}
              onChange={(e) => setAddQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center font-semibold text-lg mb-2"
            />
            
            <p className="text-xs text-gray-600 mb-4 text-center">Type a number above, then click a button below</p>

            {/* Buttons are in a new row below the input */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRemoveQuantity}
                className="flex-1 px-4 py-3 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition shadow-sm font-semibold flex items-center justify-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/></svg>
                </div>
                Remove
              </button>

              <button
                type="button"
                onClick={handleAddQuantity}
                className="flex-1 px-4 py-3 bg-white border border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition shadow-sm font-semibold flex items-center justify-center gap-2"
              >
                 <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                 </div>
                Add
              </button>
            </div>
          </div>
          {/* -------------------------------------- */}

          {/* Minimum Stock */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Stock *
            </label>
            <input
              type="number"
              name="min_stock"
              value={formData.min_stock}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Item Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Image
            </label>
            
            {imagePreview && (
              <div className="mb-3">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-300" />
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

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => navigate(`/category?id=${item.category_id}&name=${item.categories.name}`)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default ItemDetail;