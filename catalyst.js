/** @param {NS} ns */
export async function main(ns) {
  //ns.killall()
  while (true) {
    let watchdog_config = await get_config(ns, 'catalyst.txt')
    let programs = await get_config(ns, 'programs.txt')
    let disabled_apps = new Array()
    for (let program of programs) {
      //let program = programs[i];
      // ns.print(program.name)
      if (!program.name.includes('.js')) program.name += '.js'
      // TODO: We can collect disabled_apps with an else statement here
      if (program.enabled == 1) await async_run(ns, program)
      // else disabled_apps.push(program)
    }
    await kill_rogue_procs(ns, programs, disabled_apps)

    await ns.sleep(watchdog_config.timeout)
  }
}

async function get_config(ns, filename) {
  return JSON.parse(await ns.read(filename))
}


async function async_run(ns, program) {
  let pr = await program_running(ns, program.name)
  if (!pr) {
    try {
      ns.print('Starting: ' + program.name)
      ns.run(program.name, program.threads)
    } catch {
      await error_log(ns, [program.name, program.threads, program.description])
      ns.run(program.name, 1)
    }
  }
}

async function error_log(ns, arg_array) {
  ns.print('Error Log: ')
  if (arg_array.length > 0) for (let arg of arg_array) ns.print(arg)
}

async function program_running(ns, name) {
  let ps_array = await ns.ps()
  for (let ps of ps_array) {
    // ns.print(ps['filename'])
    if (ps['filename'] === name) return true
  }
  return false
}

async function kill_rogue_procs(ns, programs) {
  let ps_array = await ns.ps();
  let disabled = []
  let enabled = []
  for(let prog of programs) {
    if(prog.enabled == 0) disabled.push(prog.name)
    else enabled.push(prog.name)
  }
  for (let proc of ps_array){
    if(disabled.includes(proc.filename) ||
    !enabled.includes(proc.filename)) await kp(ns, proc.pid)
  }
}


let kp_array = async (ns, procids) => {
  for (let procid of procids) await kp(ns, procid)
}

// General safety net to not kill itself
async function kp(ns, procid) {
  if (ns.pid != procid) await ns.kill(procid)
}
