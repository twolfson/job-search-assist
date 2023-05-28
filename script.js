// ==UserScript==
// @name     Job search assist
// @version  1
// @include  https://wellfound.com/jobs*
// @grant    none
// ==/UserScript==

const $ = document.querySelector
const $$ = document.querySelectorAll

class AngelListCompanyResult {
  constructor(el) {
    this.el = el;
  }

  getName() {

  }
}

// Define our common function
const main = () => {
  // Resolve our company cards
  // TODO: Abstract to common cross-site setup
  const companyEls = $$('data-test="StartupResult"');

  console.log('hi');
}

// When the page loads
window.addEventListener('DOMContentLoaded', (evt) => {
  main();
  // TODO: Add debouncing
  new MutationObserver(main).observe($('body'), {childList: true, subtree: true})
});
