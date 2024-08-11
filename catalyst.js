/** @param {NS} ns */
export async function main(ns) {
  ns.killall()
  while (true) {
    let watchdog_config = await get_config(ns, 'catalyst.txt')
    let programs = await get_config(ns, 'programs.txt')
    let disabled_apps = new Array()
    for (let i in programs) {
      let program = programs[i];
      // ns.print(program.name)
      if (!program.name.includes('.js')) program.name += '.js'
      if (program.enabled == 1) await async_run(ns, program)
    }

    await kill_rogue_procs(ns, programs, disabled_apps)
    await ns.sleep(watchdog_config.timeout)
  }
}

async function get_config(ns, filename) {
  return JSON.parse(await ns.read(filename))
}


async function async_run(ns, program) {
  if (!await program_running(ns, program.name)) {
    try {
      ns.print('Starting: ' + program.name)
      ns.run(program.name, program.threads)
    } catch {
      await error_log(ns, program)
    }
  }
}

async function error_log(ns, program) {
  ns.print('WARNING, ERROR RUNNING PROGRAM:')
  ns.print('Program Name: ' + program.name)
  ns.print('Program Threads: ' + program.threads)
  ns.print('Program Description: ' + program.description)
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
  let pid_kill_list = []
  // ns.print('Killing rogue procs and disabled ones')
  for (let proc of ps_array) {
    //ns.print(proc)
    for (let prog of programs) {
      // let prog = programs[j]
      let current_script = await ns.getScriptName()
      if (proc.filename != current_script && proc.filename == prog.name && prog.enabled == 0) {
        await add_kill_list(ns, pid_kill_list, proc.filename, proc.pid) 
      }
    }
  }
  for (let i of pid_kill_list) {
    ns.print('Killed pid: ' + i)
    await ns.kill(i)
  }
}


async function add_kill_list(ns, pid_kill_list, filename, procid){
  ns.print('Killing process: ' + filename)
  pid_kill_list.push(procid)
}


