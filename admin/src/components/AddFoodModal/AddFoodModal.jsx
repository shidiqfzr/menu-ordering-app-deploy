import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { MdClose, MdCloudUpload, MdAdd, MdFastfood, MdDeleteOutline } from 'react-icons/md';
import api from '../../services/api';
import './AddFoodModal.css';

const CATEGORIES = [
  'Salad', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles',
  'Minuman', 'Makanan', 'Ayam', 'Seafood', 'Burger', 'Pizza', 'Sushi', 'Lainnya'
];

const AddFoodModal = ({ onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Salad');
  const [available, setAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      toast.error('Silakan unggah foto makanan terlebih dahulu');
      return;
    }
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
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', Number(price));
      formData.append('category', category);
      formData.append('available', available);
      formData.append('image', imageFile);

      const response = await api.post('/api/food/add', formData);

      if (response.data.success) {
        toast.success(`Menu "${name}" berhasil ditambahkan! 🎉`);
        if (onAdded) onAdded();
        onClose();
      } else {
        toast.error(response.data.message || 'Gagal menambahkan menu makanan');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menambahkan menu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-modal-backdrop" onClick={onClose}>
      <div className="add-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <MdFastfood />
            </div>
            <div>
              <h3>Tambah Menu Baru</h3>
              <p>Isi rincian untuk menambahkan menu makanan ke sistem</p>
            </div>
          </div>
          <button className="add-close-btn" onClick={onClose} title="Tutup (Esc)">
            <MdClose />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="add-modal-form">
          <div className="add-modal-body">
            {/* Image Upload Area */}
            <div className="form-group image-upload-group">
              <label className="form-label">
                Foto Hidangan <span className="required">*</span>
              </label>
              <div className="image-add-container">
                {previewUrl ? (
                  <div className="image-preview-card">
                    <div className="preview-image-wrapper">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="add-image-preview" 
                      />
                    </div>
                    <div className="preview-details-and-actions">
                      <div className="preview-file-info">
                        <span className="file-name">{imageFile ? imageFile.name : 'Foto Makanan'}</span>
                        <span className="file-size">
                          {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Foto Terpilih'}
                        </span>
                      </div>
                      <div className="preview-action-buttons">
                        <label htmlFor="add-image-file" className="btn-change-photo">
                          <MdCloudUpload className="btn-icon-sm" />
                          <span>Ganti Foto</span>
                          <input
                            type="file"
                            id="add-image-file"
                            accept="image/*"
                            onChange={handleImageChange}
                            hidden
                          />
                        </label>
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={handleRemoveImage}
                          title="Hapus foto ini"
                        >
                          <MdDeleteOutline className="btn-icon-sm" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="add-image-file" className="upload-dropzone">
                    <MdCloudUpload className="dropzone-icon" />
                    <span className="dropzone-text">Pilih atau Seret Foto Makanan</span>
                    <span className="dropzone-hint">Format PNG, JPG, WEBP (Maks 5MB)</span>
                    <input
                      type="file"
                      id="add-image-file"
                      accept="image/*"
                      onChange={handleImageChange}
                      hidden
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Dish Name */}
            <div className="form-group">
              <label className="form-label">Nama Menu <span className="required">*</span></label>
              <input
                type="text"
                className="add-input"
                placeholder="Contoh: Nasi Goreng Spesial, Caesar Salad"
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
                  className="add-select"
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
                  className="add-input"
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
                className="add-textarea"
                rows="3"
                placeholder="Deskripsikan menu makanan, bahan, dan cita rasa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Availability / Stock Status */}
            <div className="form-group">
              <label className="form-label">Status Ketersediaan (Stok Awal)</label>
              <div 
                className={`modal-stock-toggle-box ${available ? 'is-available' : 'is-out-of-stock'}`}
                onClick={() => setAvailable(!available)}
              >
                <div className="stock-toggle-left">
                  <div className="stock-status-dot"></div>
                  <div>
                    <span className="stock-status-title">
                      {available ? 'Langsung Tersedia (In Stock)' : 'Stok Habis (Out of Stock)'}
                    </span>
                    <p className="stock-status-subtitle">
                      {available 
                        ? 'Pelanggan dapat langsung melihat & memesan hidangan ini' 
                        : 'Menu akan ditandai habis'}
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
          <div className="add-modal-footer">
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
                  <MdAdd className="btn-icon" />
                  <span>Tambah Menu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFoodModal;
