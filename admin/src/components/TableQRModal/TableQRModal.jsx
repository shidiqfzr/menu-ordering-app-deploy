import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { toast } from 'react-toastify';
import { 
  MdClose, 
  MdPrint, 
  MdFileDownload, 
  MdContentCopy, 
  MdOpenInNew,
  MdQrCodeScanner
} from 'react-icons/md';
import { assets } from '../../assets/assets';
import './TableQRModal.css';

const TableQRModal = ({ tableNumber, frontendUrl, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [wifiSSID, setWifiSSID] = useState(() => localStorage.getItem('cafe_wifi_ssid') || 'Bujang Cafe');
  const [wifiPass, setWifiPass] = useState(() => localStorage.getItem('cafe_wifi_pass') || 'bujang123');
  const [showWifiQR, setShowWifiQR] = useState(() => localStorage.getItem('cafe_wifi_show_qr') === 'true');
  const [wifiQrUrl, setWifiQrUrl] = useState('');

  const printRef = useRef(null);
  const tableUrl = `${frontendUrl}/?table=${tableNumber}`;

  // Generate Menu Table QR Code
  useEffect(() => {
    if (isOpen && tableNumber) {
      QRCode.toDataURL(tableUrl, {
        width: 420,
        margin: 1.5,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => {
          console.error('QR Code generation error:', err);
          toast.error('Gagal men-generate QR Code');
        });
    }
  }, [isOpen, tableNumber, tableUrl]);

  // Generate Wi-Fi Connect QR Code and persist settings
  useEffect(() => {
    localStorage.setItem('cafe_wifi_ssid', wifiSSID);
    localStorage.setItem('cafe_wifi_pass', wifiPass);
    localStorage.setItem('cafe_wifi_show_qr', showWifiQR ? 'true' : 'false');

    if (wifiSSID) {
      const wifiPayload = `WIFI:S:${wifiSSID};T:WPA;P:${wifiPass};;`;
      QRCode.toDataURL(wifiPayload, {
        width: 220,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setWifiQrUrl(url))
        .catch(console.error);
    }
  }, [wifiSSID, wifiPass, showWifiQR]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-table-tent');
    if (!printContent) {
      toast.error('Gagal menemukan template cetak');
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak Stand Meja ${tableNumber} - Bujang Cafe</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 12mm;
              }
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                min-height: 100vh;
                background: #ffffff;
                padding-top: 15px;
              }
              .print-cut-note {
                font-size: 11px;
                color: #64748b;
                margin-bottom: 12px;
                text-align: center;
                font-style: italic;
              }
              .table-tent-card {
                width: 310px;
                padding: 22px 20px 18px;
                border-radius: 16px;
                border: 1.5px solid #cbd5e1;
                outline: 1.5px dashed #94a3b8;
                outline-offset: 6px;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                background: #ffffff;
              }
              .tent-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 10px;
              }
              .tent-logo {
                height: 38px;
                object-fit: contain;
                margin-bottom: 4px;
              }
              .tent-tagline {
                font-size: 11.5px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.8px;
              }
              .tent-qr-box {
                width: 190px;
                height: 190px;
                background: #ffffff;
                border-radius: 12px;
                padding: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1.5px solid #e2e8f0;
                margin-bottom: 10px;
              }
              .tent-qr-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
              .tent-footer {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 7px;
                width: 100%;
              }
              .tent-table-pill {
                background: #ff6347 !important;
                color: #ffffff !important;
                padding: 5px 18px;
                border-radius: 50px;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                box-shadow: 0 2px 8px rgba(255, 99, 71, 0.3);
              }
              .tent-table-pill span {
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 1px;
                color: #ffffff !important;
              }
              .tent-table-pill b {
                font-size: 17px;
                font-weight: 900;
                color: #ffffff !important;
              }
              .tent-instruction-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-top: 4px;
                width: 100%;
                max-width: 240px;
              }
              .tent-step-item {
                display: flex;
                align-items: center;
                gap: 8px;
                text-align: left;
              }
              .tent-step-badge {
                width: 17px;
                height: 17px;
                border-radius: 50%;
                background: #f1f5f9 !important;
                color: #475569 !important;
                font-size: 10px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                border: 1px solid #cbd5e1;
              }
              .tent-step-text {
                font-size: 10.5px;
                color: #334155;
                line-height: 1.35;
                font-weight: 500;
              }
              .tent-wifi-box {
                margin-top: 6px;
                padding: 8px 12px;
                background: #f8fafc !important;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                width: 100%;
                max-width: 250px;
                display: flex;
                flex-direction: column;
                gap: 3px;
                text-align: center;
              }
              .tent-wifi-box:not(.with-qr) {
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 10px 14px;
              }
              .tent-wifi-box:not(.with-qr) .tent-wifi-text-col {
                align-items: center;
                text-align: center;
                width: 100%;
              }
              .tent-wifi-box:not(.with-qr) .tent-wifi-row-title {
                justify-content: center;
                width: 100%;
              }
              .tent-wifi-box:not(.with-qr) .tent-wifi-row-pass {
                text-align: center;
                width: 100%;
              }
              .tent-wifi-box.with-qr {
                display: grid;
                grid-template-columns: auto 1fr;
                align-items: center;
                gap: 10px;
                text-align: left;
              }
              .tent-wifi-qr-col {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
              }
              .tent-wifi-qr-img {
                width: 58px;
                height: 58px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
              }
              .tent-wifi-qr-sub {
                font-size: 8px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
              }
              .tent-wifi-text-col {
                display: flex;
                flex-direction: column;
                gap: 2px;
              }
              .tent-wifi-row-title {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 10.5px;
                font-weight: 700;
                color: #0f172a;
              }
              .tent-wifi-row-pass {
                font-size: 10px;
                color: #475569;
              }
              .tent-wifi-pass-code {
                font-weight: 700;
                color: #0f172a;
                font-family: monospace;
              }
              .tent-sub-footer {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                margin-top: 6px;
                padding-top: 6px;
                border-top: 1px dashed #e2e8f0;
                width: 100%;
                font-size: 9.5px;
                color: #64748b;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="print-cut-note">✂️ Gunting mengikuti garis luar untuk dimasukkan ke Stand Akrilik Meja (A6)</div>
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    } catch (err) {
      console.error('Iframe print error, falling back to window.print():', err);
      window.print();
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Meja_${tableNumber}_BujangCafe.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengunduh QR Code Meja ${tableNumber}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tableUrl);
    toast.success(`Link pemesanan Meja ${tableNumber} disalin ke clipboard!`);
  };

  return (
    <div className="table-qr-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="table-qr-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="table-qr-modal-header">
          <div className="tq-header-title">
            <MdQrCodeScanner className="tq-title-icon" />
            <div>
              <h3>QR Code Meja {tableNumber}</h3>
              <p>Template stand akrilik meja siap cetak</p>
            </div>
          </div>
          <button className="tq-close-btn" onClick={onClose} title="Tutup">
            <MdClose />
          </button>
        </div>

        {/* Modal Body: 2-Column Responsive Layout */}
        <div className="table-qr-body">
          {/* Left Column: Visual Acrylic Stand Preview */}
          <div className="table-qr-preview-pane">
            <div className="table-tent-card" id="printable-table-tent" ref={printRef}>
              <div className="tent-header">
                <img src={assets.logo} alt="Bujang Cafe" className="tent-logo" />
                <p className="tent-tagline">Pesan & Bayar Dari Meja</p>
              </div>

              <div className="tent-qr-box">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR Meja ${tableNumber}`} className="tent-qr-image" />
                ) : (
                  <div className="tent-qr-placeholder">Membuat QR...</div>
                )}
              </div>

              <div className="tent-footer">
                <div className="tent-table-pill">
                  <span>MEJA</span>
                  <b>{String(tableNumber).padStart(2, '0')}</b>
                </div>

                <div className="tent-instruction-list">
                  <div className="tent-step-item">
                    <span className="tent-step-badge">1</span>
                    <span className="tent-step-text">Buka kamera HP atau scanner</span>
                  </div>
                  <div className="tent-step-item">
                    <span className="tent-step-badge">2</span>
                    <span className="tent-step-text">Arahkan kamera ke QR Code</span>
                  </div>
                  <div className="tent-step-item">
                    <span className="tent-step-badge">3</span>
                    <span className="tent-step-text">Pilih menu & bayar langsung</span>
                  </div>
                </div>

                {/* Wi-Fi Credentials Box on Standee */}
                <div className={`tent-wifi-box ${showWifiQR && wifiQrUrl ? 'with-qr' : ''}`}>
                  {showWifiQR && wifiQrUrl && (
                    <div className="tent-wifi-qr-col">
                      <img src={wifiQrUrl} alt="QR Wi-Fi" className="tent-wifi-qr-img" />
                      <span className="tent-wifi-qr-sub">Scan Wi-Fi</span>
                    </div>
                  )}
                  <div className="tent-wifi-text-col">
                    <div className="tent-wifi-row-title">
                      <span>Wi-Fi: <b>{wifiSSID || 'Kafe'}</b></span>
                    </div>
                    <div className="tent-wifi-row-pass">
                      <span>Sandi: </span>
                      <code className="tent-wifi-pass-code">{wifiPass || '(Tanpa Sandi)'}</code>
                    </div>
                  </div>
                </div>

                <div className="tent-sub-footer">
                  <span>Panggil staf bila butuh bantuan</span>
                </div>
              </div>
            </div>
            <span className="stand-preview-label">Preview Stand Akrilik (A6)</span>
          </div>

          {/* Right Column: Controls & Actions Pane */}
          <div className="table-qr-controls-pane">
            <div className="tq-info-section">
              {/* Table Status Indicator */}
              <div className="tq-table-indicator">
                <span className="tq-indicator-dot" />
                <div>
                  <h4 className="tq-table-heading">Meja {tableNumber}</h4>
                  <span className="tq-table-sub">Siap dicetak atau dibagikan langsung</span>
                </div>
              </div>

              {/* Inline URL Input with Copy Button */}
              <div className="tq-url-card">
                <label className="tq-field-label">Link Pemesanan Langsung:</label>
                <div className="tq-url-input-group">
                  <input 
                    type="text" 
                    readOnly 
                    value={tableUrl} 
                    className="tq-url-input"
                    title={tableUrl}
                  />
                  <button 
                    type="button" 
                    className="tq-url-copy-btn" 
                    onClick={handleCopyLink}
                    title="Salin Link Pemesanan"
                  >
                    <MdContentCopy />
                    <span>Salin</span>
                  </button>
                </div>
              </div>

              {/* Wi-Fi Settings Section */}
              <div className="tq-wifi-settings-card">
                <div className="tq-wifi-card-header">
                  <span className="tq-wifi-icon">📶</span>
                  <div>
                    <h5 className="tq-wifi-card-title">Informasi Wi-Fi di Stand</h5>
                    <span className="tq-wifi-card-sub">Otomatis tercetak di stand meja</span>
                  </div>
                </div>

                <div className="tq-wifi-fields-grid">
                  <div className="tq-wifi-field">
                    <label className="tq-field-label">Nama Wi-Fi (SSID):</label>
                    <input 
                      type="text" 
                      value={wifiSSID}
                      onChange={(e) => setWifiSSID(e.target.value)}
                      placeholder="Contoh: Bujang Cafe"
                      className="tq-wifi-input"
                    />
                  </div>
                  <div className="tq-wifi-field">
                    <label className="tq-field-label">Password Wi-Fi:</label>
                    <input 
                      type="text" 
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      placeholder="Contoh: bujang123"
                      className="tq-wifi-input"
                    />
                  </div>
                </div>

                <label className="tq-checkbox-label">
                  <input 
                    type="checkbox"
                    checked={showWifiQR}
                    onChange={(e) => setShowWifiQR(e.target.checked)}
                    className="tq-checkbox"
                  />
                  <span>Sertakan <b>QR Code Wi-Fi</b> di stand (pelanggan bisa scan langsung connect)</span>
                </label>
              </div>

              {/* Print Guidance Card */}
              <div className="tq-print-guide">
                <div className="tq-guide-text">
                  <b>Rekomendasi Cetak:</b> Ukuran standar <b>A6 (105 × 148 mm)</b> pada kertas foto/karton tebal untuk dimasukkan ke stand akrilik meja.
                </div>
              </div>
            </div>

            {/* Streamlined Action Buttons */}
            <div className="tq-actions-section">
              <button type="button" className="tq-btn-primary" onClick={handlePrint}>
                <MdPrint className="tq-btn-icon" />
                <span>Cetak Stand Meja (A6)</span>
              </button>

              <button type="button" className="tq-btn-secondary" onClick={handleDownload}>
                <MdFileDownload className="tq-btn-icon" />
                <span>Unduh Gambar PNG</span>
              </button>

              <a 
                href={tableUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tq-simulate-link"
                title="Buka menu pelanggan di tab baru untuk simulasi scan"
              >
                <span>Buka simulasi menu pelanggan</span>
                <MdOpenInNew className="tq-link-icon" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableQRModal;
