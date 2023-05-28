// ==UserScript==
// @name     Job search assist
// @version  1
// @include  https://wellfound.com/jobs*
// @grant    GM.registerMenuCommand
// @require  https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
//    Provides _.debounce
// ==/UserScript==

// Define script constants
const DEV = true;
const DEBOUNCE_FREQUENCY_MS = 1000;

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

// Define our common function
const main = () => {
  // Resolve our company results
  const companyEls = document.querySelectorAll('[data-test="StartupResult"]');
  const companyResults = [].slice.call(companyEls).map((el) => new AngelListCompanyResult(el))
  console.log('hi', companyResults);
}

// When the page loads
window.addEventListener('DOMContentLoaded', (evt) => {
  main();
  // https://lodash.com/docs/4.17.15#debounce
  new MutationObserver(_.debounce(main, DEBOUNCE_FREQUENCY_MS)).observe(document.querySelector('body'), {childList: true, subtree: true})
});

// Expose tooling for debugging
// Guidance on @grant requirements + test script, https://www.reddit.com/r/learnjavascript/comments/s2n99w/comment/hsh3k41/?context=3
if (DEV) {
  GM.registerMenuCommand("JSA: Dump Hidden Companies", () => {
    console.error("Not implemented");
  });

  GM.registerMenuCommand("JSA: Unhide Company", () => {
    const companyName = window.prompt("What's the company's name?");
    console.log("Company name: ", companyName);
    console.error("Not implemented");
  });
}
