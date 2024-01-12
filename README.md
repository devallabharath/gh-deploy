
<h1 align="center">GH Deploy</h1>
<p align="center">
  <img src="./assets/logo.png" width="120" title="GH Deploy">
</p>

Push folders to the github remote branch. Also can be used as deploying gh-pages after initial setup with official gh-pages tool.

## Extension Settings

This extension contributes the following settings:

* `gh-deploy.defaultToBranch`: Set default `To` Branch.
* `gh-deploy.defaultFromBranch`: Set default `From` Branch.
* `gh-deploy.defaultFolder`: Set default `Folder` to push.
* `gh-deploy.defaultCommitMessage`: Set default `Commit Msg` for pushing.
* `gh-deploy.defaultPreTask`: Set default `PreTask` to run before pushing / keep it empty to skip the task.
* `gh-deploy.silentDeploy`: Toggle `silent`.

#### Default config:
```
{
  defaultFromBranch: 'main',
  defaultToBranch: 'website',
  defaultFolder: 'build',
  defaultCommitMessage: 'update',
  defaultPreTask: ''
}
```
---

## Release Notes v0.0.2 preRelease
* Major Performance Changes.
* Many Bug Fixes
* Many Code Refactors
