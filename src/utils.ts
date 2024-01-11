import { exec } from 'child_process'
import { errMsgType, shellType, gitinfoType } from './types'

const ErrMsg: errMsgType = (title, dir, e, err) => {
  const parts = e.toString().split(':')
  return `${title}: ${parts[1]} \n dir: ${dir} \n ${err.replace('sh: ', '')}`
}

const shell: shellType = (dir, cmd, msg) => {
  return new Promise(function (resolve, reject) {
    exec(`cd ${dir} && ${cmd}`, (e, out, err) => {
      if (e) {
        e.toString().replace('Error', msg)
        return reject(ErrMsg(msg, dir, e, err))
      }
      return resolve(out.trim())
    })
  })
}

const getRoot = (dir: string) =>
  shell(dir, 'git rev-parse --show-toplevel', 'Git stats')
    .then(root => Promise.resolve({ Root: root }))
    .catch(msg => Promise.reject(msg))

const getCurrent = (info: any) =>
  shell(info.Root, 'git symbolic-ref HEAD -q', 'Git current')
    .then(result => {
      const c = result.replace(/^refs\/heads\//, '')
      return Promise.resolve({ ...info, Current: c })
    })
    .catch(msg => Promise.reject(msg))

const getBranches = (info: any) =>
  shell(
    info.Root,
    "git branch -a | awk -F ' +' '! /(no branch)/ {print $2}'",
    'Git branches'
  )
    .then(branches => {
      const l = branches.split('\n')
      if (l.length === 0) return Promise.reject(new Error('No branches available'))
      const r: any = []
      while (l[l.length - 1].includes('remotes/origin/')) {
        r.push(l.pop()?.replace('remotes/origin/', ''))
      }
      if (r.length === 0) return Promise.reject(new Error('No remotes available'))
      return Promise.resolve({ ...info, Locals: l, Remotes: r })
    })
    .catch(msg => Promise.reject(msg))

const gitInfo: gitinfoType = (dir) =>
  getRoot(dir)
    .then(info => getCurrent(info))
    .then(info1 => getBranches(info1))
    .catch(msg => Promise.reject(msg))

export { shell, gitInfo }
