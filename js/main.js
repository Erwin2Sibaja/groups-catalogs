(function () {
  const currentLang = (document.documentElement.lang || "es")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "es";

  const grid = document.getElementById("catalog-grid");
  const btnShowMore = document.getElementById("show-more-btn");

  let currentCatalog = null;
  let currentPageIndex = 0;
  let currentZoom = 1;

  let startX = 0;
  let isDragging = false;
  let justSwiped = false;

  const viewer = document.getElementById("catalog-viewer");
  const viewerImg = document.getElementById("viewer-image");
  const viewerTitle = document.getElementById("viewer-title");
  const viewerSubtitle = document.getElementById("viewer-subtitle");
  const pageIndicator = document.getElementById("viewer-page-indicator");
  const zoomLabel = document.getElementById("viewer-zoom-label");

  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnDownload = document.getElementById("btn-download");

  const viewerPageWrap = document.querySelector(".viewer__page-wrap");

  const langSwitcher = document.getElementById("lang-switcher");
  const i18nTexts = {
    es: {
      title: "Kit de banquetes",
      subtitle: "Explora nuestros menús digitales. Toca una tarjeta para ver el catálogo completo.",
      availableCatalogs: "Catálogos disponibles",
      viewMenu: "Ver menú",
      download: "Descargar menú completo",
      viewMore: "Ver más catálogos",
    },
    en: {
      title: "Kit banquet menu",
      subtitle: "Explore our digital menus. Tap a card to view the full catalog.",
      availableCatalogs: "Available catalogs",
      viewMenu: "View menu",
      download: "Download full menu",
      viewMore: "View more catalogs",
    }
  };

langSwitcher.addEventListener("change", () => {
      const selected = langSwitcher.value;

      document.querySelector("[data-i18n='title']").textContent =
        i18nTexts[selected].title;
      
      document.querySelector("[data-i18n='subtitle']").textContent =
        i18nTexts[selected].subtitle;

            document.querySelector("[data-i18n='download']").textContent =
        i18nTexts[selected].download;

      const headerLabel = document.querySelector("[data-i18n='availableCatalogs'] h2"); 
      if(headerLabel) {
         document.querySelector("[data-i18n='availableCatalogs'] h2").textContent = i18nTexts[selected].availableCatalogs;
      } else {
         const directH2 = document.querySelector("[data-i18n='availableCatalogs']");
         if(directH2) directH2.textContent = i18nTexts[selected].availableCatalogs;
      }

      const btnLabel = document.querySelector("[data-i18n='viewMore']");
      if (btnLabel) {
        btnLabel.textContent = i18nTexts[selected].viewMore;
      }

      grid.innerHTML = "";
      const catalogs = (window.CATALOGS || []).filter(c => c.lang === selected);
      catalogs.forEach((c, idx) => grid.appendChild(createCard(c, idx)));

      btnShowMore.style.display = catalogs.length > 6 ? "inline-flex" : "none";
  });


  function getCatalogsForLang(lang) {
    return (window.CATALOGS || []).filter((c) => c.lang === lang);
  }

  function getCurrentPages() {
    return currentCatalog?.pages || [];
  }

  function createCard(catalog, index) {
    const selected = langSwitcher.value;
    const article = document.createElement("article");
    article.className = "catalog-card";
    article.dataset.id = catalog.id;


    if (index >= 6) {
      article.style.display = "none";
      article.classList.add("js-hidden-card");
    }

    article.innerHTML = `
      <div class="catalog-card__image-wrap">
        <img class="catalog-card__cover" src="${catalog.cover}" alt="${catalog.title}" loading="lazy" />
      </div>

      <div class="catalog-card__body">
        <h3 class="catalog-card__title">${catalog.title}</h3>

        ${
          catalog.subtitle
            ? `<p class="catalog-card__subtitle">${catalog.subtitle}</p>`
            : `<p class="catalog-card__subtitle"> </p>`
        }

        <p class="catalog-card__desc">${catalog.description}</p>

        <div class="catalog-card__btn-wrap">
          <button class="btn-primary" type="button">${i18nTexts[selected].viewMenu}</button>
        </div>
      </div>
    `;

    article
      .querySelector("button")
      .addEventListener("click", () => openViewer(catalog, 0));

    return article;
  }

  function renderGrid() {
    const catalogs = getCatalogsForLang(currentLang);
    grid.innerHTML = "";

    catalogs.forEach((cat, index) => {
      grid.appendChild(createCard(cat, index));
    });

    const showMoreNeeded = catalogs.length > 6;
    btnShowMore.style.display = showMoreNeeded ? "inline-flex" : "none";
  }

  function setupShowMore() {
    btnShowMore.addEventListener("click", () => {

      const hiddenCards = grid.querySelectorAll(".js-hidden-card");
      
      hiddenCards.forEach((card) => {
        card.style.display = "";
        card.classList.remove("js-hidden-card");
      });
      
      btnShowMore.style.display = "none";
    });
  }

  function openViewer(catalog, pageIndex) {
    currentCatalog = catalog;
    currentPageIndex = pageIndex || 0;

    if (window.innerWidth > 768) {
      currentZoom = 0.80;
    } else {
      currentZoom = 1;
    }

    viewerTitle.textContent = catalog.title;
    viewerSubtitle.textContent = catalog.subtitle || "";
    btnDownload.href = catalog.pdfUrl || "#";

    updateViewerPage(true);
    updateZoomLabel();

    viewer.classList.add("viewer--open");
    viewer.setAttribute("aria-hidden", "false");
  }

function closeViewer() {
    viewer.classList.remove("viewer--open");
    viewer.setAttribute("aria-hidden", "true");
    
    viewerImg.src = ""; 
    currentCatalog = null;
  }

  function updateViewerPage(direction) {
    if (!currentCatalog) return;
    const pages = getCurrentPages();
    if (!pages.length) return;

    if (currentPageIndex < 0) currentPageIndex = 0;
    if (currentPageIndex > pages.length - 1)
      currentPageIndex = pages.length - 1;

    const viewerBody = document.querySelector(".viewer__body");
    if (viewerBody) {
      viewerBody.scrollTop = 0;
    }

    const src = pages[currentPageIndex];
    const loader = document.getElementById("viewer-loader");

    if (loader) loader.classList.add("viewer__loader--active");
    viewerImg.style.opacity = "0.5";

    viewerImg.onload = () => {
       if (loader) loader.classList.remove("viewer__loader--active");
       viewerImg.style.opacity = "1";
       viewerImg.classList.remove("viewer__page--slide-left", "viewer__page--slide-right", "viewer__page--fade");
    };

    viewerImg.src = src;
    viewerImg.style.transform = `scale(${currentZoom})`;

    const pagesCount = pages.length;
    pageIndicator.textContent = `${currentPageIndex + 1} / ${pagesCount}`;
  }

  function updateZoomLabel() {
    zoomLabel.textContent = Math.round(currentZoom * 100) + "%";
  }

  function changePage(delta) {
    if (!currentCatalog) return;
    const pages = getCurrentPages();
    if (!pages.length) return;

    const newIndex = currentPageIndex + delta;
    const lastIndex = pages.length - 1;

    if (newIndex < 0 || newIndex > lastIndex) {
      const bounceDistance = 40;
      const bounceDuration = 260;

      viewerImg.style.transition =
        `transform ${bounceDuration}ms cubic-bezier(0.25, 1.4, 0.4, 1)`;

      viewerImg.style.transform =
        `scale(${currentZoom}) translateX(${delta >= 0 ? -bounceDistance : bounceDistance}px)`;

      setTimeout(() => {
        viewerImg.style.transform = `scale(${currentZoom}) translateX(0)`;
        viewerImg.style.transition = "";
      }, bounceDuration);

      return;
    }

    currentPageIndex = newIndex;
    updateViewerPage(delta > 0 ? "next" : "prev");
  }

  function changeZoom(delta) {
    if (!currentCatalog) return;
    const minZoom = 0.6;
    const maxZoom = 2.2;
    currentZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom + delta));
    viewerImg.style.transform = `scale(${currentZoom})`;
    updateZoomLabel();
  }

  function setupSwipe() {
    if (!viewerImg) return;

    viewerImg.addEventListener("touchstart", (e) => {
      if (!viewer.classList.contains("viewer--open")) return;
      if (!currentCatalog) return;

      startX = e.touches[0].clientX;
      isDragging = true;
    });

    viewerImg.addEventListener("touchmove", (e) => {
      if (!isDragging) return;

      const delta = e.touches[0].clientX - startX;

      viewerImg.style.transform =
        `translateX(${delta / 3}px) scale(${currentZoom})`; 
    });

    viewerImg.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;

      const delta = e.changedTouches[0].clientX - startX;
      viewerImg.style.transform = `scale(${currentZoom})`;

      const threshold = 35;

      if (delta < -threshold) {
        changePage(1);
        justSwiped = true;
        setTimeout(() => (justSwiped = false), 180);
      } else if (delta > threshold) {
        changePage(-1);
        justSwiped = true;
        setTimeout(() => (justSwiped = false), 180);
      }
    });
  }

  function setupClickZones() {
    if (!viewerPageWrap) return;

    viewerPageWrap.addEventListener("click", (e) => {
      if (justSwiped) return;
      if (!currentCatalog) return;

      const rect = viewerPageWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const middle = rect.width / 2;

      if (x > middle) {
        changePage(1);
      } else {
        changePage(-1);
      }
    });
  }

  function setupViewerEvents() {
    viewer
      .querySelectorAll("[data-viewer-close]")
      .forEach((el) => el.addEventListener("click", closeViewer));

    btnPrev.addEventListener("click", () => changePage(-1));
    btnNext.addEventListener("click", () => changePage(1));
    btnZoomIn.addEventListener("click", () => changeZoom(0.2));
    btnZoomOut.addEventListener("click", () => changeZoom(-0.2));

    document.addEventListener("keydown", (e) => {
      if (!viewer.classList.contains("viewer--open")) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") changePage(1);
      if (e.key === "ArrowLeft") changePage(-1);
    });
  }
  

  document.addEventListener("DOMContentLoaded", () => {
    renderGrid();
    setupShowMore();
    setupViewerEvents();
    setupSwipe();
    setupClickZones();
  });
})();