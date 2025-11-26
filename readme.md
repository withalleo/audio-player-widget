# Setting up a widget

This is a demo template for an Alleo (or compatible) widget.

It includes a very simple widget, will all the necessary boilerplate and preferred development tools to get started.

## Installation

`npm install`

## Code

The widget code is in the `src` folder. The `main.ts` file is the entry point for the widget. The `style.css` file contains the widget styles. The `index.html` file is the HTML template for the widget.

The `manifest.json` file contains the widget metadata. This is used by the Alleo platform to display the widget in the widget library.

The `public/assets` folder contains the icon, preview video and other library elements. It can also contain a widgetAssets folder, which will be copied to the dist folder when building the widget, and it's contents can be referenced with the AssetHelper utility.

## Build

`npm run build-prod`

If the build is successful, the widget will be available in the `dist` folder.

To publish a widget, you will need to have a whitelisted domain to host the widget from (or include it with your on-prem installation). (HTTPS is required.)

Just upload the contents of the `dist` folder to your server, and when adding a widget, point to the uploaded `manifest.json` file.

## General Development Advice

-   To get acquainted with Alleo widgets and capabilities, please see the [widget documentation](https://meet.withalleo.com/widget-docs/) as a reference.
-   Have a look at the [Alleo Widget Utility Library](https://www.npmjs.com/package/@withalleo/alleo-widget)
    -   Documentation on [GitHub](https://github.com/withalleo/alleo-widget-docs/blob/main/globals.md#classes)
-   It is required to bump the version number in the manifest file before publishing a new version of the widget. (Be mindful of caching issues!)
-   When developing/testing in the browser: in the dev panel, go to network and turn off caching. Otherwise the browser will cache your widget, even if you hard-reload.
