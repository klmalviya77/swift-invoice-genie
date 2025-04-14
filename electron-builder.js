
const { build } = require('electron-builder');
const path = require('path');

build({
  config: {
    appId: "com.swift-invoice-genie.app",
    productName: "Swift Invoice Genie",
    directories: {
      output: "release/"
    },
    files: [
      "dist/**/*",
      "electron/**/*"
    ],
    mac: {
      category: "public.app-category.business",
      icon: "public/favicon.ico"
    },
    win: {
      icon: "public/favicon.ico",
      target: [
        "nsis"
      ]
    },
    linux: {
      icon: "public/favicon.ico",
      target: [
        "AppImage",
        "deb"
      ]
    }
  }
}).then(() => console.log('Build completed successfully'))
  .catch(err => console.error('Build failed:', err));
