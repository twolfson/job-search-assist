// ==UserScript==
// @name     Job Search Assist
// @version  1
// @include  https://wellfound.com/jobs*
// @grant    GM.registerMenuCommand
// @require  https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// ==/UserScript==

// Define script constants
const DEV = true;
const DEBOUNCE_FREQUENCY_MS = 1000;

// DEV: We were struggling with JSDeliver + ESM, so hardcoding some `assert` for now
const assert = (val, msg) => {
  if (!val) { throw new Error(msg); }
};

// JSA = Job Search Assist
const makeJsaButton = () => {
  // DEV: We tried to leverage hyperscript and JSDelivr but ran into headaches
  //   Violentmonkey supports JSX (we're on Greasemonkey), which is ideal but let's just keep shipping for now
  const buttonEl = document.createElement('button');
  buttonEl.style.cssText = [
    // Based on "Salem" from https://hypercolor.dev/#gradients
    'background: linear-gradient(to left, rgb(27, 69, 160), rgb(127, 53, 185), rgb(124, 58, 237));',
    // Taken from `drop-shadow-md`, https://tailwindcss.com/docs/drop-shadow#adding-a-drop-shadow
    'filter: drop-shadow(rgba(0, 0, 0, 0.07) 0px 4px 3px) drop-shadow(rgba(0, 0, 0, 0.06) 0px 2px 2px);',
    'color: white;',
    'font-weight: 500;',
    'padding: 0 0.75rem;', // 12px
    'border-radius: 0.5rem;', // 8px
    'cursor: pointer;',
  ].join(" ");
  buttonEl.innerText = 'Hide Company';
  // Will appear as `data-jsa-bound` in HTML
  buttonEl.dataset.jsaBound = "true";
  return buttonEl;
};

// Define common interface for company results across different sites
class AngelListCompanyResult {
  constructor(el) {
    this.el = el;
    this.name = this.getName();
    this.bindToElement();
  }

  getName() {
    return this.el.querySelector('.relative h2').innerText;
  }

  bindToElement() {
    // If we're already bound, exit out
    const existingButtonEls = [].slice.call(this.el.querySelectorAll('button'));
    if (existingButtonEls.some((buttonEl) => buttonEl.dataset.jsaBound)) {
      // TODO: Possibly reuse the existing element somehow instead?
      return;
    }

    // Find our insertion point
    const reportButtonEl = existingButtonEls.find((buttonEl) => buttonEl.innerText.includes("Report"))
    assert(reportButtonEl, `Failed to find \"Report\" button for ${this.name}`)

    // Generate our buttons
    const jsaHideButtonEl = makeJsaButton();

    // Bind with desired layouts
    reportButtonEl.parentElement.insertBefore(jsaHideButtonEl, reportButtonEl);
    jsaHideButtonEl.style.marginLeft = 'auto';
    jsaHideButtonEl.style.marginRight = '0.5rem'; // 8px
    reportButtonEl.style.marginLeft = '0'; // 0px
  }
}

// Define our common function
const main = () => {
  // Resolve our company results
  // DEV: `:not` filters out compact results
  const companyEls = document.querySelectorAll('div:not([data-test="FeaturedStartups"]) > * > [data-test="StartupResult"]');
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
