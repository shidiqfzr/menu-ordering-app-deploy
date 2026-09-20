import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdClose, MdCloudUpload, MdSave, MdFastfood } from 'react-icons/md';
import api from '../../services/api';
import './EditFoodModal.css';

const CATEGORIES = [
  'Salad', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles',
  'Minuman', 'Makanan', 'Ayam', 'Seafood', 'Burger', 'Pizza', 'Sushi', 'Lainnya'
];

const EditFoodModal = ({ food, onClose, onUpdated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Salad');
  const [available, setAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (food) {
      setName(food.name || '');
      setDescription(food.description || '');
      setPrice(food.price || '');
      setCategory(food.category || 'Salad');
      setAvailable(food.available !== false);
      setPreviewUrl(food.image || '');
      setImageFile(null);
    }
  }, [food]);

  if (!food) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleResetImage = () => {
    setImageFile(null);
    setPreviewUrl(food?.image || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nama menu tidak boleh kosong');
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error('Harga menu harus berupa angka positif');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', food._id);
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', Number(price));
      formData.append('category', category);
      formData.append('available', available);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post('/api/food/update', formData);

      if (response.data.success) {
        toast.success(`Menu "${name}" berhasil diperbarui!`);
        onUpdated();
        onClose();
      } else {
        toast.error(response.data.message || 'Gagal memperbarui menu');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan perubahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-modal-backdrop" onClick={onClose}>
      <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <MdFastfood />
            </div>
            <div>
              <h3>Edit Menu Makanan</h3>
              <p>Perbarui rincian, harga, kategori, atau foto hidangan</p>
            </div>
          </div>
          <button className="edit-close-btn" onClick={onClose} title="Tutup (Esc)">
            <MdClose />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="edit-modal-form">
          <div className="edit-modal-body">
            {/* Image Preview & Upload */}
            <div className="form-group image-upload-group">
              <label className="form-label">Foto Hidangan</label>
              <div className="image-edit-container">
                <div className="current-image-wrapper">
                  <img 
                    src={previewUrl} 
                    alt={name || 'Preview'} 
                    className="edit-image-preview" 
                  />
                  {imageFile && <span className="new-image-tag">Foto Baru Dipilih</span>}
                </div>

                <div className="image-edit-actions">
                  <label htmlFor="edit-image-input" className="change-image-btn">
                    <MdCloudUpload className="upload-icon" />
                    <span>{imageFile ? 'Pilih Foto Lain' : 'Ganti Foto Makanan'}</span>
                    <input
                      type="file"
                      id="edit-image-input"
                      accept="image/*"
                      onChange={handleImageChange}
                      hidden
                    />
                  </label>
                  {imageFile && (
                    <button
                      type="button"
                      className="btn-reset-image"
                      onClick={handleResetImage}
                      title="Batalkan foto baru dan gunakan foto sebelumnya"
                    >
                      Batal Ganti
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dish Name */}
            <div className="form-group">
              <label className="form-label">Nama Menu <span className="required">*</span></label>
              <input
                type="text"
                className="edit-input"
                placeholder="Contoh: Caesar Salad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Category & Price Grid */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Kategori <span className="required">*</span></label>
                <select
                  className="edit-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Harga (Rp) <span className="required">*</span></label>
                <input
                  type="number"
                  className="edit-input"
                  placeholder="Contoh: 25000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Deskripsi Menu</label>
              <textarea
                className="edit-textarea"
                rows="3"
                placeholder="Deskripsi singkat bahan, rasa, atau penyajian hidangan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Availability / Stock Status */}
            <div className="form-group">
              <label className="form-label">Status Ketersediaan (Stok)</label>
              <div 
                className={`modal-stock-toggle-box ${available ? 'is-available' : 'is-out-of-stock'}`}
                onClick={() => setAvailable(!available)}
              >
                <div className="stock-toggle-left">
                  <div className="stock-status-dot"></div>
                  <div>
                    <span className="stock-status-title">
                      {available ? 'Tersedia untuk Pelanggan' : 'Stok Habis'}
                    </span>
                    <p className="stock-status-subtitle">
                      {available 
                        ? 'Pelanggan dapat melihat dan memesan menu ini' 
                        : 'Menu ditandai habis dan tidak dapat dipesan pelanggan'}
                    </p>
                  </div>
                </div>

                <div className="stock-toggle-switch">
                  <div className={`stock-toggle-slider ${available ? 'checked' : ''}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="edit-modal-footer">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </button>

            <button 
              type="submit" 
              className="btn-save" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <MdSave className="btn-icon" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFoodModal;
