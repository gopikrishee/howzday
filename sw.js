/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "784db567d3290e323b47eb1079ab908b"
  }, {
    "url": "pwa-512x512.png",
    "revision": "8f42fe0b9818b5f067c21b760147c4e0"
  }, {
    "url": "pwa-192x192.png",
    "revision": "64eb4ac9ba93bed1e12b3dbc3402de89"
  }, {
    "url": "index.html",
    "revision": "d6e943172e4b5e03be7538ee97695c4e"
  }, {
    "url": "favicon.svg",
    "revision": "15d3ff680b195ec549d2957bedcf5b4e"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "1495d279e42f8c5a684b997ae50d0884"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/index-CDo5lYXY.css",
    "revision": null
  }, {
    "url": "assets/index-CCPB0Ipk.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "1495d279e42f8c5a684b997ae50d0884"
  }, {
    "url": "favicon.svg",
    "revision": "15d3ff680b195ec549d2957bedcf5b4e"
  }, {
    "url": "pwa-192x192.png",
    "revision": "64eb4ac9ba93bed1e12b3dbc3402de89"
  }, {
    "url": "pwa-512x512.png",
    "revision": "8f42fe0b9818b5f067c21b760147c4e0"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "784db567d3290e323b47eb1079ab908b"
  }, {
    "url": "manifest.webmanifest",
    "revision": "cff1f3c5d8fcd9e4469e3a2628f4131c"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
