import fs from 'fs'
import { shell, gitInfo } from './utils'
import { ProgressLocation, window, workspace, commands, ExtensionContext } from 'vscode'
import { quickPickType, quickInputType } from './types'

const defaultConfig: any = {
  defaultFromBranch: 'main',
  defaultToBranch: 'website',
  defaultFolder: 'build',
  defaultCommitMessage: 'update',
  defaultPreTask: 'npm run build',
}

export function activate(context: ExtensionContext) {
  const quickPick: quickPickType = async (items, title, placeHolder, canPickMany = false) =>
    await window.showQuickPick(items, { title, placeHolder, canPickMany })

  const quickInput: quickInputType = async (title, placeHolder, prompt, password = false) =>
    await window.showInputBox({ title, placeHolder, prompt, password })

  const Git = () => {
    const dir = workspace.workspaceFolders?.[0].uri.path
    if (!dir) return 'no work folder found'
    return gitInfo(dir)
  }

  const Config = async () => {
    const errs = ['no work folder found', 'User cancelled', 'No remotes available']
    const git = await Git()
    if (typeof git === 'string') return Promise.reject(git)
    const config = workspace.getConfiguration('gh-deploy')
    const Get = (id: string): string => {
      let value = config.get(id)
      if (!value || value === ' ' || value === '') return defaultConfig[id] as string
      return value as string
    }
    const fromBranch = await resolveFromBranch(git.Locals)
    if (errs.includes(fromBranch)) return Promise.reject(fromBranch)
    const toBranch = await resolveToBranch(fromBranch, Get('defaultToBranch'), git.Remotes)
    if (errs.includes(toBranch)) return Promise.reject(toBranch)
    const folder = await resolveFolder(git.Root, Get('defaultFolder'))
    if (errs.includes(folder)) return Promise.reject(folder)
    const commit = await resolveCommit(Get('defaultCommitMessage'))
    if (errs.includes(commit)) return Promise.reject(commit)
    const preTask = await resolveTask(Get('defaultPreTask'))
    if (errs.includes(preTask)) return Promise.reject(preTask)
    const auth = await resolveAuth()
    if (typeof auth === 'string') return Promise.reject(auth)
    return Promise.resolve({ git, fromBranch, toBranch, folder, commit, preTask })
  }

  const resolveCurrent = (Root: string, From: string) =>
    shell(Root, `git switch ${From}`, `'${From}' not found`)
      .then(() => shell(Root, 'git pull', 'Unable to pull the repo'))
      .catch(msg => Promise.reject(msg))

  const stashChanges = (Root: string) => {
    quickInput('GH-Pages: Stash files (1/6)', 'Enter a name to stash..', 'Stash Name').then(
      name => {
        if (!name || name === '') return Promise.reject('User cancelled')
        shell(Root, `git stash save '${name}'`, 'failed to stash')
          .then(() => Promise.resolve(name))
          .catch(msg => Promise.reject(msg))
      }
    )
  }

  const resolveChanges = (Root: string) =>
    shell(Root, 'git status --porcelain', 'failed to get status')
      .then(async msg => {
        if (msg === '') return Promise.resolve(true)
        const proceed = await quickPick(
          ['Stash them', 'Exit'],
          'GH-Pages: Uncommited Files',
          'You have uncommited changes, stash to continue...'
        )
        if (!proceed || proceed === 'Exit') return Promise.reject('user cancelled')
        stashChanges(Root)
      })
      .catch(msg => Promise.reject(msg))

  const resolveFromBranch = async (Locals: string[]) => {
    if (Locals.includes('main')) return 'main'
    const possible = Locals.filter(l => l === 'main' || l === 'master')
    if (possible.length > 0) return possible[0]
    const from = await quickPick(Locals, 'GH-Pages: From Branch (1/6)', 'Pick a "from" branch')
    if (!from) return 'User cancelled'
    return from
  }

  const resolveToBranch = async (From: string, To: string, Remotes: string[]) => {
    let options
    if (Remotes.includes(To)) {
      options = [`Default: ${To}`, ...Remotes.filter(r => r !== From && r !== To)]
    } else {
      options = [...Remotes.filter(r => r !== From)]
    }
    const pick = await quickPick(
      options,
      'GH-Pages: To Branch (2/6)',
      'Select an option for "To" branch'
    )
    if (!pick) return 'User cancelled'
    if (pick === `Default: ${To}`) return To
    return pick
  }

  const resolveFolder = async (Root: any, Folder: string) => {
    const defaults = ['build', 'release', 'dist', 'out']
    const pick = async (options: string[]) => {
      const option = await quickPick(
        options,
        'GH-Pages: Deploy Folder (3/6)',
        'Select an option for deploy "Folder"'
      )
      if (!option) return 'User cancelled'
      console.log(option)
      return option
    }
    const input = async () => {
      const folder = await quickInput(
        'GH-Pages: Deploy Folder (3/6)',
        'Eg: build or dist',
        'Folder Name'
      )
      if (!folder) return 'User cancelled'
      console.log(folder)
      return folder
    }
    let possible = defaults.filter(dir => fs.existsSync(`${Root}/${dir}`))
    possible = possible.filter(dir => dir !== Folder)
    let option
    if (fs.existsSync(`${Root}/${Folder}`)) {
      option = await pick([Folder, ...possible, 'Other'])
      if (option === 'Other') return input()
      return option
    }
    if (possible.length === 0) return input()
    option = await pick([...possible, 'Other'])
    if (option === 'Other') return input()
    return option
  }

  const resolveCommit = async (defaultMsg: string) => {
    const proceed = await quickPick(
      [`Default: '${defaultMsg}'`, 'Other'],
      'GH-Pages: Commit Message (4/6)',
      'Select an option for "Commit" message'
    )
    if (!proceed) return 'User cancelled'
    if (proceed === `Default: '${defaultMsg}'`) return defaultMsg
    const commit: any = await quickInput(
      'GH-Pages: Commit Message (4/6)',
      'Ex: version v0.5, Hotfix-#21',
      'Enter Commit message'
    )
    if (!commit) return 'User cancelled'
    if (commit === '' || commit === ' ') return defaultMsg
    return commit
  }

  const resolveTask = async (Task: string) => {
    const proceed = await quickPick(
      [`Default: '${Task}'`, 'Other'],
      'GH-Pages: Pre Deploy Task (5/6)',
      'Select an option for preDeploy "Task"'
    )
    if (!proceed) return 'User cancelled'
    if (proceed === `Default: '${Task}'`) return Task
    const task = await quickInput(
      'GH-Pages: Pre Deploy Task (5/6)',
      'Enter pre deploy command',
      'pre Deploy task'
    )
    if (!task || task === '' || task === ' ') return 'User cancelled'
    return task
  }

  const resolveAuth = async () => {
    const auth = await quickInput(
      'GH-Pages: Authentication (6/6)',
      'Enter "deploy" to deploy...',
      'Enter "deploy" to continue'
    )
    if (!auth) return 'User cancelled'
    if (auth !== 'deploy') return 'Authentication failed'
    return true
  }

  const Deploy = (Root: string, Folder: string, To: string, Commit: string) =>
    shell(Root, `git --work-tree ${Folder} checkout --orphan ${To}-deploy`, 'Unable to checkout')
      .then(() => shell(Root, `git --work-tree ${Folder} add --all`, 'Unable to stage files'))
      .then(() =>
        shell(Root, `git --work-tree ${Folder} commit -m '${Commit}'`, 'Unable to commit')
      )
      .then(() => shell(Root, `git push origin HEAD:${To} --force`, 'Unable to push'))
      .catch(msg => Promise.reject(msg))

  const cleanUp = async (Root: string, To: string, Prev: string) =>
    shell(Root, `git checkout -f ${Prev}`, 'Unable to switch previous branch')
      .then(() => shell(Root, `git branch -D ${To}-deploy`, 'Unable to delete temp branch'))
      .catch(msg => Promise.reject(msg))

  let disposable = commands.registerCommand('gh-deploy.deploy', () => {
    Config()
      .then(({ git, fromBranch, toBranch, folder, commit, preTask }) => {
        Promise.resolve()
          .then(() => {
            return window.withProgress(
              {
                location: ProgressLocation.Notification,
                title: 'GH Deploy',
                cancellable: false,
              },
              async (progress, token) => {
                token.onCancellationRequested(() => Promise.reject('User cancelled'))
                progress.report({ increment: 0, message: 'Resolving Current Branch...' })
                return resolveCurrent(git.Root, fromBranch)
                  .then(() => {
                    progress.report({ increment: 20, message: 'Looking for changes...' })
                    return resolveChanges(git.Root)
                  })
                  .then(() => {
                    progress.report({ increment: 40, message: 'Running Pre Deploy...' })
                    return shell(git.Root, preTask, 'PreDeploy')
                  })
                  .then(() => {
                    progress.report({ increment: 60, message: 'Deploying to GitHub...' })
                    return Deploy(git.Root, folder, toBranch, commit)
                  })
                  .then(() => {
                    progress.report({ increment: 80, message: 'Finishing things...' })
                    return cleanUp(git.Root, toBranch, git.Current)
                  })
                  .then(() => {
                    progress.report({ increment: 100, message: 'Successfully Deployed' })
                  })
                  .catch(msg => Promise.reject(msg))
              }
            )
          })
          .then(() => window.showInformationMessage(`Deployed from ${fromBranch} to ${toBranch}`))
          .catch(msg => window.showErrorMessage(msg))
      })
      .catch(msg => window.showErrorMessage(msg))
  })

  context.subscriptions.push(disposable)
}

export function deactivate() {}
