import React from 'react';
import { MdDeleteForever, MdClose, MdWarningAmber } from 'react-icons/md';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ item, onConfirm, onCancel, deleting = false }) => {
  if (!item) return null;

  return (
    <div className="delete-modal-backdrop" onClick={onCancel}>
      <div className="delete-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="delete-modal-close-btn" onClick={onCancel} title="Batal (Esc)">
          <MdClose />
        </button>

        {/* Warning Icon Badge */}
        <div className="delete-modal-icon-wrapper">
          <div className="delete-warning-icon">
            <MdWarningAmber />
          </div>
        </div>

        {/* Modal Header */}
        <div className="delete-modal-header">
          <h3>Hapus Menu Makanan?</h3>
          <p>Tindakan ini permanen. Menu berikut akan dihapus dari daftar makanan dan aplikasi pemesanan.</p>
        </div>

        {/* Target Item Card Preview */}
        <div className="delete-item-preview-card">
          {item.image && (
            <img src={item.image} alt={item.name} className="delete-preview-thumb" />
          )}
          <div className="delete-preview-info">
            <h4 className="delete-preview-name">{item.name}</h4>
            <div className="delete-preview-meta">
              {item.category && (
                <span className="delete-preview-category">{item.category}</span>
              )}
              <span className="delete-preview-price">
                Rp {Number(item.price || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="delete-modal-actions">
          <button 
            type="button" 
            className="btn-cancel-delete" 
            onClick={onCancel}
            disabled={deleting}
          >
            Batal
          </button>
          
          <button 
            type="button" 
            className="btn-confirm-delete" 
            onClick={() => onConfirm(item._id)}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="delete-spinner"></span>
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <MdDeleteForever className="delete-action-icon" />
                <span>Ya, Hapus Menu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
