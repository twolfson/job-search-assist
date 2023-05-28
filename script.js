// ==UserScript==
// @name     Job search assist
// @version  1
// @include  https://wellfound.com/jobs*
// @grant    none
// ==/UserScript==

class AngelListCompanyResult {
  constructor(el) {
    this.el = el;
    this.name = this.getName();
  }

  getName() {
    return this.el.querySelector('.relative h2').innerText;
  }
}

// Define our common function
const main = () => {
  // Resolve our company cards
  // TODO: Abstract to common cross-site setup
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
