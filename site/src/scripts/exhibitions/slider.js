const AUTOPLAY_INTERVAL = 6000;

function clampIndex(index, length) {
  if (length === 0) return 0;
  const mod = index % length;
  return mod >= 0 ? mod : mod + length;
}

function activateSlide(slides, indicators, nextIndex) {
  slides.forEach((slide, index) => {
    const isActive = index === nextIndex;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    slide.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  indicators.forEach((indicator, index) => {
    const isActive = index === nextIndex;
    indicator.classList.toggle('is-active', isActive);
    indicator.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function buildIndicators(container, slides, goTo) {
  if (!container) {
    return [];
  }

  if (container.children.length > 0) {
    const existing = Array.from(container.querySelectorAll('[data-slider-indicator]'));
    existing.forEach((indicator, index) => {
      indicator.dataset.index = String(index);
      indicator.addEventListener('click', () => goTo(index));
    });
    return existing;
  }

  const fragment = document.createDocumentFragment();
  const indicators = slides.map((slide, index) => {
    const indicator = document.createElement('button');
    indicator.type = 'button';
    indicator.className = 'slider-indicator';
    indicator.dataset.sliderIndicator = '';
    indicator.dataset.index = String(index);
    indicator.setAttribute('aria-label', slide.dataset.slideLabel || `スライド ${index + 1}`);
    indicator.addEventListener('click', () => goTo(index));
    fragment.appendChild(indicator);
    return indicator;
  });

  container.appendChild(fragment);
  return indicators;
}

function initSlider(node) {
  const track = node.querySelector('[data-slider-track]');
  const slides = track ? Array.from(track.querySelectorAll('[data-slider-item]')) : [];
  if (!track || slides.length === 0) {
    return;
  }

  let currentIndex = 0;
  let timer = null;
  let userPaused = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controls = node.querySelector('[data-slider-controls]');
  const previousButton = controls?.querySelector('[data-action="previous"]');
  const nextButton = controls?.querySelector('[data-action="next"]');
  const pauseButton = controls?.querySelector('[data-action="pause"]');
  const playButton = controls?.querySelector('[data-action="play"]');
  const indicatorContainer = node.querySelector('[data-slider-indicators]');

  const goTo = (index) => {
    currentIndex = clampIndex(index, slides.length);
    const offset = currentIndex * -100;
    track.style.setProperty('--slider-offset', `${offset}%`);
    activateSlide(slides, indicators, currentIndex);
  };

  const goNext = () => {
    goTo(currentIndex + 1);
  };

  const goPrevious = () => {
    goTo(currentIndex - 1);
  };

  const indicators = buildIndicators(indicatorContainer, slides, goTo);

  slides.forEach((slide, index) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} / ${slides.length}`);
  });

  const setAutoplayState = (shouldPlay) => {
    if (shouldPlay) {
      if (prefersReducedMotion.matches) {
        node.setAttribute('data-autoplay', 'false');
        node.setAttribute('data-reduced-motion', 'true');
        return;
      }
      clearInterval(timer);
      timer = setInterval(goNext, AUTOPLAY_INTERVAL);
      node.setAttribute('data-autoplay', 'true');
    } else {
      clearInterval(timer);
      timer = null;
      node.setAttribute('data-autoplay', 'false');
    }
  };

  const handleReducedMotionChange = () => {
    if (prefersReducedMotion.matches) {
      node.setAttribute('data-reduced-motion', 'true');
      setAutoplayState(false);
      if (pauseButton) {
        pauseButton.setAttribute('aria-pressed', 'true');
      }
      if (playButton) {
        playButton.setAttribute('aria-pressed', 'false');
        playButton.disabled = true;
      }
    } else {
      node.setAttribute('data-reduced-motion', 'false');
      if (!userPaused) {
        setAutoplayState(true);
      }
      if (playButton) {
        playButton.disabled = false;
      }
    }
  };

  if (previousButton) {
    previousButton.addEventListener('click', () => {
      goPrevious();
      userPaused = true;
      setAutoplayState(false);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      goNext();
      userPaused = true;
      setAutoplayState(false);
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      userPaused = true;
      pauseButton.setAttribute('aria-pressed', 'true');
      if (playButton) {
        playButton.setAttribute('aria-pressed', 'false');
      }
      setAutoplayState(false);
    });
  }

  if (playButton) {
    playButton.addEventListener('click', () => {
      userPaused = false;
      playButton.setAttribute('aria-pressed', 'true');
      if (pauseButton) {
        pauseButton.setAttribute('aria-pressed', 'false');
      }
      setAutoplayState(true);
    });
  }

  node.addEventListener('pointerenter', () => {
    setAutoplayState(false);
  });

  node.addEventListener('pointerleave', () => {
    if (!userPaused) {
      setAutoplayState(true);
    }
  });

  node.addEventListener('focusin', () => {
    setAutoplayState(false);
  });

  node.addEventListener('focusout', (event) => {
    if (!node.contains(event.relatedTarget) && !userPaused) {
      setAutoplayState(true);
    }
  });

  node.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
      userPaused = true;
      setAutoplayState(false);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrevious();
      userPaused = true;
      setAutoplayState(false);
    } else if (event.key === ' ') {
      event.preventDefault();
      userPaused = !userPaused;
      if (userPaused) {
        setAutoplayState(false);
        pauseButton?.setAttribute('aria-pressed', 'true');
        playButton?.setAttribute('aria-pressed', 'false');
      } else {
        playButton?.setAttribute('aria-pressed', 'true');
        pauseButton?.setAttribute('aria-pressed', 'false');
        setAutoplayState(true);
      }
    }
  });

  prefersReducedMotion.addEventListener('change', handleReducedMotionChange);

  // Initial state
  node.setAttribute('data-slider-ready', 'true');
  node.setAttribute('data-reduced-motion', prefersReducedMotion.matches ? 'true' : 'false');
  activateSlide(slides, indicators, currentIndex);
  pauseButton?.setAttribute('aria-pressed', 'false');
  playButton?.setAttribute('aria-pressed', prefersReducedMotion.matches ? 'false' : 'true');
  handleReducedMotionChange();
  if (!prefersReducedMotion.matches) {
    setAutoplayState(true);
  }
}

function initAllSliders() {
  const sliders = document.querySelectorAll('[data-exhibition-slider]');
  sliders.forEach(initSlider);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllSliders, { once: true });
} else {
  initAllSliders();
}

export {};
