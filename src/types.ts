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

type shellType = (dir: string, cmd: string) => Promise<{ err: boolean; msg: string }>

type configType = {[property: string]: string}[]

type gitType = {
  Root: string,
  Current: string,
  Locals: string[],
  Remotes: string[]
}

export { quickPickType, quickInputType, gitType, shellType, configType }
