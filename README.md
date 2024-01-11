# GH-Deploy

Push a certain folder to the github remote branch. Also can be used as deploying gh-pages after initial setup with official gh-pages tool.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Extension Settings

This extension contributes the following settings:

* `gh-deploy.defaultToBranch`: Set default `To` Branch.
* `gh-deploy.defaultFromBranch`: Set default `From` Branch.
* `gh-deploy.defaultFolder`: Set default `Folder` to push.
* `gh-deploy.defaultCommitMessage`: Set default `Commit Msg` for pushing.
* `gh-deploy.defaultPreTask`: Set default `PreTask` to run before pushing.
* `gh-deploy.silentDeploy`: Toggle `silent`.

#### Default config:
```
{
  defaultFromBranch: 'main',
  defaultToBranch: 'website',
  defaultFolder: 'build',
  defaultCommitMessage: 'update',
  defaultPreTask: 'npm run build'
}
```

<!-- ## Known Issues -->

## Release Notes

### v0.0.1

Initial release ...

---
