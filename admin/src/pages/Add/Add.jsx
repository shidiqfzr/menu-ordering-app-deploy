import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { MdCloudUpload, MdAdd } from 'react-icons/md';
import api from '../../services/api';
import './Add.css';

const CATEGORIES = [
  'Salad', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles',
  'Minuman', 'Makanan', 'Ayam', 'Seafood', 'Burger', 'Pizza', 'Sushi', 'Lainnya'
];

const Add = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Salad',
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      toast.error('Silakan unggah gambar makanan terlebih dahulu');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', Number(data.price));
    formData.append('category', data.category);
    formData.append('image', image);

    try {
      const response = await api.post('/api/food/add', formData);
      if (response.data.success) {
        toast.success('Menu makanan berhasil ditambahkan!');
        setData({ name: '', description: '', price: '', category: 'Salad' });
        setImage(null);
        setImagePreview(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Gagal menambahkan menu makanan. Silakan coba lagi.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-page">
      <div className="page-header">
        <h2 className="page-title">Tambah Menu Makanan Baru</h2>
        <p className="page-subtitle">Isi detail di bawah ini untuk menambahkan menu baru ke Bujang Cafe</p>
      </div>

      <form className="add-form" onSubmit={handleSubmit}>
        {/* Image Upload */}
        <div className="form-group">
          <label>Foto Makanan</label>
          <div className="image-upload-area">
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="preview-wrapper">
                <img src={imagePreview} alt="Pratinjau Foto" className="image-preview" />
                <span className="change-img-text">Klik untuk mengganti foto</span>
              </div>
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon"><MdCloudUpload /></span>
                <p>Klik atau seret & lepas foto di sini</p>
                <span>Format PNG, JPG, WEBP hingga 5MB</span>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="form-group">
          <label>Nama Makanan</label>
          <input
            type="text"
            name="name"
            placeholder="Contoh: Nasi Goreng Spesial, Caesar Salad"
            value={data.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Deskripsi</label>
          <textarea
            name="description"
            placeholder="Deskripsikan menu makanan, bahan, dan rasa..."
            value={data.description}
            onChange={handleChange}
            rows={4}
            required
          />
        </div>

        {/* Price & Category in one row */}
        <div className="form-row">
          <div className="form-group">
            <label>Harga (Rp)</label>
            <input
              type="number"
              name="price"
              placeholder="Contoh: 25000"
              value={data.price}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Kategori</label>
            <select name="category" value={data.category} onChange={handleChange}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          <MdAdd className="btn-icon" />
          <span>{loading ? 'Menambahkan...' : 'Tambah Menu'}</span>
        </button>
      </form>
    </div>
  );
};

export default Add;
