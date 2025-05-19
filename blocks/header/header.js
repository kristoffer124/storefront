/* eslint-disable import/no-unresolved */

// Drop-in Tools
import { events } from '@dropins/tools/event-bus.js';

// Cart dropin
import { publishShoppingCartViewEvent } from '@dropins/storefront-cart/api.js';

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

import renderAuthCombine from './renderAuthCombine.js';
import { renderAuthDropdown } from './renderAuthDropdown.js';
import { rootLink } from '../../scripts/scripts.js';
import applyHashTagsForDomElement from '../../scripts/api/hashtags/api.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.querySelector('header').insertAdjacentElement('afterbegin', overlay);

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      overlay.classList.remove('show');
      nav.querySelector('button').focus();
      const navWrapper = document.querySelector('.nav-wrapper');
      navWrapper.classList.remove('active');
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
      overlay.classList.remove('show');
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, true);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.classList.remove('active');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

const subMenuHeader = document.createElement('div');
subMenuHeader.classList.add('submenu-header');
subMenuHeader.innerHTML = '<h5 class="back-link">All Categories</h5><hr />';

/**
 * Sets up the submenu
 * @param {navSection} navSection The nav section element
 */
function setupSubmenu(navSection) {
  if (navSection.querySelector('ul')) {
    let label;
    if (navSection.childNodes.length) {
      [label] = navSection.childNodes;
    }

    const submenu = navSection.querySelector('ul');
    const wrapper = document.createElement('div');
    const header = subMenuHeader.cloneNode(true);
    const title = document.createElement('h6');
    title.classList.add('submenu-title');
    title.textContent = label.textContent;

    wrapper.classList.add('submenu-wrapper');
    wrapper.appendChild(header);
    wrapper.appendChild(title);
    wrapper.appendChild(submenu.cloneNode(true));

    navSection.appendChild(wrapper);
    navSection.removeChild(submenu);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (navBrand && brandLink) {
    const logoLink = document.createElement('a');
    logoLink.href = brandLink.href;
    logoLink.setAttribute('aria-label', 'Home');

    const logoImg = document.createElement('img');
    logoImg.src = '/logo.png';
    logoImg.alt = 'Logo';
    logoImg.className = 'site-logo';

    logoLink.appendChild(logoImg);
    navBrand.textContent = '';
    navBrand.appendChild(logoLink);
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        setupSubmenu(navSection);
        navSection.addEventListener('click', (event) => {
          if (event.target.tagName === 'A') return;
          if (!isDesktop.matches) {
            navSection.classList.toggle('active');
          }
        });
        navSection.addEventListener('mouseenter', () => {
          toggleAllNavSections(navSections);
          if (isDesktop.matches) {
            if (!navSection.classList.contains('nav-drop')) {
              overlay.classList.remove('show');
              return;
            }
            navSection.setAttribute('aria-expanded', 'true');
            overlay.classList.add('show');
          }
        });
      });
  }

  const navTools = nav.querySelector('.nav-tools');

  /** Search */

  // TODO
  const search = document.createRange().createContextualFragment(`
  <div class="search-wrapper nav-tools-wrapper">
    <button type="button" class="nav-search-button">Search</button>
    <div class="nav-search-input nav-search-panel nav-tools-panel">
      <form action="/search" method="GET">
        <input id="search" type="search" name="q" placeholder="Search" />
        <div id="search_autocomplete" class="search-autocomplete"></div>
      </form>
    </div>
  </div>
  `);

  navTools.append(search);

  const searchPanel = navTools.querySelector('.nav-search-panel');

  const searchButton = navTools.querySelector('.nav-search-button');

  const searchInput = searchPanel.querySelector('input');

  const searchForm = searchPanel.querySelector('form');

  searchForm.action = rootLink('/search');

  async function toggleSearch(state) {
    const show = state ?? !searchPanel.classList.contains('nav-tools-panel--show');

    searchPanel.classList.toggle('nav-tools-panel--show', show);

    if (show) {
      await import('./searchbar.js');
      searchInput.focus();
    }
  }

  navTools.querySelector('.nav-search-button').addEventListener('click', () => {
    if (isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
    toggleSearch();
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    if (!minicartPanel.contains(e.target) && !cartButton.contains(e.target)) {
      toggleMiniCart(false);
    }

    if (!searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
      toggleSearch(false);
    }
  });

  /** Mini Cart */
  const excludeMiniCartFromPaths = ['/checkout'];

  const minicart = document.createRange().createContextualFragment(`
     <div class="minicart-wrapper nav-tools-wrapper">
       <button type="button" class="nav-cart-button" aria-label="Cart"></button>
       <div class="minicart-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(minicart);

  const minicartPanel = navTools.querySelector('.minicart-panel');

  const cartButton = navTools.querySelector('.nav-cart-button');

  if (excludeMiniCartFromPaths.includes(window.location.pathname)) {
    cartButton.style.display = 'none';
  }

  // load nav as fragment
  const miniCartMeta = getMetadata('mini-cart');
  const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';
  loadFragment(miniCartPath).then((miniCartFragment) => {
    minicartPanel.append(miniCartFragment.firstElementChild);
  });

  async function toggleMiniCart(state) {
    const show = state ?? !minicartPanel.classList.contains('nav-tools-panel--show');
    const stateChanged = show !== minicartPanel.classList.contains('nav-tools-panel--show');
    minicartPanel.classList.toggle('nav-tools-panel--show', show);

    if (stateChanged && show) {
      publishShoppingCartViewEvent();
    }
  }

  cartButton.addEventListener('click', () => toggleMiniCart());

  // Cart Item Counter
  events.on(
    'cart/data',
    (data) => {
      if (data?.totalQuantity) {
        cartButton.setAttribute('data-count', data.totalQuantity);
      } else {
        cartButton.removeAttribute('data-count');
      }
    },
    { eager: true },
  );

  /** Auth Dropdown in header.js */

  const excludeAuthFromPaths = ['/checkout']; // example if you want to exclude login in some paths

// Create login/auth dropdown elements
  const authFragment = document.createRange().createContextualFragment(`
  <div class="dropdown-wrapper nav-tools-wrapper">
    <button type="button" class="nav-login-button" aria-label="My Account" aria-haspopup="dialog" aria-expanded="false">
      <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <g fill="none" stroke="#000" stroke-width="1.5">
          <circle cx="12" cy="6" r="4"></circle>
          <path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"></path>
        </g>
      </svg>
    </button>
    <div class="auth-panel nav-tools-panel" role="dialog" aria-hidden="true" tabindex="-1">
      <div class="nav-auth-menu-panel nav-tools-panel nav-tools-panel--show" role="dialog" aria-hidden="false" aria-labelledby="modal-title" aria-describedby="modal-description">
      <div id="auth-dropin-container" class="dropin-design" style="display: block;"><div class="auth-sign-in"><div data-testid="signInForm" class="auth-sign-in-form auth-sign-in-form--small"><div data-testid="dropin-header-container" class="dropin-header-container auth-sign-in-form__title"><span class="dropin-header-container__title dropin-header-container__title--medium">Sign in</span></div><form name="signIn_form" class="auth-sign-in-form__form" abineguid="B5A00C899C9B47928C5EE796B4BCCCC2"><div data-testid="auth-sign-in-form__form--email" class="dropin-field auth-sign-in-form__form__field auth-sign-in-form__form__field--email auth-sign-in-form__form__email"><div class="dropin-field__content"><div class="dropin-input-container dropin-input-container--primary dropin-input-container--floating"><div class="dropin-input-label-container"><input id="dropin-field-0.eyljq0eg7mq" type="text" name="email" placeholder="Email" autocomplete="username" class="dropin-input dropin-input--medium dropin-input--primary dropin-input--floating"><label for="dropin-field-0.eyljq0eg7mq" class="dropin-input__label--floating">Email *</label><div id="pwm-inline-icon-54776" class="pwm-field-icon" style="position: absolute !important; width: 18px !important; height: 18px !important; min-height: 0px !important; min-width: 0px !important; z-index: 2147483645 !important; box-shadow: none !important; box-sizing: content-box !important; background: none !important; border: none !important; padding: 0px !important; cursor: pointer !important; outline: none !important; margin-top: 19px; margin-left: 718px;"><svg style="display: inline-block !important; width: 16px !important; height: 16px !important; fill: rgb(230, 0, 23) !important; margin-top: 0.5px !important; position: absolute !important; top: 0px !important; left: 0px !important;" viewBox="0 0 64 64"><g><path d="m20,28.12a33.78,33.78 0 0 1 13.36,2.74a22.18,22.18 0 0 1 0.64,5.32c0,9.43 -5.66,17.81 -14,20.94c-8.34,-3.13 -14,-11.51 -14,-20.94a22.2,22.2 0 0 1 0.64,-5.32a33.78,33.78 0 0 1 13.36,-2.74m0,-28.12c-8.82,0 -14,7.36 -14,16.41l0,5.16c2,-1.2 2,-1.49 5,-2.08l0,-3.08c0,-6.21 2.9,-11.41 8.81,-11.41l0.19,0c6.6,0 9,4.77 9,11.41l0,3.08c3,0.58 3,0.88 5,2.08l0,-5.16c0,-9 -5.18,-16.41 -14,-16.41l0,0zm0,22c-6.39,0 -12.77,0.67 -18.47,4a31.6,31.6 0 0 0 -1.53,9.74c0,13.64 8.52,25 20,28.26c11.48,-3.27 20,-14.63 20,-28.26a31.66,31.66 0 0 0 -1.54,-9.77c-5.69,-3.3 -12.08,-4 -18.47,-4l0,0l0.01,0.03z"></path><path d="m21.23,39.5a2.81,2.81 0 0 0 1.77,-2.59a2.94,2.94 0 0 0 -3,-2.93a3,3 0 0 0 -3,3a2.66,2.66 0 0 0 1.77,2.48l-1.77,4.54l6,0l-1.77,-4.5z"></path></g></svg><span id="pwm-inline-icon-badge-54776" style="position: absolute !important; inset: auto auto 0px 7px !important; box-sizing: content-box !important; font-family: monospace !important; font-size: 9px !important; border-radius: 2px !important; color: white !important; background: rgb(112, 185, 52) !important; border: 0.5px solid white !important; width: auto !important; height: 10px !important; min-width: 10px !important; min-height: 0px !important; display: flex !important; align-items: center !important; justify-content: center !important; pointer-events: none !important;">0</span></div></div></div></div><div class="dropin-field__hint dropin-field__hint--medium"></div></div><div data-testid="passwordFieldInput" class="dropin-input-password auth-sign-in-form__form__password"><div class="dropin-field"><div class="dropin-field__content"><div class="dropin-input-container dropin-input-container--primary dropin-input-container--floating"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="dropin-input__field-icon--left"><g clip-path="url(#clip0_3785_11045)"><path vector-effect="non-scaling-stroke" d="M7.33 11H16.66C17.4 11 17.99 11.81 17.99 12.82V19.18C17.99 20.18 17.39 21 16.66 21H7.33C6.59 21 6 20.19 6 19.18V12.82C6 11.82 6.6 11 7.33 11Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path vector-effect="non-scaling-stroke" d="M8.5 10.86V6.5C8.5 4.57 10.07 3 12 3C13.93 3 15.5 4.57 15.5 6.5V10.86" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></g><defs><clipPath id="clip0_3785_11045"><rect width="13.5" height="19.5" fill="white" transform="translate(5.25 2.25)"></rect></clipPath></defs></svg><div class="dropin-input-label-container"><input id="dropin-field-0.7nvhdt814wv" type="password" name="password" autocomplete="current-password" placeholder="Password" aria-label="Password" aria-required="true" aria-invalid="false" aria-describedby="password-feedback" data-testid="passwordInput" class="dropin-input dropin-input--medium dropin-input--primary dropin-input--floating dropin-input--icon-left"><label for="dropin-field-0.7nvhdt814wv" class="dropin-input__label--floating dropin-input__label--floating--icon-left">Password *</label><div id="pwm-inline-icon-85441" class="pwm-field-icon" style="position: absolute !important; width: 18px !important; height: 18px !important; min-height: 0px !important; min-width: 0px !important; z-index: 2147483645 !important; box-shadow: none !important; box-sizing: content-box !important; background: none !important; border: none !important; padding: 0px !important; cursor: pointer !important; outline: none !important; margin-top: 19px; margin-left: 718px;"><svg style="display: inline-block !important; width: 16px !important; height: 16px !important; fill: rgb(230, 0, 23) !important; margin-top: 0.5px !important; position: absolute !important; top: 0px !important; left: 0px !important;" viewBox="0 0 64 64"><g><path d="m20,28.12a33.78,33.78 0 0 1 13.36,2.74a22.18,22.18 0 0 1 0.64,5.32c0,9.43 -5.66,17.81 -14,20.94c-8.34,-3.13 -14,-11.51 -14,-20.94a22.2,22.2 0 0 1 0.64,-5.32a33.78,33.78 0 0 1 13.36,-2.74m0,-28.12c-8.82,0 -14,7.36 -14,16.41l0,5.16c2,-1.2 2,-1.49 5,-2.08l0,-3.08c0,-6.21 2.9,-11.41 8.81,-11.41l0.19,0c6.6,0 9,4.77 9,11.41l0,3.08c3,0.58 3,0.88 5,2.08l0,-5.16c0,-9 -5.18,-16.41 -14,-16.41l0,0zm0,22c-6.39,0 -12.77,0.67 -18.47,4a31.6,31.6 0 0 0 -1.53,9.74c0,13.64 8.52,25 20,28.26c11.48,-3.27 20,-14.63 20,-28.26a31.66,31.66 0 0 0 -1.54,-9.77c-5.69,-3.3 -12.08,-4 -18.47,-4l0,0l0.01,0.03z"></path><path d="m21.23,39.5a2.81,2.81 0 0 0 1.77,-2.59a2.94,2.94 0 0 0 -3,-2.93a3,3 0 0 0 -3,3a2.66,2.66 0 0 0 1.77,2.48l-1.77,4.54l6,0l-1.77,-4.5z"></path></g></svg><span id="pwm-inline-icon-badge-85441" style="position: absolute !important; inset: auto auto 0px 7px !important; box-sizing: content-box !important; font-family: monospace !important; font-size: 9px !important; border-radius: 2px !important; color: white !important; background: rgb(112, 185, 52) !important; border: 0.5px solid white !important; width: auto !important; height: 10px !important; min-width: 10px !important; min-height: 0px !important; display: flex !important; align-items: center !important; justify-content: center !important; pointer-events: none !important;">0</span></div></div></div></div><div class="dropin-field__hint dropin-field__hint--medium"></div></div><button role="button" aria-label="Click to show password" title="Click to show password" type="button" data-testid="toggle-password-icon" class="dropin-button dropin-button--medium dropin-button--tertiary dropin-input-password__eye-icon dropin-input-password__eye-icon--hide auth-sign-in-form__form__password"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="false" class="dropin-icon dropin-icon--shape-stroke-2"><path d="M17.11 18.12C19.13 17.16 20.85 15.62 22.02 13.67C20.01 10.32 16.28 8.07 11.99 8.07M11.99 8.07C11.09 8.07 10.21 8.17 9.35 8.36M11.99 8.07V4.75M20.5 11.03L23.22 9.03M16.81 8.89L18.45 6.08M3.47 11.03L0.75 9.03M11.3096 10.99C11.5296 10.94 11.7596 10.91 11.9996 10.91C13.5596 10.91 14.8296 12.15 14.8296 13.67C14.8296 14.05 14.7496 14.41 14.6096 14.74M11.9999 16.43C10.4399 16.43 9.16992 15.19 9.16992 13.67C9.16992 13.37 9.21992 13.09 9.30992 12.83M6.13996 9.60001C4.43996 10.57 2.98996 11.96 1.95996 13.67C4.03996 17.15 7.85996 19.27 11.99 19.27C12.57 19.27 13.15 19.23 13.71 19.14M20.4404 22.5L4.44043 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div><div class="auth-sign-in-form__form__buttons"><div class="auth-sign-in-form__form__buttons__combine"><button role="button" type="button" data-testid="switchToSignUp" class="dropin-button dropin-button--medium dropin-button--tertiary auth-button auth-sign-in-form__button auth-sign-in-form__button--forgot" style="padding: 0px;"><span class="auth-button__text">Forgot password?</span></button></div><button role="button" type="submit" class="dropin-button dropin-button--medium dropin-button--primary auth-button auth-sign-in-form__button auth-sign-in-form__button--submit"><span class="auth-button__text">Sign in</span></button></div></form><div id="generateCustomerToken"></div></div></div></div>
      <ul class="authenticated-user-menu" style="display: none;">
         <li><a href="/customer/account">My Account</a></li>
          <li><button>Logout</button></li>
      </ul>
    </div>
    </div>
  </div>
`);

  navTools.append(authFragment);

  const authPanel = navTools.querySelector('.auth-panel');
  const loginButton = navTools.querySelector('.nav-login-button');

  if (excludeAuthFromPaths.includes(window.location.pathname)) {
    loginButton.style.display = 'none';
  }

// Toggle auth dropdown visibility
  function toggleAuthDropdown(state) {
    const show = state ?? !authPanel.classList.contains('nav-tools-panel--show');
    authPanel.classList.toggle('nav-tools-panel--show', show);
    authPanel.setAttribute('aria-hidden', !show);
    loginButton.setAttribute('aria-expanded', show);
    if (show) authPanel.focus();
  }

// Open/close on login button click
  loginButton.addEventListener('click', () => {
    console.log('Login button clicked');
    toggleAuthDropdown();
  });

// Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!authPanel.contains(e.target) && !loginButton.contains(e.target)) {
      toggleAuthDropdown(false);
    }
  });

// Update login button UI on auth state change
  function updateAuthUI(isAuthenticated) {
    const userName = getCookie('auth_dropin_firstname');
    if (isAuthenticated) {
      loginButton.textContent = `Hi, ${userName}`;
    } else {
      loginButton.innerHTML = `
      <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <g fill="none" stroke="#000" stroke-width="1.5">
          <circle cx="12" cy="6" r="4"></circle>
          <path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"></path>
        </g>
      </svg>
    `;
    }
  }

// Listen to your auth event emitter
  events.on('authenticated', updateAuthUI);

// Initial UI update


  // load topline as fragment
  const toplineMeta = getMetadata('topline');
  const toplinePath = toplineMeta ? new URL(toplineMeta, window.location).pathname : '/topline';
  const fragmentTopLine = await loadFragment(toplinePath);

// Create topline-wrapper
  const toplineWrapper = document.createElement('div');
  toplineWrapper.className = 'topline-wrapper';

  // Check if fragment has content
  if (fragmentTopLine && fragmentTopLine.children.length > 0) {
    while (fragmentTopLine.firstElementChild) toplineWrapper.append(fragmentTopLine.firstElementChild);
  } else {
    toplineWrapper.textContent = 'To edit this text, create a document named topline';
  }

  // Create topline section
  const topLine = document.createElement('div');
  topLine.className = 'topline';
  topLine.append(toplineWrapper);

  // Create nav-wrapper (you already have nav from before)
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  // Append both to block
  block.append(topLine);
  block.append(navWrapper);

  navWrapper.addEventListener('mouseout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  window.addEventListener('resize', () => {
    navWrapper.classList.remove('active');
    overlay.classList.remove('show');
    toggleMenu(nav, navSections, false);
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    navWrapper.classList.toggle('active');
    overlay.classList.toggle('show');
    toggleMenu(nav, navSections);
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  renderAuthCombine(
    navSections,
    () => !isDesktop.matches && toggleMenu(nav, navSections, false),
  );
  renderAuthDropdown(navTools);
}

events.on('cart/initialized', () => {
  applyHashTagsForDomElement('nav');
}, { eager: true });

events.on('cart/updated', () => {
  applyHashTagsForDomElement('nav');
}, { eager: true });

events.on('cart/reset', () => {
  applyHashTagsForDomElement('nav');
}, { eager: true });
