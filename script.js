// ==UserScript==
// @name     Job search assist
// @version  1
// @include  https://wellfound.com/jobs*
// @grant    none
// ==/UserScript==

// Define script constants
const DEV = true;

// Define common interface for company results across different sites
class AngelListCompanyResult {
  constructor(el) {
    this.el = el;
    this.name = this.getName();
  }

  getName() {
    return this.el.querySelector('.relative h2').innerText;
  }
}

// Define our common to
const main = () => {
  // Resolve our company results
  const companyEls = document.querySelectorAll('[data-test="StartupResult"]');
  const companyResults = [].slice.call(companyEls).map((el) => new AngelListCompanyResult(el))
  console.log('hi', companyResults);
}

// When the page loads
window.addEventListener('DOMContentLoaded', (evt) => {
  main();
  // TODO: Add debouncing
  new MutationObserver(main).observe(document.querySelector('body'), {childList: true, subtree: true})
});

// Expose tooling for debugging
if (DEV) {
  unsafeWindow.JSA_DUMP = function () {
    throw new Error("Not implemented");
  };

  unsafeWindow.JSA_SHOW_COMPANY = () => {
    throw new Error("Not implemented");
  };
}
