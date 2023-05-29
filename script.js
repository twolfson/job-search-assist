// ==UserScript==
// @name     Job Search Assist
// @version  1
// @include  https://wellfound.com/jobs*
// @include  https://www.techjobsforgood.com/*
// @include  https://www.workatastartup.com/companies*
// @include  https://climatebase.org/jobs*
// @grant    GM_registerMenuCommand
// @grant    GM_getValue
// @grant    GM_setValue
// @grant    GM_deleteValue
// @require  https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
//   Provides _
// @require  https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js
//   Provides Papa
// @run-at document-end
// ==/UserScript==

// Define script constants
const DEBUG = true;
const THROTTLE_FREQUENCY_MS = 300;
const HIDE_LIST_KEY = "jsa-hide-list";

// DEV: We were struggling with JSDeliver + ESM, so hardcoding some `assert` for now
const assert = (val, msg) => {
  if (!val) {
    throw new Error(msg);
  }
};

const readHideList = async () => {
  // Parses to [{key1: valA, key2: valB}, {key1: valC, key2: valD}], https://www.papaparse.com/docs#results
  const csvContent = await GM_getValue(HIDE_LIST_KEY);
  if (!csvContent) {
    return [];
  }

  const parseResults = Papa.parse(csvContent, { header: true });
  if (parseResults.errors.length) {
    throw new Error(`Parse errors: ${JSON.stringify(parseResults.errors)}`);
  }

  const data = parseResults.data;
  if (data.length) {
    assert(data[0].hidden_at, `Data structure not as expected ${data}`);
  }
  return data;
};

const addCompanyToHideList = async (companyName) => {
  // DEV: Always read from storage to support multiple pages (otherwise cache-based writes lose recent edits)
  // TODO: If parsing/unparsing or linear searching performance gets bad,
  //   then consider using an in-memory cache (requiring checksum unchanged for multi-page support)
  //   and building an lookup map built on same checksum mechanism
  const hideList = await readHideList();
  hideList.push({
    company_name: companyName,
    hidden_at: new Date().toISOString(),
  });

  const csvContent = Papa.unparse(hideList);
  await GM_setValue(HIDE_LIST_KEY, csvContent);

  if (DEBUG) {
    console.debug(
      `DEBUG: Company hidden "${companyName}"\n${HIDE_LIST_KEY}:\n${await GM_getValue(
        HIDE_LIST_KEY
      )}`
    );
  }
};

const makeJsaButton = () => {
  // DEV: We tried to leverage hyperscript and JSDelivr but ran into headaches
  //   Violentmonkey supports JSX, which is ideal but we initially developed on Greasemonkey + had said issues
  const buttonEl = document.createElement("button");
  // DEV: We could add `:hover` styles to page via `GM_AddStyle` but that's annoying to migrate to an extension
  buttonEl.style.cssText = [
    // Based on "Salem" from https://hypercolor.dev/#gradients
    "background: linear-gradient(to left, rgb(127, 53, 185), rgb(124, 58, 237));",
    // Taken from `drop-shadow-md`, https://tailwindcss.com/docs/drop-shadow#adding-a-drop-shadow
    "filter: drop-shadow(rgba(0, 0, 0, 0.07) 0px 4px 3px) drop-shadow(rgba(0, 0, 0, 0.06) 0px 2px 2px);",
    "color: white;",
    "border: 0;",
    "font-weight: 500;",
    "cursor: pointer;",
  ].join(" ");
  buttonEl.innerText = "Hide Company";
  // Will appear as `data-jsa-bound` in HTML
  buttonEl.dataset.jsaBound = "true";
  return buttonEl;
};

// Define company result interfaces across different sites
class BaseCompanyResult {
  static generateCompanyResultsFromCollection(companyEls) {
    const klass = this;
    return [].slice.call(companyEls).map((el) => new klass(el));
  }
  static generateCompanyResultsFromDocument() {
    throw new Error(
      "`generateCompanyResultsFromDocument` not implemented. Please implement on child class"
    );
  }

  constructor(el) {
    this.el = el;
    this.name = this.getName();
    this.bindToElement();
  }

  getName() {
    throw new Error(
      "`getName` not implemented. Please implement on child class"
    );
  }
  bindToElement() {
    throw new Error(
      "`bindToElement` not implemented. Please implement on child class"
    );
  }

  makeJsaHideButtonEl() {
    const jsaHideButtonEl = makeJsaButton();
    const handleClick = async (evt) => {
      // On sites like Climatebase where the container is a link (<a>), prevent that action
      // DEV: This doesn't have to happen before `await`, but it feels saner if we do
      evt.stopPropagation();
      evt.preventDefault();

      await addCompanyToHideList(this.name);
      this.hide();

      // Re-run page bindings for multi-hide (e.g. Climatebase)
      await bindToPage();
    };
    jsaHideButtonEl.onclick = handleClick;
    return jsaHideButtonEl;
  }

  hide() {
    // DEV: We could check if this is already hidden, but it's simple to just keep hiding it
    this.el.style.display = "none";
  }
}

class WellfoundCompanyResult extends BaseCompanyResult {
  static generateCompanyResultsFromDocument() {
    const companyEls = document.querySelectorAll(
      // DEV: `:not` filters out compact results
      'div:not([data-test="FeaturedStartups"]) > * > [data-test="StartupResult"]'
    );
    return this.generateCompanyResultsFromCollection(companyEls);
  }

  getName() {
    return this.el.querySelector(".relative h2").innerText;
  }

  bindToElement() {
    // DEV: We always add elements, regardless of being hidden or not -- e.g. futureproof unhide support

    // If we're already bound, exit out
    const existingButtonEls = [].slice.call(this.el.querySelectorAll("button"));
    if (existingButtonEls.some((buttonEl) => buttonEl.dataset.jsaBound)) {
      return;
    }

    // Generate our buttons
    const jsaHideButtonEl = this.makeJsaHideButtonEl();

    // Find our insertion point and bind with desired layouts
    const reportButtonEl = existingButtonEls.find((buttonEl) =>
      buttonEl.innerText.includes("Report")
    );
    reportButtonEl.insertAdjacentElement("beforebegin", jsaHideButtonEl);
    jsaHideButtonEl.style.padding = "0 0.75rem"; // 12px
    jsaHideButtonEl.style.borderRadius = "0.5rem"; // 8px
    jsaHideButtonEl.style.marginLeft = "auto";
    jsaHideButtonEl.style.marginRight = "0.5rem"; // 8px
    reportButtonEl.style.marginLeft = "0"; // 0px
  }
}

class TechJobsForGoodCompanyResult extends BaseCompanyResult {
  static generateCompanyResultsFromDocument() {
    const companyEls = document.querySelectorAll(".three.column.grid .ui.card");
    return this.generateCompanyResultsFromCollection(companyEls);
  }

  getName() {
    // DEV: `innerText` is uppercasing content on Firefox due to CSS style (keep to only Tech Jobs for Good please)
    return this.el.querySelector(".company_name").innerHTML;
  }

  bindToElement() {
    // If we're already bound, exit out
    const existingButtonEls = [].slice.call(this.el.querySelectorAll("button"));
    if (existingButtonEls.some((buttonEl) => buttonEl.dataset.jsaBound)) {
      return;
    }

    // Generate our buttons
    const jsaHideButtonEl = this.makeJsaHideButtonEl();

    // Find our insertion point and bind with desired layout
    const postedTimeEl = [].find.call(this.el.children, (childEl) =>
      childEl.matches(".extra.content")
    );
    postedTimeEl.insertAdjacentElement("afterend", jsaHideButtonEl);
    jsaHideButtonEl.style.padding = "0.75rem"; // 12px
    jsaHideButtonEl.style.display = "block";
  }
}

class WorkAtAStartupCompanyResult extends BaseCompanyResult {
  static generateCompanyResultsFromDocument() {
    const companyEls = document.querySelectorAll(
      ".directory-list > div:not(.loading)"
    );
    return this.generateCompanyResultsFromCollection(companyEls);
  }

  getName() {
    return this.el.querySelector(".company-name").innerText;
  }

  bindToElement() {
    // If we're already bound, exit out
    const existingButtonEls = [].slice.call(this.el.querySelectorAll("button"));
    if (existingButtonEls.some((buttonEl) => buttonEl.dataset.jsaBound)) {
      return;
    }

    // Generate our buttons
    const jsaHideButtonEl = this.makeJsaHideButtonEl();
    const jsaRowWrapperEl = document.createElement("div");
    jsaRowWrapperEl.style.display = "flex";
    jsaRowWrapperEl.appendChild(jsaHideButtonEl);

    // Find our insertion point and bind with desired layout
    const rowEls = this.el.querySelector(".w-full").children;
    const lastRow = rowEls[rowEls.length - 1];
    lastRow.insertAdjacentElement("afterend", jsaRowWrapperEl);
    jsaHideButtonEl.style.padding = "0.5rem 0.75rem"; // 8px 12px
    jsaHideButtonEl.style.borderRadius = "0.5rem"; // 8px
    jsaHideButtonEl.style.marginTop = "0.75rem"; // 12px
    jsaHideButtonEl.style.marginLeft = "auto"; // Leverage `flex` wrapper to align right
  }
}

class ClimatebaseCompanyResult extends BaseCompanyResult {
  static generateCompanyResultsFromDocument() {
    const companyEls = document.querySelectorAll("#jobList > .list_card");
    return this.generateCompanyResultsFromCollection(companyEls);
  }

  getName() {
    return this.el.querySelector(".list_card__subtitle").innerText;
  }

  bindToElement() {
    // If we're already bound, exit out
    const existingButtonEls = [].slice.call(this.el.querySelectorAll("button"));
    if (existingButtonEls.some((buttonEl) => buttonEl.dataset.jsaBound)) {
      return;
    }

    // Generate our buttons
    const jsaHideButtonEl = this.makeJsaHideButtonEl();
    const jsaRowWrapperEl = document.createElement("div");
    jsaRowWrapperEl.style.display = "flex";
    jsaRowWrapperEl.appendChild(jsaHideButtonEl);

    // Find our insertion point and bind with desired layout
    // DEV: "Novi Connect" under "https://climatebase.org/jobs?l=&q=Software+Engineer&p=0&remote=true" lacked a tags row
    const tagsRowEl = this.el.querySelector(".list_card__tags") || this.el.querySelector(".list_card__metadata");
    tagsRowEl.insertAdjacentElement("afterend", jsaRowWrapperEl);
    jsaHideButtonEl.style.padding = "0.5rem 0.75rem"; // 8px 12px
    jsaHideButtonEl.style.borderRadius = "0.5rem"; // 8px
    jsaHideButtonEl.style.marginTop = "0.75rem"; // 12px
    jsaHideButtonEl.style.marginLeft = "auto"; // Leverage `flex` wrapper to align right
  }
}

const URL_PATTERN_TO_RESULT_MATCHES = [
  {
    urlPattern: /https:\/\/wellfound.com\//,
    companyResultClass: WellfoundCompanyResult,
  },
  {
    urlPattern: /https:\/\/www.techjobsforgood.com\//,
    companyResultClass: TechJobsForGoodCompanyResult,
  },
  {
    urlPattern: /https:\/\/www.workatastartup.com\//,
    companyResultClass: WorkAtAStartupCompanyResult,
  },
  {
    urlPattern: /https:\/\/climatebase.org\//,
    companyResultClass: ClimatebaseCompanyResult,
  },
];

// Define our common function
const bindToPage = async () => {
  // Resolve our company results
  const result = URL_PATTERN_TO_RESULT_MATCHES.find(({ urlPattern }) =>
    window.location.href.match(urlPattern)
  );
  if (!result) {
    if (DEBUG) {
      console.debug(
        `DEBUG: No matching pattern found for ${window.location.href}`
      );
    }
    return;
  }
  const companyResults =
    result.companyResultClass.generateCompanyResultsFromDocument();

  // Find and hide companies which should already be hidden
  const hideList = await readHideList();
  const hideListByName = {};
  hideList.forEach((hideEntry) => {
    hideListByName[hideEntry.company_name] = hideEntry;
  });
  companyResults.forEach((companyResult) => {
    if (hideListByName.hasOwnProperty(companyResult.name)) {
      companyResult.hide();
    }
  });
  if (DEBUG) {
    console.debug("DEBUG: Company results loaded:", companyResults);
  }
};

// When the page loads (set via `@run-at`)
const handleDocumentEnd = () => {
  bindToPage();
  // https://lodash.com/docs/4.17.15#throttle
  new MutationObserver(_.throttle(bindToPage, THROTTLE_FREQUENCY_MS)).observe(
    document.querySelector("body"),
    { childList: true, subtree: true }
  );
};
handleDocumentEnd();

// Guidance on @grant requirements + test script, https://www.reddit.com/r/learnjavascript/comments/s2n99w/comment/hsh3k41/?context=3
GM_registerMenuCommand(
  "Dump Hidden Companies (outputs to console)",
  async () => {
    console.info(`Hidden companies:\n${await GM_getValue(HIDE_LIST_KEY)}`);
  }
);

GM_registerMenuCommand("Clear Hidden Company List", async () => {
  const confirmationMessage = "Yes, clear the list";
  const numEntries = (await readHideList()).length;
  const promptEntry = window.prompt(
    `Type "${confirmationMessage}" to delete the list (${numEntries} entries)`
  );
  if (promptEntry === confirmationMessage) {
    await GM_deleteValue(HIDE_LIST_KEY);
    window.location.reload();
  }
});
