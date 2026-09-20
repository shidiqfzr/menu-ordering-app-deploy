import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  MdDeleteOutline, 
  MdOutlineEdit,
  MdFastfood, 
  MdCategory, 
  MdSearch, 
  MdRestartAlt, 
  MdAdd,
  MdRestaurantMenu,
  MdArrowUpward,
  MdArrowDownward,
  MdSwapVert,
  MdNavigateBefore,
  MdNavigateNext,
  MdFirstPage,
  MdLastPage,
  MdCheckCircleOutline,
  MdHighlightOff,
  MdToggleOn,
  MdToggleOff
} from 'react-icons/md';
import AddFoodModal from '../../components/AddFoodModal/AddFoodModal';
import EditFoodModal from '../../components/EditFoodModal/EditFoodModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal/DeleteConfirmModal';
import './List.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const List = () => {
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in_stock', 'out_of_stock'
  const [sortBy, setSortBy] = useState('newest');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEditFood, setSelectedEditFood] = useState(null);
  const [selectedDeleteFood, setSelectedDeleteFood] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add' && isManager) {
      setShowAddModal(true);
    }
  }, [location.search, isManager]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/food/list');
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error('Gagal memuat daftar menu makanan');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Availability Toggle Handler
  const handleToggleAvailability = async (item) => {
    const currentStatus = item.available !== false;
    const newStatus = !currentStatus;

    // Optimistic UI update
    setList(prevList =>
      prevList.map(food =>
        food._id === item._id ? { ...food, available: newStatus } : food
      )
    );
    setTogglingId(item._id);

    try {
      const response = await api.post('/api/food/toggle-availability', {
        id: item._id,
        available: newStatus
      });

      if (response.data.success) {
        toast.success(
          newStatus 
            ? `"${item.name}" sekarang Tersedia!` 
            : `"${item.name}" ditandai Stok Habis!`
        );
      } else {
        // Rollback on failure
        setList(prevList =>
          prevList.map(food =>
            food._id === item._id ? { ...food, available: currentStatus } : food
          )
        );
        toast.error(response.data.message || 'Gagal mengubah status ketersediaan');
      }
    } catch (error) {
      console.error(error);
      // Rollback on network error
      setList(prevList =>
        prevList.map(food =>
          food._id === item._id ? { ...food, available: currentStatus } : food
        )
      );
      toast.error('Terjadi kesalahan saat menghubungi server');
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async (id) => {
    setDeleting(true);
    try {
      const response = await api.post('/api/food/remove', { id });
      if (response.data.success) {
        toast.success('Menu makanan berhasil dihapus!');
        setSelectedDeleteFood(null);
        fetchList();
      } else {
        toast.error(response.data.message || 'Gagal menghapus menu makanan');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menghapus menu makanan');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Reset pagination when search, filter, sort, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stockFilter, sortBy, itemsPerPage]);

  // Compute Distinct Categories & Counts
  const distinctCategories = Array.from(
    new Set(list.map(item => item.category).filter(Boolean))
  ).sort();

  const categoryCounts = list.reduce((acc, item) => {
    if (item.category) {
      acc[item.category] = (acc[item.category] || 0) + 1;
    }
    return acc;
  }, {});

  const totalInStock = list.filter(item => item.available !== false).length;
  const totalOutOfStock = list.filter(item => item.available === false).length;

  // 1. Live Filtering (Search + Category Pill + Stock Status)
  const filteredList = list.filter((item) => {
    // Category Filter
    if (selectedCategory !== 'Semua' && item.category !== selectedCategory) {
      return false;
    }

    // Stock Status Filter
    const isAvailable = item.available !== false;
    if (stockFilter === 'in_stock' && !isAvailable) {
      return false;
    }
    if (stockFilter === 'out_of_stock' && isAvailable) {
      return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = item.name?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const catMatch = item.category?.toLowerCase().includes(q);
      if (!nameMatch && !descMatch && !catMatch) {
        return false;
      }
    }

    return true;
  });

  // 2. Sorting
  const sortedList = [...filteredList].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return (a.name || '').localeCompare(b.name || '', 'id');
    }
    if (sortBy === 'name-desc') {
      return (b.name || '').localeCompare(a.name || '', 'id');
    }
    if (sortBy === 'price-asc') {
      return Number(a.price || 0) - Number(b.price || 0);
    }
    if (sortBy === 'price-desc') {
      return Number(b.price || 0) - Number(a.price || 0);
    }
    if (sortBy === 'category-asc') {
      return (a.category || '').localeCompare(b.category || '', 'id');
    }
    if (sortBy === 'category-desc') {
      return (b.category || '').localeCompare(a.category || '', 'id');
    }
    if (sortBy === 'status-asc') {
      return (b.available !== false ? 1 : 0) - (a.available !== false ? 1 : 0);
    }
    if (sortBy === 'status-desc') {
      return (a.available !== false ? 1 : 0) - (b.available !== false ? 1 : 0);
    }
    // 'newest' (reverse default order)
    return 0;
  });

  // 3. Pagination Calculations
  const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedList.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleHeaderSort = (type) => {
    if (type === 'name') {
      setSortBy(prev => prev === 'name-asc' ? 'name-desc' : prev === 'name-desc' ? 'newest' : 'name-asc');
    } else if (type === 'price') {
      setSortBy(prev => prev === 'price-asc' ? 'price-desc' : prev === 'price-desc' ? 'newest' : 'price-asc');
    } else if (type === 'category') {
      setSortBy(prev => prev === 'category-asc' ? 'category-desc' : prev === 'category-desc' ? 'newest' : 'category-asc');
    } else if (type === 'status') {
      setSortBy(prev => prev === 'status-asc' ? 'status-desc' : prev === 'status-desc' ? 'newest' : 'status-asc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setStockFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const isFilterActive = searchQuery !== '' || selectedCategory !== 'Semua' || stockFilter !== 'all' || sortBy !== 'newest';

  return (
    <div className="list-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Daftar Menu Makanan</h2>
          <p className="page-subtitle">Kelola ketersediaan stok, harga, dan seluruh menu restoran dari sini</p>
        </div>

        <div className="header-actions">
          {isManager ? (
            <button 
              className="header-add-btn" 
              onClick={() => setShowAddModal(true)}
              title="Tambah menu baru"
            >
              <MdAdd className="action-icon" />
              <span>Tambah Menu</span>
            </button>
          ) : (
            <div className="kasir-mode-badge" title="Mode Kasir/Kitchen: Anda dapat mengontrol ketersediaan stok menu">
              <span>Mode Kasir (Kontrol Stok)</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards (Informational Overview) */}
      <div className="list-stats">
        <div 
          className={`stat-card clickable ${stockFilter === 'all' && selectedCategory === 'Semua' ? 'active-stat' : ''}`}
          onClick={() => { setStockFilter('all'); setSelectedCategory('Semua'); }}
          title="Klik untuk menampilkan seluruh menu makanan"
        >
          <div className="stat-icon items">
            <MdFastfood />
          </div>
          <div className="stat-info">
            <p>{list.length}</p>
            <span>Total Menu</span>
          </div>
        </div>

        <div 
          className={`stat-card clickable ${stockFilter === 'in_stock' ? 'active-stat' : ''}`}
          onClick={() => setStockFilter(prev => prev === 'in_stock' ? 'all' : 'in_stock')}
          title="Klik untuk memfilter menu yang tersedia"
        >
          <div className="stat-icon available">
            <MdCheckCircleOutline />
          </div>
          <div className="stat-info">
            <p>{totalInStock}</p>
            <span>Tersedia</span>
          </div>
        </div>

        <div 
          className={`stat-card clickable ${stockFilter === 'out_of_stock' ? 'active-stat' : ''}`}
          onClick={() => setStockFilter(prev => prev === 'out_of_stock' ? 'all' : 'out_of_stock')}
          title="Klik untuk memfilter menu yang stoknya habis"
        >
          <div className="stat-icon out-of-stock">
            <MdHighlightOff />
          </div>
          <div className="stat-info">
            <p>{totalOutOfStock}</p>
            <span>Stok Habis</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon category">
            <MdCategory />
          </div>
          <div className="stat-info">
            <p>{distinctCategories.length}</p>
            <span>Kategori</span>
          </div>
        </div>
      </div>

      {/* Filter & Live Search Toolbar */}
      <div className="menu-filter-card single-row">
        <div className="menu-search-box">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama hidangan, deskripsi, atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search-btn" 
              onClick={() => setSearchQuery('')}
              title="Hapus pencarian"
            >
              ×
            </button>
          )}
        </div>

        {/* Compact Category Dropdown Filter */}
        <div className={`category-filter-select-wrapper ${selectedCategory !== 'Semua' ? 'is-active' : ''}`}>
          <MdCategory className="category-select-icon" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter-select"
            title="Filter berdasarkan kategori makanan"
          >
            <option value="Semua">Semua Kategori ({list.length})</option>
            {distinctCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({categoryCounts[cat] || 0})
              </option>
            ))}
          </select>
        </div>

        {isFilterActive && (
          <button 
            type="button"
            className="list-reset-filter-btn" 
            onClick={handleResetFilters}
            title="Reset semua filter dan pencarian"
          >
            <MdRestartAlt className="btn-icon" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="list-table-container">
        <table className="list-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th 
                className={`th-sortable ${sortBy.startsWith('name') ? 'is-sorted' : ''}`} 
                onClick={() => handleHeaderSort('name')} 
                title="Klik untuk mengurutkan berdasarkan Nama (A-Z / Z-A)"
              >
                <div className="th-content">
                  <span>Nama Menu</span>
                  {sortBy === 'name-asc' ? (
                    <MdArrowUpward className="th-sort-icon active" />
                  ) : sortBy === 'name-desc' ? (
                    <MdArrowDownward className="th-sort-icon active" />
                  ) : (
                    <MdSwapVert className="th-sort-icon neutral" />
                  )}
                </div>
              </th>
              <th 
                className={`th-sortable ${sortBy.startsWith('category') ? 'is-sorted' : ''}`} 
                onClick={() => handleHeaderSort('category')} 
                title="Klik untuk mengurutkan berdasarkan Kategori (A-Z / Z-A)"
              >
                <div className="th-content">
                  <span>Kategori</span>
                  {sortBy === 'category-asc' ? (
                    <MdArrowUpward className="th-sort-icon active" />
                  ) : sortBy === 'category-desc' ? (
                    <MdArrowDownward className="th-sort-icon active" />
                  ) : (
                    <MdSwapVert className="th-sort-icon neutral" />
                  )}
                </div>
              </th>
              <th 
                className={`th-sortable ${sortBy.startsWith('price') ? 'is-sorted' : ''}`} 
                onClick={() => handleHeaderSort('price')} 
                title="Klik untuk mengurutkan berdasarkan Harga (Termurah / Termahal)"
              >
                <div className="th-content">
                  <span>Harga</span>
                  {sortBy === 'price-asc' ? (
                    <MdArrowUpward className="th-sort-icon active" />
                  ) : sortBy === 'price-desc' ? (
                    <MdArrowDownward className="th-sort-icon active" />
                  ) : (
                    <MdSwapVert className="th-sort-icon neutral" />
                  )}
                </div>
              </th>
              <th 
                className={`th-sortable ${sortBy.startsWith('status') ? 'is-sorted' : ''}`} 
                onClick={() => handleHeaderSort('status')} 
                title="Klik untuk mengurutkan berdasarkan Status Ketersediaan"
              >
                <div className="th-content">
                  <span>Status</span>
                  {sortBy === 'status-asc' ? (
                    <MdArrowUpward className="th-sort-icon active" />
                  ) : sortBy === 'status-desc' ? (
                    <MdArrowDownward className="th-sort-icon active" />
                  ) : (
                    <MdSwapVert className="th-sort-icon neutral" />
                  )}
                </div>
              </th>
              <th className="th-action">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-row">
                  <div className="loading-spinner"></div>
                  <p>Memuat data menu makanan...</p>
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  <div className="empty-state-content">
                    <MdFastfood className="empty-icon" />
                    <h4>Belum Ada Menu Makanan</h4>
                    <p>Mulai tambahkan menu hidangan restoran Anda sekarang.</p>
                    {isManager && (
                      <button className="btn-primary-add" onClick={() => setShowAddModal(true)}>
                        <MdAdd /> Tambah Menu Baru
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : sortedList.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  <div className="empty-state-content">
                    {stockFilter === 'out_of_stock' ? (
                      <>
                        <MdCheckCircleOutline className="empty-icon in-stock-all" />
                        <h4>Semua Menu Tersedia</h4>
                        <p>Bagus! Saat ini tidak ada menu hidangan yang kehabisan stok.</p>
                      </>
                    ) : (
                      <>
                        <MdSearch className="empty-icon" />
                        <h4>Tidak Ditemukan Menu</h4>
                        <p>Tidak ada hidangan yang cocok dengan kriteria pencarian atau filter yang dipilih.</p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              currentItems.map((item) => (
                <tr key={item._id} className={item.available === false ? 'row-out-of-stock' : ''}>
                  <td>
                    <div className="thumb-container">
                      <img src={item.image} alt={item.name} className="food-image-thumb" />
                      {item.available === false && (
                        <span className="thumb-badge-habis">Habis</span>
                      )}
                    </div>
                  </td>
                  <td className="food-name-cell">
                    <span className="food-name">{item.name}</span>
                    {item.description && (
                      <span className="food-desc-preview">{item.description}</span>
                    )}
                  </td>
                  <td>
                    <span className="category-badge">{item.category}</span>
                  </td>
                  <td className="food-price-cell">
                    Rp {Number(item.price).toLocaleString('id-ID')}
                  </td>
                  <td className="food-status-cell">
                    <button
                      type="button"
                      className={`availability-toggle-btn ${item.available !== false ? 'in-stock' : 'out-of-stock'} ${togglingId === item._id ? 'loading' : ''}`}
                      onClick={() => handleToggleAvailability(item)}
                      disabled={togglingId === item._id}
                      title={item.available !== false ? 'Klik untuk ubah jadi Stok Habis' : 'Klik untuk ubah jadi Tersedia'}
                    >
                      <span className="toggle-indicator-dot"></span>
                      <span className="toggle-text">
                        {item.available !== false ? 'Tersedia' : 'Stok Habis'}
                      </span>
                    </button>
                  </td>
                  <td className="td-action">
                    {isManager ? (
                      <div className="action-buttons-group">
                        <button
                          className="edit-btn"
                          onClick={() => setSelectedEditFood(item)}
                          title="Edit Rincian / Harga Menu"
                        >
                          <MdOutlineEdit />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => setSelectedDeleteFood(item)}
                          title="Hapus Menu Makanan"
                        >
                          <MdDeleteOutline />
                        </button>
                      </div>
                    ) : (
                      <span className="kasir-restricted-pill" title="Khusus Manager: Edit harga & hapus menu dibatasi">
                        Khusus Manager
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Unified Bottom Pagination Card */}
        {!loading && sortedList.length > 0 && (
          <div className="orders-pagination-bar in-table">
            <div className="orders-pagination-info">
              <span>
                Menampilkan <b>{indexOfFirstItem + 1}–{Math.min(indexOfLastItem, sortedList.length)}</b> dari <b>{sortedList.length}</b> menu
              </span>
              
              <div className="orders-page-size-selector">
                <span>Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="orders-page-size-select"
                >
                  <option value={5}>5 / hal</option>
                  <option value={8}>8 / hal</option>
                  <option value={15}>15 / hal</option>
                  <option value={25}>25 / hal</option>
                  <option value={50}>50 / hal</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="orders-pagination-controls">
                <button
                  className="orders-page-btn nav-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={validCurrentPage === 1}
                  title="Halaman Pertama"
                >
                  <MdFirstPage />
                </button>
                <button
                  className="orders-page-btn nav-btn"
                  onClick={() => handlePageChange(validCurrentPage - 1)}
                  disabled={validCurrentPage === 1}
                  title="Halaman Sebelumnya"
                >
                  <MdNavigateBefore />
                </button>

                <div className="orders-page-numbers">
                  {getPageNumbers().map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${idx}`} className="orders-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={`page-${pageNum}`}
                        className={`orders-page-btn num-btn ${validCurrentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                </div>

                <button
                  className="orders-page-btn nav-btn"
                  onClick={() => handlePageChange(validCurrentPage + 1)}
                  disabled={validCurrentPage === totalPages}
                  title="Halaman Selanjutnya"
                >
                  <MdNavigateNext />
                </button>
                <button
                  className="orders-page-btn nav-btn"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={validCurrentPage === totalPages}
                  title="Halaman Terakhir"
                >
                  <MdLastPage />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* In-Context Add Food Modal */}
      {isManager && showAddModal && (
        <AddFoodModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchList}
        />
      )}

      {/* Quick Edit Food Modal */}
      {isManager && selectedEditFood && (
        <EditFoodModal
          food={selectedEditFood}
          onClose={() => setSelectedEditFood(null)}
          onUpdated={fetchList}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {isManager && selectedDeleteFood && (
        <DeleteConfirmModal
          item={selectedDeleteFood}
          onConfirm={handleConfirmDelete}
          onCancel={() => setSelectedDeleteFood(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default List;
