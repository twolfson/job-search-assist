# Job Search Assist
Browser extension to avoid seeing the same job/company listing twice

## Problem Definition
> "Ugh, I refreshed the page and am seeing the same listings!" - Me
>
> "Grr, I just saw this company on another site!!" - Also me

In user story form: As a job searcher, I want to avoid reading the same job/company listing twice

## Solution
A browser extension which:
- Surfaces a "Hide Company" button on supported websites
- Hides job/company listing on click, on refresh, and across all websites

### Demo Video
[![Reduced size demo video GIF](https://i.imgur.com/sd4QH0Z.gif)](https://imgur.com/m8ocwXx)
<br/>
[Watch full size video](https://imgur.com/m8ocwXx)
<!-- Full album: https://imgur.com/a/j81PXQu -->

## Supported Websites
- [80,000 Hours][]
- [Climatebase][]
- [Fast Forward][]
- [Getro][] (\*.getro.com)
- [Hacker News][]
- [Tech Jobs for Good][]
- [Terra.do][]
- [Wellfound][] (fka AngelList)
- [Work at a Startup][]
- Want to get support for more? [Open an issue][] or [send me an email at todd@twolfson.com](mailto:todd@twolfson.com)

[80,000 Hours]: https://jobs.80000hours.org/
[Climatebase]: https://climatebase.org/
[Fast Forward]: https://jobs.ffwd.org/
[Hacker News]: https://hn.algolia.com/?dateRange=pastMonth&page=0&prefix=true&query=%22Ask%20HN%3A%20Who%20is%20hiring%3F%22&sort=byPopularity&type=story
[Getro]: https://www.getro.com/
[Tech Jobs for Good]: https://www.techjobsforgood.com/
[Terra.do]: https://terra.do/
[Wellfound]: https://wellfound.com/
[Work at a Startup]: https://www.workatastartup.com/
[Open an issue]: https://github.com/twolfson/job-search-assist/issues

## Installation
1. Install [Violentmonkey][]
2. Open <https://github.com/twolfson/job-search-assist/raw/main/src/index.user.js>
3. Click "Confirm Installation" then "Close"
4. Navigate to <https://www.techjobsforgood.com/> and verify the new "Hide Company" button appears

For easier upfront development, we built this on top of [Violentmonkey][]. If we get enough adoption, then we can formalize this into a proper [browser extension][].

[Violentmonkey]: https://violentmonkey.github.io/get-it/
[browser extension]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions

## How do you use this?
I browse job boards, research companies, decide to persist info in an [Airtable][] or not, then hide the company from the job boards.

For referring to a viable list of companies, I use said [Airtable][] as my starting point (e.g. see if relevant role still open or not).

[Airtable]: https://airtable.com/

## Commands
In addition to hiding companies, we also provide commands under "Violentmonkey icon -> Job Search Assist"

These will only appear when on a supported site

The commands are:

- Dump Hidden Companies (outputs to console)
- Clear Hidden Company List

It's very easy to add support for "Undo Changes in Last 5 Minutes", "Unhide Company", or something along those lines. If you'd like support for that, please [Open an issue][] or [send me an email at todd@twolfson.com](mailto:todd@twolfson.com)

## Updates
To update to the latest version:

1. Open <https://github.com/twolfson/job-search-assist/raw/main/src/index.user.js>
2. Click on "Confirm re-installation" the "Close"

## Development
Before you do any development, we recommend backing up the Violentmonkey values to a `.json` file.

Once you're backed up, development can be done via a few ways:

- Edit inside Violentmonkey OR paste modified version from local editor into Violentmonkey
- Use [auto-reloading version][vm-editing]
    - Run `npm run start:dev` to run local server
    - Navigate to <http://127.0.0.1:8080/src/index.user.js> in browser to reinstall over existing version
    - Ensure "Track local file before this window is closed" is set
    - Confirm reinstallation
    - Do not close window until ready (we suggest pinning instead)

[vm-editing]: https://violentmonkey.github.io/posts/how-to-edit-scripts-with-your-favorite-editor/

## Releases
Releases are performed via `foundry`:

1. Update `CHANGELOG.md`
2. Stage changes via `git add -p`
3. Run `foundry release <version>`

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint via `npm run lint`, format via `npm run format`, and test via `npm test`.

## Unlicense
As of May 28 2023, Todd Wolfson has released this repository and its contents to the public domain.

It has been released under the [UNLICENSE][].

[UNLICENSE]: UNLICENSE
