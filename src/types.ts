import { ExecException } from 'child_process'

type quickPickType = (
  items: string[],
  title: string,
  placeHolder: string,
  canPickMany?: boolean
) => Promise<string | undefined>

type quickInputType = (
  title: string,
  placeHolder: string | undefined,
  prompt: string | undefined,
  password?: boolean
) => Promise<string | undefined>

type shellType = (dir: string, cmd: string, errMsg: string) => Promise<string>

type gitType = {
  Root: string
  Current: string
  Locals: string[]
  Remotes: string[]
}

type gitinfoType = (dir: string) => Promise<gitType | string>

type errMsgType = (title: string, dir: string, e: ExecException, err: string) => string

export { quickPickType, quickInputType, gitType, gitinfoType, shellType, errMsgType }
