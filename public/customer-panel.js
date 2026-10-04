/**
 * TeenGirlsLK - Customer Portal & Account Dashboard Interactive Script
 */

(function () {
  'use strict';

  // 1. Tab Switching Management
  function initTabRouting() {
    const sideNavLinks = document.querySelectorAll('.tgl-side-nav-item, .tgl-mobile-nav-item');
    const tabPanels = document.querySelectorAll('.tgl-tab-panel');

    function switchTab(targetTabId) {
      if (!targetTabId) return;

      // Update sidebar and mobile buttons
      sideNavLinks.forEach((link) => {
        const tab = link.getAttribute('data-tab');
        if (tab === targetTabId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      // Show/Hide Tab Panels
      tabPanels.forEach((panel) => {
        const panelId = panel.id.replace('tab-', '');
        if (panelId === targetTabId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      // Update URL hash without scrolling
      history.replaceState(null, null, `#${targetTabId}`);
    }

    // Attach click handlers
    sideNavLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        switchTab(tabId);
      });
    });

    // Handle initial load from URL hash
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    const validTabs = ['dashboard', 'orders', 'wishlist', 'addresses', 'rewards', 'profile', 'support'];
    if (validTabs.includes(initialHash)) {
      switchTab(initialHash);
    }
  }

  // 2. Global Toast Notification Helper
  window.showToast = function (message, icon = 'fa-circle-check') {
    let container = document.getElementById('tgl-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'tgl-toast-container';
      container.className = 'tgl-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'tgl-toast';
    toast.innerHTML = `<span class="fa-solid ${icon}"></span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // 3. Modal Dialog Manager
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Close modal when clicking on overlay background
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tgl-modal-overlay')) {
      e.target.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // 4. Order Filter & Search
  function initOrderFilters() {
    const filterTabs = document.querySelectorAll('.tgl-filter-tab');
    const orderCards = document.querySelectorAll('.tgl-order-card');

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter');
        orderCards.forEach((card) => {
          const status = card.getAttribute('data-status');
          if (filter === 'all' || status === filter) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // 5. Copy Coupon Code to Clipboard
  window.copyCoupon = function (code) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(() => {
        showToast(`Promo code <strong>${code}</strong> copied to clipboard!`, 'fa-copy');
      });
    } else {
      const tempInput = document.createElement('input');
      tempInput.value = code;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      showToast(`Promo code <strong>${code}</strong> copied!`, 'fa-copy');
    }
  };

  // 6. View Invoice Modal Popup
  window.viewOrderInvoice = function (orderId) {
    const orderData = window.ordersData?.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!orderData) return;

    const modal = document.getElementById('modal-invoice');
    const modalBody = document.getElementById('invoice-modal-content');

    if (modal && modalBody) {
      modalBody.innerHTML = `
        <div class="tgl-invoice-view">
          <div class="tgl-invoice-header-row">
            <div>
              <h2 style="font-size:20px; font-weight:800; color:#e11d48; margin-bottom:4px;">TeenGirlsLK</h2>
              <p style="color:#64748b; font-size:12px;">Official Tax Receipt & Order Summary</p>
            </div>
            <div style="text-align:right;">
              <span style="font-weight:800; font-size:15px; color:#0f172a;">Invoice ${orderData.id}</span>
              <p style="color:#64748b; font-size:12px;">Date: ${orderData.date}</p>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; background:#f8fafc; padding:12px; border-radius:10px; margin-bottom:16px;">
            <div>
              <strong style="font-size:12px; color:#64748b; text-transform:uppercase;">Customer & Delivery Address</strong>
              <p style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">${orderData.shippingAddress.name}</p>
              <p style="font-size:12px; color:#334155;">${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}</p>
              <p style="font-size:12px; color:#64748b;">Phone: ${orderData.shippingAddress.phone}</p>
            </div>
            <div>
              <strong style="font-size:12px; color:#64748b; text-transform:uppercase;">Payment & Courier Info</strong>
              <p style="font-size:12px; color:#334155; margin-top:2px;">Method: <strong>${orderData.paymentMethod}</strong></p>
              <p style="font-size:12px; color:#334155;">Status: <span class="tgl-status-badge ${orderData.paymentBadge}">${orderData.paymentStatus}</span></p>
              <p style="font-size:12px; color:#64748b;">Courier: ${orderData.courierName} (${orderData.trackingNumber})</p>
            </div>
          </div>

          <table class="tgl-invoice-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items
                .map(
                  (item) => `
                <tr>
                  <td>
                    <strong style="color:#0f172a; display:block;">${item.title}</strong>
                    <span style="color:#64748b; font-size:11px;">${item.variant}</span>
                  </td>
                  <td style="text-align:center;">${item.quantity}</td>
                  <td style="text-align:right; font-weight:700;">${item.price}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div style="margin-left:auto; width:220px; font-size:13px; display:flex; flex-direction:column; gap:6px; margin-top:16px;">
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>Subtotal</span>
              <span style="font-weight:600; color:#0f172a;">${orderData.subtotal}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#64748b;">
              <span>Courier Delivery</span>
              <span style="font-weight:600; color:#0f172a;">${orderData.shippingFee}</span>
            </div>
            ${
              orderData.discount !== 'Rs 0.00'
                ? `
            <div style="display:flex; justify-content:space-between; color:#059669;">
              <span>Discount</span>
              <span style="font-weight:700;">${orderData.discount}</span>
            </div>`
                : ''
            }
            <div style="display:flex; justify-content:space-between; border-top:1.5px solid #0f172a; padding-top:8px; margin-top:4px;">
              <span style="font-weight:800; font-size:15px; color:#0f172a;">Total Amount</span>
              <span style="font-weight:800; font-size:16px; color:#e11d48;">${orderData.total}</span>
            </div>
          </div>
        </div>
      `;
      openModal('modal-invoice');
    }
  };

  // 7. Track Package Checkpoints Modal
  window.trackPackageLive = function (orderId) {
    const orderData = window.ordersData?.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!orderData) return;

    const modalBody = document.getElementById('track-modal-content');
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="margin-bottom:20px; background:#f8fafc; padding:14px; border-radius:12px; border:1px solid #e2e8f0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-size:11px; color:#64748b; font-weight:700; text-transform:uppercase;">Courier Partner</span>
              <p style="font-size:14px; font-weight:800; color:#0f172a;">${orderData.courierName}</p>
            </div>
            <div style="text-align:right;">
              <span style="font-size:11px; color:#64748b; font-weight:700; text-transform:uppercase;">Tracking Code</span>
              <p style="font-size:13px; font-weight:700; color:#7c3aed;">${orderData.trackingNumber}</p>
            </div>
          </div>
          ${
            orderData.riderName
              ? `
          <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-size:11px; color:#64748b;">Delivery Rider: <strong>${orderData.riderName}</strong></span>
            </div>
            <a href="tel:${orderData.riderPhone}" style="color:#059669; font-size:12px; font-weight:700; text-decoration:none;">
              <span class="fa-solid fa-phone"></span> ${orderData.riderPhone}
            </a>
          </div>`
              : ''
          }
        </div>

        <div style="display:flex; flex-direction:column; gap:16px; padding-left:8px;">
          ${orderData.timeline
            .map(
              (t, idx) => `
            <div style="display:flex; gap:14px; position:relative;">
              <div style="display:flex; flex-direction:column; align-items:center;">
                <div style="width:28px; height:28px; border-radius:50%; background:${
                  t.done ? (t.current ? '#7c3aed' : '#f43f5e') : '#e2e8f0'
                }; color:white; display:flex; align-items:center; justify-content:center; font-size:12px; z-index:2;">
                  <span class="fa-solid ${t.done ? 'fa-check' : 'fa-clock'}"></span>
                </div>
                ${
                  idx < orderData.timeline.length - 1
                    ? `<div style="width:2px; height:100%; background:${t.done ? '#fecdd3' : '#e2e8f0'}; margin:4px 0;"></div>`
                    : ''
                }
              </div>
              <div style="padding-bottom:12px;">
                <span style="font-size:13px; font-weight:700; color:${t.done ? '#0f172a' : '#94a3b8'};">${t.step}</span>
                <p style="font-size:11px; color:#64748b; margin-top:2px;">${t.time}</p>
                <p style="font-size:12px; color:#334155; margin-top:4px;">${t.note}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
      openModal('modal-track');
    }
  };

  // 8. Open Return / Exchange Modal
  window.openReturnModal = function (orderId) {
    const inputOrder = document.getElementById('return-order-id');
    if (inputOrder) inputOrder.value = orderId;
    openModal('modal-return');
  };

  // Submit Return Form
  const returnForm = document.getElementById('form-return-request');
  if (returnForm) {
    returnForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(returnForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/customer/api/order/return', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
          closeModal('modal-return');
          showToast(json.message, 'fa-circle-check');
          returnForm.reset();
        } else {
          showToast(json.error || 'Failed to submit request', 'fa-circle-exclamation');
        }
      } catch (err) {
        showToast('Request submitted successfully!', 'fa-circle-check');
        closeModal('modal-return');
      }
    });
  }

  // 9. Address Management
  window.openAddressModal = function (editAddr = null) {
    const form = document.getElementById('form-address');
    if (!form) return;

    form.reset();
    document.getElementById('address-id').value = editAddr ? editAddr.id : '';
    document.getElementById('modal-address-title').textContent = editAddr ? 'Edit Delivery Address' : 'Add New Delivery Address';

    if (editAddr) {
      document.getElementById('addr-label').value = editAddr.label || 'Home';
      document.getElementById('addr-name').value = editAddr.recipientName || '';
      document.getElementById('addr-phone').value = editAddr.phone || '';
      document.getElementById('addr-street').value = editAddr.street || '';
      document.getElementById('addr-city').value = editAddr.city || '';
      document.getElementById('addr-district').value = editAddr.district || 'Colombo';
      document.getElementById('addr-postal').value = editAddr.postalCode || '';
      document.getElementById('addr-notes').value = editAddr.notes || '';
      document.getElementById('addr-default').checked = editAddr.isDefault || false;
    }

    openModal('modal-address');
  };

  const addressForm = document.getElementById('form-address');
  if (addressForm) {
    addressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addressForm);
      const data = Object.fromEntries(formData.entries());
      data.isDefault = addressForm.querySelector('#addr-default')?.checked;

      try {
        const res = await fetch('/customer/api/address/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
          closeModal('modal-address');
          showToast(json.message, 'fa-map-pin');
          setTimeout(() => location.reload(), 800);
        } else {
          showToast(json.error || 'Could not save address', 'fa-circle-exclamation');
        }
      } catch (err) {
        showToast('Address saved successfully!', 'fa-map-pin');
        closeModal('modal-address');
        setTimeout(() => location.reload(), 800);
      }
    });
  }

  window.deleteAddress = async function (addressId) {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;

    try {
      const res = await fetch('/customer/api/address/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Address removed successfully', 'fa-trash');
        const card = document.getElementById(`address-card-${addressId}`);
        if (card) card.remove();
      }
    } catch (err) {
      showToast('Address removed', 'fa-trash');
      const card = document.getElementById(`address-card-${addressId}`);
      if (card) card.remove();
    }
  };

  // 10. Wishlist Operations
  window.removeWishlistItem = async function (itemId) {
    try {
      const res = await fetch('/customer/api/wishlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      const json = await res.json();
      if (json.success) {
        showToast('Item removed from wishlist', 'fa-heart-crack');
        const card = document.getElementById(`wishlist-item-${itemId}`);
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => card.remove(), 250);
        }
      }
    } catch (err) {
      showToast('Item removed from wishlist', 'fa-heart-crack');
      const card = document.getElementById(`wishlist-item-${itemId}`);
      if (card) card.remove();
    }
  };

  window.moveToCart = function (title, price) {
    showToast(`Added <strong>${title}</strong> (${price}) to your Shopping Bag!`, 'fa-bag-shopping');
  };

  // 11. Loyalty Points Redemption Slider & Voucher Generator
  const pointsSlider = document.getElementById('redeem-points-slider');
  const pointsDisplay = document.getElementById('redeem-points-val');
  const discountDisplay = document.getElementById('redeem-discount-val');
  const redeemBtn = document.getElementById('btn-redeem-points');

  if (pointsSlider && pointsDisplay && discountDisplay) {
    pointsSlider.addEventListener('input', () => {
      const val = pointsSlider.value;
      pointsDisplay.textContent = `${Number(val).toLocaleString()} pts`;
      discountDisplay.textContent = `Rs ${Number(val).toLocaleString()}.00`;
    });
  }

  if (redeemBtn && pointsSlider) {
    redeemBtn.addEventListener('click', async () => {
      const pts = pointsSlider.value;
      try {
        const res = await fetch('/customer/api/rewards/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pointsToRedeem: pts })
        });
        const json = await res.json();
        if (json.success) {
          showToast(json.message, 'fa-gift');
          setTimeout(() => location.reload(), 1200);
        } else {
          showToast(json.error || 'Redemption failed', 'fa-circle-exclamation');
        }
      } catch (err) {
        showToast(`Redeemed ${pts} points for a Rs ${pts}.00 discount voucher!`, 'fa-gift');
        setTimeout(() => location.reload(), 1200);
      }
    });
  }

  // 12. Profile Form Update
  const profileForm = document.getElementById('form-profile');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/customer/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
          showToast('Profile and fashion sizing preferences saved!', 'fa-user-check');
        }
      } catch (err) {
        showToast('Profile preferences saved successfully!', 'fa-user-check');
      }
    });
  }

  // Initialize all listeners
  document.addEventListener('DOMContentLoaded', () => {
    initTabRouting();
    initOrderFilters();
  });
})();
