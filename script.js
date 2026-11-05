function splitLetters(element, selector, maskClass, letterClass) {
  let index = 0;
  element.querySelectorAll(selector).forEach(line => {
    const fragment = document.createDocumentFragment();
    for (const character of line.textContent) {
      const mask = document.createElement('span');
      mask.className = maskClass;
      mask.setAttribute('aria-hidden', 'true');
      const letter = document.createElement('span');
      letter.className = letterClass;
      letter.style.setProperty('--letter-index', index++);
      letter.textContent = character === ' ' ? '\u00a0' : character;
      if (character === ' ' && letterClass === 'preloader-letter') {
        letter.classList.add('preloader-letter-space');
      }
      mask.append(letter);
      fragment.append(mask);
    }
    line.replaceChildren(fragment);
  });
}

const delay = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));

function revealHomepage(homepage, pageTitle) {
  splitLetters(pageTitle, '.title-line', 'title-letter-mask', 'title-letter');
  pageTitle.classList.add('is-ready');
  homepage.classList.add('is-revealed');
}

function waitForVideoFrame(video) {
  return new Promise(resolve => {
    if (!video || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      resolve(true);
      return;
    }
    if (video.error) {
      resolve(false);
      return;
    }

    const cleanUp = () => {
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
      video.removeEventListener('abort', onError);
    };
    const onReady = () => { cleanUp(); resolve(true); };
    const onError = () => { cleanUp(); resolve(false); };

    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('abort', onError, { once: true });
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) onReady();
    else if (video.error) onError();
  });
}

async function runPreloader() {
  const homepage = document.querySelector('.homepage');
  const preloader = document.querySelector('.preloader');
  const video = document.querySelector('.background-video');
  const pageTitle = document.querySelector('.page-title');

  await document.fonts.ready;
  splitLetters(preloader, '.preloader-title-line,.preloader-year', 'preloader-letter-mask', 'preloader-letter');
  preloader.classList.add('is-started');

  const videoReady = await waitForVideoFrame(video);
  if (videoReady) video.play().catch(() => {});

  if (videoReady && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Let the title settle, then animate through the two intended aperture phases.
    await delay(1000);
    preloader.classList.add('is-expanded');
    await delay(450);
    await delay(150);
    preloader.classList.add('is-fullscreen');
    await delay(450);
    await delay(150);
    revealHomepage(homepage, pageTitle);
    await delay(350);
    preloader.classList.add('is-done');
    await delay(300);
    preloader.remove();
    return;
  }

  revealHomepage(homepage, pageTitle);
  preloader.remove();
}

runPreloader();
