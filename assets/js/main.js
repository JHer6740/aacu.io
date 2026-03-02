// =====================================================
// AACU Website - Main JavaScript
// Production-Ready Static Site
// =====================================================

const DAILY_CAROUSEL_IMAGE_COUNT = 5;
const IMAGE_LIBRARY = [
    './images/IMG_3742.JPG',
    './images/IMG_3744.JPG',
    './images/IMG_3754.JPG',
    './images/IMG_3757.JPG',
    './images/IMG_3758.JPG',
    './images/IMG_3760.JPG',
    './images/IMG_3766.JPG',
    './images/IMG_3776.JPG',
    './images/IMG_3777.JPG',
    './images/IMG_3778.JPG',
    './images/IMG_3780.JPG',
    './images/IMG_3782.JPG',
    './images/IMG_3786.JPG',
    './images/IMG_3789.JPG',
    './images/IMG_3791.JPG',
    './images/IMG_3795.JPG',
    './images/IMG_3799.JPG',
    './images/IMG_3804.JPG',
    './images/IMG_3807.JPG',
    './images/IMG_3810.JPG',
    './images/IMG_3813.JPG',
    './images/IMG_3817.JPG',
    './images/IMG_3818.JPG',
    './images/IMG_3820.JPG',
    './images/IMG_3821.JPG',
    './images/IMG_3822.JPG',
    './images/IMG_3823.JPG',
    './images/IMG_3824.JPG',
    './images/IMG_3825.JPG',
    './images/IMG_3829.JPG',
    './images/IMG_3830.JPG',
    './images/IMG_3831.JPG',
    './images/IMG_3833.JPG',
    './images/IMG_3836.JPG',
    './images/IMG_3837.JPG',
    './images/IMG_4423.JPG',
    './images/IMG_4697.JPG',
    './images/IMG_4698.JPG',
    './images/IMG_4701.JPG',
    './images/IMG_4705.JPG',
    './images/IMG_4710.JPG',
    './images/IMG_4720.JPG',
    './images/IMG_4725.JPG',
    './images/IMG_4745.JPG',
    './images/IMG_4748.JPG',
    './images/IMG_4749.JPG',
    './images/IMG_4750.JPG',
    './images/IMG_4751.JPG',
    './images/IMG_4754.JPG',
    './images/IMG_4756.JPG',
    './images/IMG_4760.JPG',
    './images/IMG_4763.JPG',
    './images/IMG_4764.JPG',
    './images/IMG_4765.JPG'
];

function hashDateToSeed(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    let hash = 0;

    for (let i = 0; i < dateKey.length; i += 1) {
        hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
        hash |= 0;
    }

    return hash >>> 0;
}

function createSeededRandom(seed) {
    let state = seed >>> 0;

    return function seededRandom() {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function getDailyShuffledImages() {
    const seed = hashDateToSeed(new Date());
    const random = createSeededRandom(seed);
    const shuffled = [...IMAGE_LIBRARY];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function getDailyCarouselImages() {
    const shuffled = getDailyShuffledImages();
    return shuffled.slice(0, Math.min(DAILY_CAROUSEL_IMAGE_COUNT, shuffled.length));
}

function getDailyGalleryImages() {
    const shuffled = getDailyShuffledImages();
    return shuffled.slice(Math.min(DAILY_CAROUSEL_IMAGE_COUNT, shuffled.length));
}

function hashString(value) {
    let hash = 0;

    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }

    return hash >>> 0;
}

/**
 * Daily Section Backgrounds
 * Applies per-section daily-random background photos on non-home pages.
 */
function initializeSectionBackgrounds() {
    const sections = Array.from(document.querySelectorAll('[data-daily-bg]'));
    if (!sections.length) return;

    const imagePool = getDailyShuffledImages();
    if (!imagePool.length) return;

    const pageOffset = hashString(window.location.pathname || '') % imagePool.length;

    sections.forEach((section, index) => {
        const imagePath = imagePool[(pageOffset + index) % imagePool.length];
        section.dataset.bgSrc = imagePath;
    });

    const applyBackground = (section) => {
        const source = section.dataset.bgSrc;
        if (!source || section.classList.contains('has-daily-bg')) return;
        section.style.backgroundImage = `linear-gradient(rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.58)), url("${source}")`;
        section.style.backgroundPosition = 'center';
        section.style.backgroundRepeat = 'no-repeat';
        section.style.backgroundSize = 'cover';
        section.classList.add('has-daily-bg');
    };

    if (!('IntersectionObserver' in window)) {
        sections.forEach(applyBackground);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            applyBackground(entry.target);
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.1,
        rootMargin: '180px 0px'
    });

    sections.forEach(section => observer.observe(section));
}

/**
 * Image Carousel / Slider
 * Auto-rotate through church photos with manual controls
 */
function initializeCarousel() {
    const slidesContainer = document.getElementById('carousel-slides');
    const dotsContainer = document.getElementById('carousel-dots');
    
    if (!slidesContainer || !dotsContainer) return;

    const imageList = getDailyCarouselImages();
    
    // Build carousel slides dynamically
    imageList.forEach((img, index) => {
        const photoMeta = getPhotoMetadata(img);
        const slide = document.createElement('div');
        slide.className = `slide ${index === 0 ? 'active' : ''}`;
        slide.setAttribute('data-index', index);
        
        // Keep first slide highest priority; remaining daily slides lazy-load.
        const shouldPreload = index === 0;
        slide.innerHTML = `
            <img src="${img}" alt="${photoMeta.caption}" ${shouldPreload ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
        `;
        slidesContainer.appendChild(slide);
        
        // Create navigation dot
        const dot = document.createElement('span');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('data-slide', index);
        dotsContainer.appendChild(dot);
    });
    
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    if (!slides.length) return;
    
    let currentSlide = 0;
    let autoPlayInterval;
    
    // Show specific slide
    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[n].classList.add('active');
        dots[n].classList.add('active');
    }
    
    // Next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
        resetAutoPlay();
    }
    
    // Previous slide
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
        resetAutoPlay();
    }
    
    // Auto-play slides every 5 seconds
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000);
    }
    
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }
    
    // Click handlers
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            resetAutoPlay();
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    });
    
    // Start auto-play
    startAutoPlay();
}

const PHOTO_EVENT_DETAILS = {
    '2023-12-24': {
        event: 'Church baptism service',
        eventSw: 'Huduma ya ubatizo wa kanisa',
        location: 'Newcastle Ocean Baths, Newcastle NSW'
    },
    '2024-12-22': {
        event: 'Church baptism service',
        eventSw: 'Huduma ya ubatizo wa kanisa',
        location: 'Newcastle Ocean Baths, Newcastle NSW'
    },
    '2025-04-19': {
        event: 'Church baptism service',
        eventSw: 'Huduma ya ubatizo wa kanisa',
        location: 'Newcastle Ocean Baths, Newcastle NSW'
    },
    unknown: {
        event: 'Church service or fellowship',
        eventSw: 'Ibada au ushirika wa kanisa',
        location: 'Shortland Public School, Shortland NSW'
    }
};

const PHOTOS_2024_12_22 = new Set([
    'IMG_4423.JPG'
]);

const PHOTO_METADATA_OVERRIDES = {
    'IMG_4423.JPG': {
        event: 'Sunday Service Youth Day',
        eventSw: 'Ibada ya Jumapili, Siku ya Vijana',
        location: 'Shortland Public School, Shortland NSW'
    },
    'IMG_3742.JPG': {
        event: 'Sunday Service',
        eventSw: 'Ibada ya Jumapili',
        location: 'Shortland Public School, Shortland NSW'
    }
};

const PHOTOS_2025_04_19 = new Set([
    'IMG_4697.JPG',
    'IMG_4698.JPG',
    'IMG_4701.JPG',
    'IMG_4705.JPG',
    'IMG_4710.JPG',
    'IMG_4720.JPG',
    'IMG_4725.JPG',
    'IMG_4745.JPG',
    'IMG_4748.JPG',
    'IMG_4749.JPG',
    'IMG_4750.JPG',
    'IMG_4751.JPG',
    'IMG_4754.JPG',
    'IMG_4756.JPG',
    'IMG_4760.JPG',
    'IMG_4763.JPG',
    'IMG_4764.JPG',
    'IMG_4765.JPG'
]);

function getPhotoDateKey(fileName) {
    if (PHOTOS_2024_12_22.has(fileName)) return '2024-12-22';
    if (PHOTOS_2025_04_19.has(fileName)) return '2025-04-19';
    if (/^IMG_[0-9]+\.JPG$/i.test(fileName)) return '2023-12-24';
    return 'unknown';
}

const GALLERY_UI_TEXT = {
    en: {
        loading: 'Loading image...',
        failed: 'Image failed to load.',
        close: 'Close gallery',
        dialogLabel: 'Gallery viewer',
        prev: 'Previous image',
        next: 'Next image',
        openPhoto: 'Open photo',
        photoOf: (index, total) => `Photo ${index} of ${total}.`,
        gridLabel: 'AACU photo gallery',
        noImages: 'No gallery images available today. Please check back tomorrow.'
    },
    sw: {
        loading: 'Inapakia picha...',
        failed: 'Imeshindwa kupakia picha.',
        close: 'Funga picha',
        dialogLabel: 'Kionyeshi cha picha',
        prev: 'Picha iliyotangulia',
        next: 'Picha inayofuata',
        openPhoto: 'Fungua picha',
        photoOf: (index, total) => `Picha ${index} kati ya ${total}.`,
        gridLabel: 'Mkusanyiko wa picha wa AACU',
        noImages: 'Hakuna picha za leo. Tafadhali jaribu tena kesho.'
    }
};

function getGalleryUiText(lang) {
    return GALLERY_UI_TEXT[lang] || GALLERY_UI_TEXT.en;
}

function getCurrentLanguage() {
    const savedLanguage = localStorage.getItem('aacu-language');
    return savedLanguage === 'sw' ? 'sw' : 'en';
}

function formatPhotoDate(dateKey, lang = 'en') {
    if (dateKey === 'unknown') {
        return lang === 'sw' ? 'Tarehe haijarekodiwa' : 'Date not recorded';
    }

    const [year, month, day] = dateKey.split('-').map((value) => Number(value));
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(lang === 'sw' ? 'sw-KE' : 'en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function getPhotoMetadata(imagePath, lang = 'en') {
    const fileName = imagePath.split('/').pop() || '';
    const dateKey = getPhotoDateKey(fileName);
    const baseDetails = PHOTO_EVENT_DETAILS[dateKey] || PHOTO_EVENT_DETAILS.unknown;
    const overrideDetails = PHOTO_METADATA_OVERRIDES[fileName];
    const details = overrideDetails ? { ...baseDetails, ...overrideDetails } : baseDetails;
    const dateLabel = formatPhotoDate(dateKey, lang);
    const event = lang === 'sw' ? (details.eventSw || details.event) : details.event;

    return {
        dateKey,
        dateLabel,
        event,
        location: details.location,
        caption: `${dateLabel}. ${event}. ${details.location}.`
    };
}

function createGalleryLightbox(galleryItems, lang = 'en') {
    const ui = getGalleryUiText(lang);
    const lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    lightbox.innerHTML = `
        <button class="gallery-lightbox-backdrop" type="button" aria-label="${ui.close}"></button>
        <div class="gallery-lightbox-dialog" role="dialog" aria-modal="true" aria-label="${ui.dialogLabel}">
            <button class="gallery-lightbox-close" type="button" aria-label="${ui.close}">&times;</button>
            <div class="gallery-lightbox-stage">
                <button class="gallery-lightbox-nav gallery-lightbox-prev" type="button" aria-label="${ui.prev}">&#10094;</button>
                <div class="gallery-lightbox-image-wrap">
                    <p class="gallery-lightbox-status" aria-live="polite">${ui.loading}</p>
                    <img class="gallery-lightbox-image" alt="" decoding="async">
                </div>
                <button class="gallery-lightbox-nav gallery-lightbox-next" type="button" aria-label="${ui.next}">&#10095;</button>
            </div>
            <p class="gallery-lightbox-caption"></p>
        </div>
    `;
    document.body.appendChild(lightbox);

    const backdrop = lightbox.querySelector('.gallery-lightbox-backdrop');
    const closeBtn = lightbox.querySelector('.gallery-lightbox-close');
    const prevBtn = lightbox.querySelector('.gallery-lightbox-prev');
    const nextBtn = lightbox.querySelector('.gallery-lightbox-next');
    const imageElement = lightbox.querySelector('.gallery-lightbox-image');
    const statusElement = lightbox.querySelector('.gallery-lightbox-status');
    const captionElement = lightbox.querySelector('.gallery-lightbox-caption');
    let currentIndex = 0;
    let pendingRequestId = 0;

    function setImage(index) {
        currentIndex = (index + galleryItems.length) % galleryItems.length;
        const item = galleryItems[currentIndex];
        const imagePath = item.full;
        const photoMeta = item.meta;
        const requestId = pendingRequestId + 1;
        pendingRequestId = requestId;

        imageElement.classList.remove('is-loaded');
        imageElement.removeAttribute('src');
        imageElement.alt = `${photoMeta.event}. ${photoMeta.location}. ${photoMeta.dateLabel}.`;
        statusElement.textContent = ui.loading;
        statusElement.hidden = false;
        captionElement.textContent = `${ui.photoOf(currentIndex + 1, galleryItems.length)} ${photoMeta.caption}`;

        const loader = new Image();
        loader.decoding = 'async';
        loader.addEventListener('load', () => {
            if (requestId !== pendingRequestId) return;
            imageElement.src = imagePath;
            imageElement.classList.add('is-loaded');
            statusElement.hidden = true;
        });
        loader.addEventListener('error', () => {
            if (requestId !== pendingRequestId) return;
            statusElement.textContent = ui.failed;
            imageElement.classList.remove('is-loaded');
            imageElement.removeAttribute('src');
        });
        loader.src = imagePath;
    }

    function openAt(index) {
        setImage(index);
        lightbox.classList.add('open');
        document.body.classList.add('gallery-open');
        closeBtn.focus();
    }

    function close() {
        lightbox.classList.remove('open');
        document.body.classList.remove('gallery-open');
    }

    function next() {
        setImage(currentIndex + 1);
    }

    function prev() {
        setImage(currentIndex - 1);
    }

    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

    const handleKeyDown = (event) => {
        if (!lightbox.classList.contains('open')) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            next();
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            prev();
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    return {
        openAt,
        destroy() {
            document.removeEventListener('keydown', handleKeyDown);
            lightbox.remove();
        }
    };
}

function getGalleryThumbnailPath(imagePath) {
    return imagePath.replace('./images/', './images/thumbs/');
}

/**
 * Daily Gallery
 * Renders low-resolution thumbnails and loads full-resolution images on click.
 */
let activeGalleryLightbox = null;

function initializeGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;
    const lang = getCurrentLanguage();
    const ui = getGalleryUiText(lang);

    if (activeGalleryLightbox) {
        activeGalleryLightbox.destroy();
        activeGalleryLightbox = null;
    }

    galleryGrid.innerHTML = '';
    galleryGrid.setAttribute('aria-label', ui.gridLabel);

    const galleryImages = getDailyGalleryImages();

    if (!galleryImages.length) {
        galleryGrid.innerHTML = `<p>${ui.noImages}</p>`;
        return;
    }

    const galleryItems = galleryImages.map((imagePath) => ({
        full: imagePath,
        thumb: getGalleryThumbnailPath(imagePath),
        meta: getPhotoMetadata(imagePath, lang)
    }));

    const lightbox = createGalleryLightbox(galleryItems, lang);
    activeGalleryLightbox = lightbox;

    galleryItems.forEach((item, index) => {
        const figure = document.createElement('figure');
        figure.className = 'gallery-item';
        figure.innerHTML = `
            <button class="gallery-trigger" type="button" data-gallery-index="${index}" aria-label="${ui.openPhoto} ${index + 1}. ${item.meta.caption}">
                <img
                    class="gallery-thumb"
                    src="${item.thumb}"
                    alt="${item.meta.caption}"
                    loading="lazy"
                    decoding="async"
                >
            </button>
            <figcaption>${item.meta.caption}</figcaption>
        `;
        galleryGrid.appendChild(figure);
    });

    galleryGrid.querySelectorAll('.gallery-trigger').forEach((buttonElement) => {
        buttonElement.addEventListener('click', () => {
            const index = Number(buttonElement.dataset.galleryIndex || '0');
            lightbox.openAt(index);
        });
    });
}

/**
 * Language Toggle
 * Switch between English and Swahili
 */
const translations = {
    en: {
        'welcome-title': 'Welcome to AACU',
        'welcome-desc': 'Swahili and English worship in Shortland, Newcastle NSW.',
        'join-us-title': 'Service Times',
        'sunday-worship': 'Sunday Worship',
        'swahili-english': 'Swahili with English translation',
        'saturday-prayer': 'Saturday Prayer',
        'community-prayer': 'Prayer and intercession',
        'service-details-btn': 'Service Details',
        'get-in-touch-title': 'Contact AACU',
        'get-in-touch-desc': 'Contact AACU for service details, prayer requests, and visit information.',
        'learn-about-us': 'Learn About Us',
        'contact-us': 'Contact Us',
        'about-us-title': 'About Us',
        'about-us-desc': 'Church history and mission in Newcastle and the Hunter region.',
        'who-we-are-title': 'Who We Are',
        'who-we-are-desc': 'AACU is an African Christian church in Shortland, Newcastle NSW. Services run in Swahili with English translation.',
        'believe-title': 'What We Believe',
        'gods-love': 'God\'s Love',
        'gods-love-desc': 'God loves all people.',
        'christs-salvation': 'Christ\'s Salvation',
        'christs-salvation-desc': 'Jesus Christ is Lord and Savior. He died and rose again.',
        'community-fellowship': 'Community & Fellowship',
        'community-fellowship-desc': 'We meet for prayer, service, and fellowship in a multilingual church community.',
        'join-community': 'Join Our Community',
        'join-community-desc': 'Join AACU for worship, prayer, and fellowship in Newcastle.',
        'services-title': 'Our Services',
        'services-desc': 'Service times and location for AACU in Shortland, Newcastle NSW.',
        'service-times': 'Service Times',
        'sunday-title': 'Sunday Worship',
        'sunday-desc': 'Sunday worship at 10:00 AM. Swahili service with English translation.',
        'saturday-title': 'Saturday Prayer',
        'saturday-desc': 'Saturday prayer at 10:00 AM. Swahili and English.',
        'location-title': 'Location',
        'visit-us': 'Visit Us',
        'contact-form-title': 'Send us a message',
        'contact-form-desc': 'Write to AACU in Swahili or English.',
        'gallery-title': 'Gallery',
        'gallery-desc': 'AACU church event photo archive.'
    },
    sw: {
        'welcome-title': 'Karibu AACU',
        'welcome-desc': 'Ibada kwa Kiswahili na Kiingereza, Shortland, Newcastle NSW.',
        'join-us-title': 'Ratiba ya Ibada',
        'sunday-worship': 'Ibada ya Jumapili',
        'swahili-english': 'Kiswahili na tafsiri ya Kiingereza',
        'saturday-prayer': 'Sala ya Jumamosi',
        'community-prayer': 'Maombi na maombezi',
        'service-details-btn': 'Maelezo ya Huduma',
        'get-in-touch-title': 'Wasiliana na AACU',
        'get-in-touch-desc': 'Wasiliana na AACU kwa ratiba ya ibada, maombi, na taarifa za kutembelea.',
        'learn-about-us': 'Jifunze Kuhusu Sisi',
        'contact-us': 'Wasiliana',
        'about-us-title': 'Kuhusu Sisi',
        'about-us-desc': 'Historia ya kanisa na huduma yake Newcastle na Hunter.',
        'who-we-are-title': 'Nani Tunavyo Kuwa',
        'who-we-are-desc': 'AACU ni kanisa la Kikristo la Waafrika, Shortland, Newcastle NSW. Ibada ni kwa Kiswahili na tafsiri ya Kiingereza.',
        'believe-title': 'Nini Tunavyoamini',
        'gods-love': 'Upendo wa Mungu',
        'gods-love-desc': 'Mungu anawapenda watu wote.',
        'christs-salvation': 'Wokfu wa Kristo',
        'christs-salvation-desc': 'Yesu Kristo ni Bwana na Mwokozi. Alikufa na kufufuka.',
        'community-fellowship': 'Jamii & Ushirikiano',
        'community-fellowship-desc': 'Tunakutana kwa maombi, huduma, na ushirika katika kanisa la lugha mbili.',
        'join-community': 'Jiunze Jamii Yetu',
        'join-community-desc': 'Jiunge na AACU kwa ibada, maombi, na ushirika Newcastle.',
        'services-title': 'Huduma Zetu',
        'services-desc': 'Ratiba ya ibada na eneo la AACU, Shortland, Newcastle NSW.',
        'service-times': 'Muda wa Huduma',
        'sunday-title': 'Ibada ya Jumapili',
        'sunday-desc': 'Ibada ya Jumapili saa 10:00 asubuhi. Kiswahili na tafsiri ya Kiingereza.',
        'saturday-title': 'Sala ya Jumamosi',
        'saturday-desc': 'Maombi ya Jumamosi saa 10:00 asubuhi. Kiswahili na Kiingereza.',
        'location-title': 'Mahali',
        'visit-us': 'Tembelea Sisi',
        'contact-form-title': 'Tumpeleka ujumbe',
        'contact-form-desc': 'Andika kwa AACU kwa Kiswahili au Kiingereza.',
        'gallery-title': 'Picha',
        'gallery-desc': 'Kumbukumbu ya picha za matukio ya kanisa la AACU.'
    }
};

function initializeLanguageToggle() {
    const toggle = document.getElementById('language-toggle');
    if (!toggle) return;
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('aacu-language') || 'en';
    let currentLanguage = savedLanguage;
    updateLanguageButton(currentLanguage);
    
    toggle.addEventListener('click', () => {
        currentLanguage = currentLanguage === 'en' ? 'sw' : 'en';
        localStorage.setItem('aacu-language', currentLanguage);
        updateLanguageButton(currentLanguage);
        applyTranslations(currentLanguage);
        initializeGallery();
    });
    
    // Apply saved language on page load
    if (savedLanguage === 'sw') {
        applyTranslations('sw');
    }
}

function updateLanguageButton(lang) {
    const toggle = document.getElementById('language-toggle');
    if (toggle) {
        toggle.textContent = lang === 'en' ? 'Swahili' : 'English';
    }
}

function applyTranslations(lang) {
    Object.keys(translations[lang]).forEach(key => {
        const elements = document.querySelectorAll(`[data-i18n="${key}"]`);
        elements.forEach(element => {
            element.textContent = translations[lang][key];
        });
    });
}

/**
 * Navigation Toggle
 * Handles mobile menu toggle functionality
 */
function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (!navToggle || !navMenu) return;
    
    // Toggle menu visibility
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close menu when a link is clicked
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.navbar')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
    
    // Set active link based on current page
    setActiveNavLink();
}

/**
 * Set Active Navigation Link
 * Highlights the current page in navigation
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `./${currentPage}` || (currentPage === '' && href === './index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Announcements Banner
 * Manage the display of announcements banner
 */
function initializeAnnouncementsBanner() {
    const banner = document.getElementById('announcements-banner');
    const closeBtn = document.getElementById('close-announcement');
    
    if (!banner || !closeBtn) return;
    
    // Check if banner was previously closed (in session storage)
    const bannerClosed = sessionStorage.getItem('announcementsClosed');
    if (bannerClosed) {
        banner.style.display = 'none';
    }
    
    // Handle close button click
    closeBtn.addEventListener('click', () => {
        banner.style.display = 'none';
        sessionStorage.setItem('announcementsClosed', 'true');
    });
}

/**
 * Toggle Announcements Banner
 * Public function to show/hide announcements
 * Usage: toggleAnnouncements() in browser console or programmatically
 */
function toggleAnnouncements() {
    const banner = document.getElementById('announcements-banner');
    if (!banner) return;
    
    if (banner.style.display === 'none') {
        banner.style.display = 'block';
        sessionStorage.removeItem('announcementsClosed');
    } else {
        banner.style.display = 'none';
        sessionStorage.setItem('announcementsClosed', 'true');
    }
}

/**
 * Update Announcements Content
 * Dynamically update banner message
 * Usage: updateAnnouncementsContent('New message text')
 */
function updateAnnouncementsContent(message) {
    const announcementContent = document.querySelector('.announcement-content');
    if (!announcementContent) return;
    
    // Get the close button to preserve it
    const closeBtn = announcementContent.querySelector('.close-announcement');
    announcementContent.textContent = message;
    if (closeBtn) {
        announcementContent.appendChild(closeBtn);
    }
}

/**
 * Smooth Scroll Handler
 * Adds smooth scrolling for anchor links (CSS-based but enhances experience)
 */
function initializeSmoothScroll() {
    // Already handled by CSS, but can add JS for older browsers if needed
    // This is here for future enhancement if needed
}

/**
 * Form Handling
 * Enhanced form submission with client-side fallback
 */
function initializeContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    // Handle form submission with fallback to mailto
    form.addEventListener('submit', (e) => {
        // Allow default form submission
        // If Formspree is not configured, it will fall back to mailto link
        
        // Optional: Add client-side validation
        const email = form.querySelector('#email');
        const name = form.querySelector('#name');
        const message = form.querySelector('#message');
        
        if (email && !isValidEmail(email.value)) {
            e.preventDefault();
            alert('Please enter a valid email address.');
            return;
        }
        
        if (name && name.value.trim() === '') {
            e.preventDefault();
            alert('Please enter your name.');
            return;
        }
        
        if (message && message.value.trim() === '') {
            e.preventDefault();
            alert('Please enter a message.');
            return;
        }
    });
}

/**
 * Email Validation Helper
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Keyboard Navigation Enhancement
 * Improve keyboard accessibility
 */
function initializeKeyboardNavigation() {
    // Focus visible style enhancement for keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-nav');
    });
}

/**
 * Print Page Functionality
 * Provide convenient print button functionality if needed
 */
function initializePrintFunctionality() {
    // Add print button functionality if print buttons exist
    const printButtons = document.querySelectorAll('[data-print]');
    printButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.print();
        });
    });
}

/**
 * Analytics Placeholder
 * Hook for future analytics integration (Google Analytics, Plausible, etc.)
 * To use: Uncomment and add your analytics code
 */
function initializeAnalytics() {
    // Example: Google Analytics
    // Replace YOUR_GA_ID with your actual Google Analytics ID
    /*
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'YOUR_GA_ID');
    */
    
    // Example: Plausible Analytics
    /*
    window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }
    */
}

/**
 * Performance Monitoring (Optional)
 * Log core web vitals for performance tracking
 */
function initializePerformanceMonitoring() {
    // Log page load time
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time: ' + pageLoadTime + 'ms');
    });
}

/**
 * Intersection Observer for Animations
 * Animate elements as they come into view
 */
function initializeIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.animation = 'fadeIn 0.6s ease-out';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observe all cards and content sections
    document.querySelectorAll('.card, .belief-card, .leader-card, .expect-item').forEach(element => {
        element.style.opacity = '0';
        observer.observe(element);
    });
}

/**
 * Dark Mode Toggle (Optional)
 * Provide dark/light mode toggle if desired
 * Uncomment to enable
 */
/*
function initializeDarkModeToggle() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    
    const theme = storedTheme || (prefersDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add toggle button if you want user control
    const darkModeToggle = document.querySelector('[data-toggle-theme]');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}
*/

/**
 * Lazy Load Images (Optional)
 * For future use if images are added
 */
function initializeLazyLoading() {
    if (!('IntersectionObserver' in window)) return;
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Initialize All Components
 * Main initialization function
 */
function initialize() {
    // Carousel (hero images)
    initializeCarousel();
    initializeGallery();
    initializeSectionBackgrounds();
    
    // Core functionality
    initializeNavigation();
    initializeAnnouncementsBanner();
    initializeContactForm();
    initializeKeyboardNavigation();
    initializeLanguageToggle();
    
    // Enhancements
    initializeSmoothScroll();
    initializePrintFunctionality();
    initializeIntersectionObserver();
    initializeLazyLoading();
    
    // Optional features
    initializePerformanceMonitoring();
    initializeAnalytics();
    
    console.log('AACU Website initialized');
}

/**
 * Run initialization when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initialize();
        // Apply saved language preference after everything is initialized
        const savedLanguage = localStorage.getItem('aacu-language') || 'en';
        if (savedLanguage === 'sw') {
            applyTranslations('sw');
            updateLanguageButton('sw');
        }
    });
} else {
    initialize();
    // Apply saved language preference after everything is initialized
    const savedLanguage = localStorage.getItem('aacu-language') || 'en';
    if (savedLanguage === 'sw') {
        applyTranslations('sw');
        updateLanguageButton('sw');
    }
}

/**
 * Exported Functions for Console/External Use
 * These can be called from the browser console or programmatically
 */
window.AACU = {
    toggleAnnouncements: toggleAnnouncements,
    updateAnnouncementsContent: updateAnnouncementsContent,
    setActiveNavLink: setActiveNavLink,
    initializeLanguageToggle: initializeLanguageToggle,
    applyTranslations: applyTranslations
};
