/* ═══════════════════════════════════════════════════════════
   ZEE-PNG — Main Application Script
   Author: ZEE-PNG Team
   Description: Handles all interactive functionality including:
     - Animated particles system
     - Navbar scroll behaviour
     - Mobile menu toggle
     - Drag & drop + file upload
     - Image compression (Canvas API)
     - Preview rendering & stats
     - FAQ accordion
     - Scroll reveal animations
     - Stats counter animation
     - Quality slider styling
═══════════════════════════════════════════════════════════ */

'use strict';

/* ────────────────────────────────────────────
   1. DOM READY GUARD
──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  initParticles();
  initNavbar();
  initMobileMenu();
  initUploader();
  initCompressor();
  initFAQ();
  initScrollReveal();
  initStatsCounter();
  initSlider();
  setFooterYear();

});

/* ────────────────────────────────────────────
   2. ANIMATED PARTICLES
──────────────────────────────────────────── */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const PARTICLE_COUNT = 40;
  const COLORS = [
    'rgba(124,58,237,0.6)',
    'rgba(6,182,212,0.5)',
    'rgba(37,99,235,0.5)',
    'rgba(167,139,250,0.4)',
    'rgba(96,165,250,0.4)',
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');

    // Random size between 2px and 6px
    const size  = Math.random() * 4 + 2;
    // Random horizontal position
    const left  = Math.random() * 100;
    // Random animation duration between 8–24 seconds
    const dur   = Math.random() * 16 + 8;
    // Random delay so they don't all start together
    const delay = Math.random() * 20;
    // Random colour
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    Object.assign(p.style, {
      width:            `${size}px`,
      height:           `${size}px`,
      left:             `${left}%`,
      background:       color,
      animationDuration:`${dur}s`,
      animationDelay:   `${delay}s`,
      boxShadow:        `0 0 ${size * 3}px ${color}`,
    });

    container.appendChild(p);
  }
}

/* ────────────────────────────────────────────
   3. NAVBAR — SCROLL BEHAVIOUR
──────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // check on load
}

/* ────────────────────────────────────────────
   4. MOBILE MENU TOGGLE
──────────────────────────────────────────── */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

/* ────────────────────────────────────────────
   5. IMAGE UPLOADER (drag & drop + browse)
──────────────────────────────────────────── */

// State object — holds everything about the current image session
const state = {
  originalFile:    null,   // File object
  originalDataURL: null,   // Data URL of original
  originalSize:    0,      // Bytes
  compressedBlob:  null,   // Blob of compressed result
  compressedURL:   null,   // Object URL of compressed result
  mimeType:        'image/jpeg',
  quality:         0.75,
};

function initUploader() {
  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  if (!uploadZone || !fileInput) return;

  // ── Click on zone → trigger file picker
  uploadZone.addEventListener('click', (e) => {
    // Prevent double-trigger when clicking the label/button inside
    if (e.target.closest('label') || e.target.closest('input')) return;
    fileInput.click();
  });

  // ── File selected via browse
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      loadImage(fileInput.files[0]);
    }
  });

  // ── Drag & Drop events
  ['dragenter', 'dragover'].forEach(evt => {
    uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
  });

  ['dragleave', 'dragend'].forEach(evt => {
    uploadZone.addEventListener(evt, () => {
      uploadZone.classList.remove('dragover');
    });
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file && isValidImageType(file)) {
      loadImage(file);
    } else {
      showToast('❌ Please drop a JPG, PNG, or WEBP image.', 'error');
    }
  });

  // ── Reset button
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSession);
  }
}

/* Validate file type */
function isValidImageType(file) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

/* Load image into state and show workspace */
function loadImage(file) {
  if (!isValidImageType(file)) {
    showToast('❌ Unsupported format. Use JPG, PNG, or WEBP.', 'error');
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    showToast('❌ File too large. Maximum size is 25 MB.', 'error');
    return;
  }

  state.originalFile = file;
  state.originalSize = file.size;
  state.compressedBlob = null;
  state.compressedURL  = null;

  // Set default output format based on input
  const formatRadio = document.querySelector(`input[name="format"][value="${file.type}"]`);
  if (formatRadio) {
    formatRadio.checked = true;
    state.mimeType = file.type;
  } else {
    // Default to JPEG if input type not available
    document.querySelector('input[name="format"][value="image/jpeg"]').checked = true;
    state.mimeType = 'image/jpeg';
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    state.originalDataURL = e.target.result;

    // Render original preview
    const originalPreview  = document.getElementById('originalPreview');
    const originalSizeEl   = document.getElementById('originalSize');
    const originalDimEl    = document.getElementById('originalDimensions');
    const formatBadge      = document.getElementById('formatBadge');

    originalPreview.src = state.originalDataURL;
    originalSizeEl.textContent = formatBytes(state.originalSize);

    // Get image dimensions
    const img = new Image();
    img.onload = () => {
      originalDimEl.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;
    };
    img.src = state.originalDataURL;

    // Format badge
    formatBadge.innerHTML = '';
    const pill = document.createElement('span');
    pill.classList.add('format-badge-pill', `format-badge-pill--${getFormatKey(file.type)}`);
    pill.textContent = getFormatLabel(file.type);
    formatBadge.appendChild(pill);

    // Reset compressed side
    const compressedPreview  = document.getElementById('compressedPreview');
    const compressedSizeEl   = document.getElementById('compressedSize');
    const savedBadge         = document.getElementById('savedBadge');
    const downloadBtn        = document.getElementById('downloadBtn');
    const statsRow           = document.getElementById('statsRow');
    const previewPlaceholder = document.getElementById('previewPlaceholder');

    compressedPreview.src = '';
    compressedSizeEl.textContent = '—';
    savedBadge.style.display = 'none';
    downloadBtn.style.display = 'none';
    statsRow.style.display = 'none';
    previewPlaceholder.style.display = 'flex';

    // Show workspace, hide upload zone
    document.getElementById('uploadZone').style.display = 'none';
    document.getElementById('workspace').style.display  = 'block';

    // Smooth scroll to tool
    document.getElementById('tool').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  reader.readAsDataURL(file);
}

/* Reset entire session */
function resetSession() {
  state.originalFile    = null;
  state.originalDataURL = null;
  state.originalSize    = 0;
  state.compressedBlob  = null;

  if (state.compressedURL) {
    URL.revokeObjectURL(state.compressedURL);
    state.compressedURL = null;
  }

  document.getElementById('uploadZone').style.display = 'flex';
  document.getElementById('workspace').style.display  = 'none';
  document.getElementById('fileInput').value = '';

  // Reset slider
  const slider = document.getElementById('qualitySlider');
  if (slider) {
    slider.value = 75;
    updateSliderUI(slider);
  }
}

/* ────────────────────────────────────────────
   6. IMAGE COMPRESSOR (Canvas API)
──────────────────────────────────────────── */
function initCompressor() {
  const compressBtn = document.getElementById('compressBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const formatRadios = document.querySelectorAll('input[name="format"]');

  if (!compressBtn) return;

  // Listen for format change
  formatRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      state.mimeType = radio.value;
    });
  });

  // Compress button
  compressBtn.addEventListener('click', async () => {
    if (!state.originalDataURL) {
      showToast('⚠️ Please upload an image first.', 'error');
      return;
    }
    await runCompression();
  });

  // Download button
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!state.compressedBlob) return;

      if (state.compressedURL) URL.revokeObjectURL(state.compressedURL);
      state.compressedURL = URL.createObjectURL(state.compressedBlob);

      const ext   = getExtension(state.mimeType);
      const name  = (state.originalFile?.name || 'zeepng').replace(/\.[^.]+$/, '');
      const a     = document.createElement('a');
      a.href      = state.compressedURL;
      a.download  = `${name}_zeepng_compressed.${ext}`;
      a.click();

      showToast('✅ Download started!', 'success');
    });
  }
}

/* Core compression function */
async function runCompression() {
  const compressBtn        = document.getElementById('compressBtn');
  const btnLoading         = document.getElementById('btnLoading');
  const compressedPreview  = document.getElementById('compressedPreview');
  const compressedSizeEl   = document.getElementById('compressedSize');
  const savedBadge         = document.getElementById('savedBadge');
  const downloadBtn        = document.getElementById('downloadBtn');
  const statsRow           = document.getElementById('statsRow');
  const previewPlaceholder = document.getElementById('previewPlaceholder');

  // Quality from slider (0–1 float)
  const sliderEl = document.getElementById('qualitySlider');
  state.quality  = parseInt(sliderEl.value, 10) / 100;

  // UI: show loading state
  compressBtn.disabled = true;
  if (btnLoading) btnLoading.style.display = 'inline-flex';
  compressBtn.querySelector('span').textContent = 'Compressing…';

  const startTime = performance.now();

  try {
    const blob = await compressImageBlob(
      state.originalDataURL,
      state.mimeType,
      state.quality
    );

    const elapsed = Math.round(performance.now() - startTime);

    state.compressedBlob = blob;

    // Revoke old URL
    if (state.compressedURL) URL.revokeObjectURL(state.compressedURL);
    state.compressedURL = URL.createObjectURL(blob);

    // Update preview
    compressedPreview.src = state.compressedURL;
    previewPlaceholder.style.display = 'none';

    // Sizes & saving
    const savedBytes   = state.originalSize - blob.size;
    const savedPercent = ((savedBytes / state.originalSize) * 100).toFixed(1);

    compressedSizeEl.textContent = formatBytes(blob.size);

    // Saved badge
    savedBadge.innerHTML = `<i class="fa-solid fa-circle-arrow-down"></i> ${savedPercent}% smaller`;
    savedBadge.style.display = 'inline-flex';

    // Stats row
    document.getElementById('st-original').textContent   = formatBytes(state.originalSize);
    document.getElementById('st-compressed').textContent = formatBytes(blob.size);
    document.getElementById('st-saved').textContent      = `${savedPercent}%`;
    document.getElementById('st-time').textContent       = `${elapsed} ms`;
    statsRow.style.display = 'grid';

    // Show download
    downloadBtn.style.display = 'inline-flex';

    showToast(`🎉 Compressed! Saved ${savedPercent}% (${formatBytes(savedBytes)})`, 'success');

  } catch (err) {
    console.error('Compression error:', err);
    showToast('❌ Compression failed. Please try another image.', 'error');
  } finally {
    // Restore button
    compressBtn.disabled = false;
    if (btnLoading) btnLoading.style.display = 'none';
    compressBtn.querySelector('span').textContent = 'Compress Image';
  }
}

/* Returns a Blob of the compressed image via Canvas API */
function compressImageBlob(dataURL, mimeType, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.getElementById('compressionCanvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // For PNG with transparency, add white background to prevent black artifacts in JPEG output
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else       reject(new Error('Canvas toBlob returned null'));
        },
        mimeType,
        // PNG doesn't use quality parameter, but passing it doesn't hurt
        quality
      );
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataURL;
  });
}

/* ────────────────────────────────────────────
   7. QUALITY SLIDER STYLING
──────────────────────────────────────────── */
function initSlider() {
  const slider    = document.getElementById('qualitySlider');
  const valueEl   = document.getElementById('sliderValue');
  if (!slider || !valueEl) return;

  slider.addEventListener('input', () => updateSliderUI(slider));
  updateSliderUI(slider); // init
}

function updateSliderUI(slider) {
  const valueEl = document.getElementById('sliderValue');
  const val     = slider.value;

  // Update label
  if (valueEl) valueEl.textContent = `${val}%`;

  // Update gradient fill (CSS custom property via inline style hack)
  slider.style.setProperty('--val', `${val}%`);

  // Reapply background (for cross-browser)
  slider.style.background = `linear-gradient(
    to right,
    var(--c-purple) 0%,
    var(--c-cyan) ${val}%,
    rgba(255,255,255,0.1) ${val}%
  )`;
}

/* ────────────────────────────────────────────
   8. FAQ ACCORDION
──────────────────────────────────────────── */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      items.forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = '0';
      });

      // Open clicked (if it was closed)
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ────────────────────────────────────────────
   9. SCROLL REVEAL ANIMATIONS
──────────────────────────────────────────── */
function initScrollReveal() {
  // Add 'reveal' class to elements we want to animate
  const targets = [
    '.feature-card',
    '.how-step',
    '.faq-item',
    '.stat-pill',
    '.section-header',
    '.dashboard-panel',
    '.cta-glass',
  ];

  targets.forEach((selector, groupIdx) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('reveal');
      if (i < 5) el.classList.add(`reveal--delay-${i + 1}`);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold:  0.12,
    rootMargin: '0px 0px -60px 0px',
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ────────────────────────────────────────────
   10. STATS COUNTER ANIMATION
──────────────────────────────────────────── */
function initStatsCounter() {
  const nums = document.querySelectorAll('.stats-num[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1800; // ms
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = Math.floor(eased * target);

        // Format large numbers
        el.textContent = formatStatNumber(current, target, suffix);

        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = formatStatNumber(target, target, suffix);
      };

      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(el => observer.observe(el));
}

function formatStatNumber(value, target, suffix) {
  // Special display rules
  if (suffix === 'K+') {
    // e.g. 250000 → "250K+"
    return `${Math.floor(value / 1000)}K+`;
  }
  if (suffix === '%') {
    return `${value}%`;
  }
  return value.toLocaleString();
}

/* ────────────────────────────────────────────
   11. TOAST NOTIFICATIONS
──────────────────────────────────────────── */
function showToast(message, type = 'success') {
  // Remove existing toast
  const existing = document.querySelector('.zeepng-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.classList.add('zeepng-toast');

  const bg = type === 'success'
    ? 'rgba(16,185,129,0.95)'
    : 'rgba(239,68,68,0.95)';

  Object.assign(toast.style, {
    position:       'fixed',
    bottom:         '28px',
    left:           '50%',
    transform:      'translateX(-50%) translateY(20px)',
    background:     bg,
    color:          '#fff',
    padding:        '14px 28px',
    borderRadius:   '50px',
    fontFamily:     "'Inter', sans-serif",
    fontSize:       '0.9rem',
    fontWeight:     '600',
    boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
    zIndex:         '9999',
    backdropFilter: 'blur(10px)',
    transition:     'all 0.3s ease',
    whiteSpace:     'nowrap',
    maxWidth:       '90vw',
    textAlign:      'center',
    opacity:        '0',
  });

  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  // Auto-dismiss after 3.5 seconds
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

/* ────────────────────────────────────────────
   12. FOOTER YEAR
──────────────────────────────────────────── */
function setFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ────────────────────────────────────────────
   HELPER UTILITIES
──────────────────────────────────────────── */

/**
 * Format bytes to human-readable string
 * e.g. 1048576 → "1.00 MB"
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k     = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get short key for MIME type (used for CSS class names)
 */
function getFormatKey(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
  };
  return map[mimeType] || 'jpg';
}

/**
 * Get display label for MIME type
 */
function getFormatLabel(mimeType) {
  const map = {
    'image/jpeg': 'JPEG',
    'image/png':  'PNG',
    'image/webp': 'WEBP',
  };
  return map[mimeType] || 'IMAGE';
}

/**
 * Get file extension for MIME type
 */
function getExtension(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
  };
  return map[mimeType] || 'jpg';
}
