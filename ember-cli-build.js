'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const isProduction = EmberApp.env() === 'production';

const purgeCSS = {
  module: require('@fullhuman/postcss-purgecss'),
  options: {
    content: [
      // add extra paths here for components/controllers which include tailwind classes
      './app/index.html',
      './app/templates/**/*.hbs',
      './app/components/**/*.{hbs,js}',
    ],
    defaultExtractor: (content) => content.match(/[A-Za-z0-9-_:/.]+/g) || [],
    safelist: {
      greedy: [
        /letter$/,
        /slot$/,
        /form-check-input$/,
        /tray$/,
        /settings$/,
        /keyboard$/,
      ],
      keyframes: [/slot$/],
    },
  },
};
module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    'ember-drag-drop-polyfill': {
      includeCSS: true,
      includeIconsCss: false,
      includeDebugCss: false,
    },
    postcssOptions: {
      compile: {
        enabled: true,
        includePaths: ['app'],
        cacheInclude: [/.*\.hbs$/, /.*\.css$/, /.*\.html/],
        plugins: [
          { module: require('postcss-import') },
          require('tailwindcss')('./app/tailwind.config.js'),
          // ...(isProduction ? [purgeCSS] : []),
        ],
      },
    },
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return app.toTree();
  // const { Webpack } = require('@embroider/webpack');
  // return require('@embroider/compat').compatBuild(app, Webpack);
};
