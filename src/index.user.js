// ==UserScript==
// @name     Job Search Assist
// @version  1
// @include  https://*.getro.com/jobs*
// @include  https://climatebase.org/jobs*
// @include  https://jobs.ffwd.org/jobs*
// @include  https://jobs.80000hours.org/*
// @include  https://news.ycombinator.com/*
//   "Ask HN: Who is hiring?" posts
// @include  https://terra.do/climate-jobs/job-board/*
// @include  https://wellfound.com/jobs*
// @include  https://www.techjobsforgood.com/*
// @include  https://www.workatastartup.com/companies*
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
    const stopEvent = (evt) => {
      evt.stopPropagation();
      evt.preventDefault();
    };
    const handleClick = async (evt) => {
      // On sites like Climatebase where the container is a link (<a>), prevent that action
      // DEV: This doesn't have to happen before `await`, but it feels saner if we do
      stopEvent(evt);

      await addCompanyToHideList(this.name);
      this.hide();

      // Re-run page bindings for multi-hide (e.g. Climatebase)
      await bindToPage();
    };
    jsaHideButtonEl.onclick = handleClick;

    // Stop unexpected secondary events on 80,000 Hours
    jsaHideButtonEl.onpointerdown = stopEvent;
    jsaHideButtonEl.onpointerup = stopEvent;

    jsaHideButtonEl.title = `Hide Company (${this.name})`;
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
    const tagsRowEl =
      this.el.querySelector(".list_card__tags") ||
      this.el.querySelector(".list_card__metadata");
    tagsRowEl.insertAdjacentElement("afterend", jsaRowWrapperEl);
    jsaHideButtonEl.style.padding = "0.5rem 0.75rem"; // 8px 12px
    jsaHideButtonEl.style.borderRadius = "0.5rem"; // 8px
    jsaHideButtonEl.style.marginTop = "0.75rem"; // 12px
    jsaHideButtonEl.style.marginLeft = "auto"; // Leverage `flex` wrapper to align right
  }
}

class TerraDoCompanyResult extends BaseCompanyResult {
  static generateCompanyResultsFromDocument() {
    const companyEls = document.querySelectorAll("#search-results > div");
    return this.generateCompanyResultsFromCollection(companyEls);
  }

  getName() {
    return this.el.querySelector("p > a").innerText;
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
    const flexColEl = this.el.querySelector(".flex > .flex-col");
    flexColEl.appendChild(jsaRowWrapperEl);
    // Use `setProperty` syntax to add "important", https://css-tricks.com/an-introduction-and-guide-to-the-css-object-model-cssom/#aa-getting-and-setting-a-propertys-priority
    // DEV: `!important` required for overriding CSS-defined `button { !imporant }` styles
    jsaHideButtonEl.style.setProperty("padding", "0.5rem 0.75rem", "important"); // 8px 12px
    jsaHideButtonEl.style.setProperty("color", "white", "important");
    jsaHideButtonEl.style.borderRadius = "0.5rem"; // 8px
  }
}

class GetroCompanyResult extends BaseCompanyResult {
  static generateCompanyResultsFromDocument() {
    const companyEls = document.querySelectorAll(
      '.infinite-scroll-component > [data-testid="job-list-item"]'
    );
    return this.generateCompanyResultsFromCollection(companyEls);
  }

  getName() {
    return this.el.querySelector('[itemprop="hiringOrganization"]').innerText;
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
    jsaRowWrapperEl.appendChild(jsaHideButtonEl);

    // Find our insertion point and bind with desired layout
    const flexColEl = this.el.querySelector(".job-info"); // It's styled as flex via CSS (not className)
    flexColEl.appendChild(jsaRowWrapperEl);
    jsaHideButtonEl.style.padding = "0.5rem 0.75rem"; // 8px 12px
    jsaHideButtonEl.style.borderRadius = "0.5rem"; // 8px
    jsaHideButtonEl.style.marginTop = "0.5rem"; // 8px

    // Use same styles as other links to appear above "Read more >" link
    jsaHideButtonEl.style.position = "relative";
    jsaHideButtonEl.style.zIndex = 2;
  }
}

class HackerNewsWhoIsHiringCompanyResult extends BaseCompanyResult {
  static generateCompanyResultsFromDocument() {
    // DEV: Due to `<title>` filtering, we don't need to worry about being in a nested post or not
    const commentEls = document.querySelectorAll(
      "table#hnmain > tbody > tr > td > table.comment-tree > tbody > tr"
    );
    const companyEls = [].filter.call(commentEls, (commentEl) => {
      return commentEl.querySelector('.ind[indent="0"]');
    });
    return this.generateCompanyResultsFromCollection(companyEls);
  }

  getName() {
    // People don't always follow the format, but we're considering those edge cases YAGNI for now (limited people using this)
    //   Examples from https://news.ycombinator.com/item?id=36152014:
    //   3dverse | Montreal, CAN | Onsite/hybrid (within CAN) | Visa
    //   Replicate (YC W20) | Berkeley, CA + ... (has "(YC W20)" in title)
    //   RockTree Capital is looking to fill 2 positions ... (no | at all)
    //   Aclima <a href="...">https://aclima.io</a> | Front End Lead ... (has URL in title)
    //   JITO LABS, INC (as opposed to Jito Labs, Inc)
    //   Superblocks // NYC ... (using // as delimiter)
    // hnhired.fly.dev (now archived) was quite simple yet robust it seems, https://github.com/gadogado/hn-hired/blob/293ca9cd015bd8ee390d99978803f4f4ef30491f/scripts/get-latest-story.server.ts#L163-L168

    // If this is a flagged comment (e.g. "synthsara" on https://news.ycombinator.com/item?id=36152014&p=2), then return fallback name
    const username = this.el.querySelector(".hnuser").innerText;
    const fallbackName = `hn-who-is-hiring--${username}`;
    if (this.el.querySelector(".comment.noshow")) {
      return fallbackName;
    }

    // Isolate the first row (i.e. could be no `<p>` with a following `<p`> -- https://news.ycombinator.com/item?id=36232219)
    //   Relevant MDN explaining it includes Text node, not just HTML nodes/elements -- https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes
    // DEV: .c00 is for color styling, here's a grayed out one - https://news.ycombinator.com/item?id=36162369
    const firstLineNode = this.el.querySelector(".comment > .commtext")
      .childNodes[0];
    // DEV: This does not match for the Aclima scenario due to not having any "|" in the first match, but that's an edge case so skip it
    // DEV: You can sanity check this implementation by seeing the "Company" setting
    const companyNameMatch =
      firstLineNode.nodeValue && firstLineNode.nodeValue.match(/^([^|]+)(\|)/);
    if (companyNameMatch) {
      return companyNameMatch[1].trim();
    } else {
      return fallbackName;
    }
  }

  bindToElement() {
    // If we're already bound, exit out
    const existingButtonEls = [].slice.call(this.el.querySelectorAll("button"));
    if (existingButtonEls.some((buttonEl) => buttonEl.dataset.jsaBound)) {
      return;
    }

    // Generate our buttons
    const jsaHideButtonEl = this.makeJsaHideButtonEl();
    const jsaRowWrapperEl = document.createElement("p");
    jsaRowWrapperEl.appendChild(jsaHideButtonEl);

    // Find our insertion point and bind with desired layout
    const replyEl = this.el.querySelector(".reply");
    replyEl.insertAdjacentElement("beforebegin", jsaRowWrapperEl);
    jsaHideButtonEl.style.padding = "0.5rem 0.75rem"; // 8px 12px
    jsaHideButtonEl.style.borderRadius = "0.5rem"; // 8px
  }

  hide() {
    // Hide our element normally
    super.hide();

    // Additionally hide adjacent elements in our thread
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/nextElementSibling
    let el = this.el;
    while (true) {
      el = el.nextElementSibling;

      // If it's a new root post, then stop hiding
      if (el.querySelector('.ind[indent="0"]')) {
        break;
      }

      // If it's no longer a comment (e.g. "### more comments..."), then stop looping
      if (!el.matches("[id]")) {
        break;
      }

      // Otherwise, hide this "nested" element
      el.style.display = "none";
    }
  }
}

// DEV: Numbers are not valid starts to identifers so use _ (even though indicates private usually), https://stackoverflow.com/a/3155352/1960509
class _80000HoursCompanyResult extends BaseCompanyResult {
  static generateCompanyResultsFromDocument() {
    const companyEls = document.querySelectorAll("button.job-card");
    return this.generateCompanyResultsFromCollection(companyEls);
  }

  getName() {
    return this.el.querySelector(".flex-col > div:nth-child(2)").innerText;
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
    this.el.appendChild(jsaHideButtonEl);
    jsaHideButtonEl.style.padding = "0.5rem 0.75rem"; // 8px 12px
    jsaHideButtonEl.style.borderRadius = "0.5rem"; // 8px
    jsaHideButtonEl.style.marginTop = "0.5rem"; // 8px
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
  {
    urlPattern: /https:\/\/terra.do\//,
    companyResultClass: TerraDoCompanyResult,
  },
  {
    urlPattern: /https:\/\/jobs.ffwd.org\//,
    companyResultClass: GetroCompanyResult,
  },
  {
    urlPattern: /https:\/\/[^.]+.getro.com\//,
    companyResultClass: GetroCompanyResult,
  },
  {
    urlPattern: /https:\/\/news.ycombinator.com\/item/,
    additionalMatcher: () => {
      // DEV: We could get paranoid and filter by `whoishiring` user, but this is prob good enough
      // DEV: This won't render on nested post items due to page title change. This is intentional (e.g. https://news.ycombinator.com/item?id=36158013)
      return window.document.title.startsWith("Ask HN: Who is hiring?");
    },
    companyResultClass: HackerNewsWhoIsHiringCompanyResult,
  },
  {
    urlPattern: /https:\/\/jobs.80000hours.org\//,
    companyResultClass: _80000HoursCompanyResult,
  },
];

// Define our common function
const bindToPage = async () => {
  // Resolve our company results
  const result = URL_PATTERN_TO_RESULT_MATCHES.find(
    ({ urlPattern, additionalMatcher }) => {
      if (window.location.href.match(urlPattern)) {
        return additionalMatcher ? additionalMatcher() : true;
      }
      return false;
    }
  );

  if (!result) {
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
