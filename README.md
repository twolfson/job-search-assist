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
- [Climatebase][]
- [Tech Jobs for Good][]
- [Terra.do][]
- [Wellfound][] (fka AngelList)
- [Work at a Startup][]
- Want to get support for more? [Open an issue][] or [send me an email at todd@twolfson.com](mailto:todd@twolfson.com)

[Climatebase]: https://climatebase.org/
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
Development was somewhat janky as well due to using [Greasmonkey][], but faster than iterating with build steps and pressing a "Reload" button

- Edit either (locally + copy content to Violentmonkey) OR edit directly inside of Violentmonkey
- When ready to commit, copy content to local editor and commit changes

- Alternatively, Violentmonkey does seem to [support local editor without copy/pasting][vm-editing] but we have yet to try it

[Greasemonkey]: https://www.greasespot.net/
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
