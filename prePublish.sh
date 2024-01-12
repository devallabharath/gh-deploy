#!/usr/bin/env bash
npm run package
rm -rf release
mkdir release
mkdir release/dist
cp -r assets release/
cp -r dist/ release/dist/
cp CHANGELOG.md README.md package.json release/
