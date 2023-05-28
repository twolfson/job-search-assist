// ==UserScript==
// @name     Job search assist
// @version  1
// @include  https://wellfound.com/jobs*
// @grant    GM.registerMenuCommand
// @require  https://cdn.jsdelivr.net/npm/lodash.debounce@4.0.8/index.min.js
// ==/UserScript==

// Define script constants
const DEV = true;
const DEBOUNCE_FREQUENCY_MS = 1000;

const makeButton = () => {
  // DEV: We tried to leverage hyperscript and JSDelivr but ran into headaches
  //   Violentmonkey supports JSX (we're on Greasemonkey), which is ideal but let's just keep shipping for now
  const buttonEl = document.createElement('button');
  buttonEl.style.cssText = [
    // Based on "Salem" from https://hypercolor.dev/#gradients
    'background: linear-gradient(to left, rgb(27, 69, 160), rgb(127, 53, 185), rgb(124, 58, 237));',
    'color: white;'
    'font-weight: 500;',
    'padding: 0 12px;',
    'border-radius: 8px;',
    'margin-left: auto;',
    'cursor: pointer;',
    'margin-right: 8px;',
  ].join(" ")
  buttonEl.innerText = 'Hide Company';
  return button;
}

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
