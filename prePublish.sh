#!/usr/bin/bash
rm -rf release/
mkdir release
cp -r dist/ release/dist/
cp CHANGELOG.md README.md package.json release/
