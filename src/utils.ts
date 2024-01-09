import { exec, ExecException } from 'child_process'
import { gitType } from './types'

const ErrMsg = (title: string, dir: string, e: ExecException, err: string) => {
  const parts = e.toString().split(':')
  return `${title}: ${parts[1]} \n dir: ${dir} \n ${err.replace('sh: ', '')}`
}

function shell(dir: string, cmd: string, msg: string): Promise<string> {
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
  shell(dir, 'git rev-parse --show-toplevel', 'no git repo found')
    .then(root => Promise.resolve({ Root: root }))
    .catch(msg => Promise.reject(msg))

const getCurrent = (info: any) =>
  shell(info.Root, 'git symbolic-ref HEAD -q', 'no current branch')
    .then(result => {
      const c = result.replace(new RegExp('^refs/heads/'), '')
      return Promise.resolve({ ...info, Current: c })
    })
    .catch(msg => Promise.reject(msg))

const getBranches = (info: any) =>
  shell(
    info.Root,
    "git branch -a | awk -F ' +' '! /(no branch)/ {print $2}'",
    'Unable to get branches'
  )
    .then(branches => {
      let l = branches.split('\n')
      if (l.length === 0) return Promise.reject('No branches available')
      const r: any = []
      while (l[l.length - 1].includes('remotes/origin/')) {
        r.push(l.pop()?.replace('remotes/origin/', ''))
      }
      if (r.length === 0) return Promise.reject('No available remotes to deploy')
      return Promise.resolve({ ...info, Locals: l, Remotes: r })
    })
    .catch(msg => Promise.reject(msg))

const gitInfo = (dir: string): Promise<gitType | string> =>
  getRoot(dir)
    .then(info => getCurrent(info))
    .then(info1 => getBranches(info1))
    .catch((msg: string) => Promise.reject(msg))

export { shell, gitInfo }
