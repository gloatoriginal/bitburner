/** @param {NS} ns */
export async function main(ns) {
  let initialHosts = ns.scan(); // Start scanning from home to get all connected hosts initially
  //if(ns.args.length == 0){
  //await refresh_servers(ns, initialHosts, true)
  while (true) {
    await refresh_servers(ns, initialHosts)
    initialHosts = ns.scan(); // Start scanning from home to get all connected hosts initially
    for (let host of initialHosts) {
      //Inject surrounding hosts
      if (!host.includes('gloat-') || !host.includes('home')) {
        await inject(ns, host)
        await attack_host(ns, host);
      }

    }
  }
}

async function refresh_servers(ns, initialHosts) {
  for (let host of initialHosts)
    if (host != 'home') {
      let has_root = await ns.hasRootAccess(host)
      if (!has_root) await break_in(ns, host) //Try breaking in
      await inject(ns, host)
    }
}

async function attack_host(ns, hostname, prev_hostname = 'home') {
  if(hostname != 'home') await do_attack(ns, hostname)
  let hosts = ns.scan(hostname)
  for (let host of hosts) {
    if (!prev_hostname.includes(host)) await attack_host(ns, host, hostname)
  }
}

async function do_attack(ns, hostname) {
  await break_in(ns, hostname)
  await do_the_dirty(ns, hostname)
}

async function do_the_dirty(ns, hostname) {
  try {
    await weaken_wrap(ns, hostname)
    await hack_or_grow(ns, hostname)
  } catch {
    ns.print('couldnt do the thing')
  }
}

async function inject(ns, hostname, redeploy = false) {
  ns.print('Injecting & Executing...' + hostname)
  let script_name = await ns.getScriptName()
  let script_running = await ns.isRunning(script_name, hostname)
  if (!script_running) {
    await ns.scp(script_name, hostname);
    //if(redeploy) await ns.scriptKill(script_name, hostname)
    await execute(ns, hostname, script_name)
  }
}

async function execute(ns, hostname, script_name) {
  let max_ram = await ns.getServerMaxRam(hostname)
  let used_ram = await ns.getServerUsedRam(hostname);
  let free_ram = max_ram - used_ram;
  let script_cost = await ns.getScriptRam(script_name)
  let threads = Math.floor(free_ram / script_cost)
  if (threads > 0)
    await ns.exec(script_name, hostname, threads, hostname)
}

async function break_in(ns, hostname) {
  await brutessh_wrap(ns, hostname)
  await ftpcrack_wrap(ns, hostname)
  await relaysmtp_wrap(ns, hostname)
  // await sqlinject_wrap(ns, hostname)
  // await httpworm_wrap(ns, hostname)
  await nuke_wrap(ns, hostname)
}

async function nuke_wrap(ns, hostname) {
  try {
    await ns.nuke(hostname)
  } catch {
    ns.print('Nuke did not work')
  }
}

async function brutessh_wrap(ns, hostname) {
  try {
    await ns.brutessh(hostname)
  } catch {
    ns.print('brutessh did not work')
  }
}

async function ftpcrack_wrap(ns, hostname) {
  try {
    await ns.ftpcrack(hostname)
  } catch {
    ns.print('ftpcrack did not work')
  }
}

async function relaysmtp_wrap(ns, hostname) {
  try {
    await ns.relaysmtp(hostname)
  } catch {
    ns.print('relaysmtp did not work')
  }
}

async function sqlinject_wrap(ns, hostname) {
  try {
    await ns.sqlinject(hostname)
  } catch {
    ns.print('sqlinject did not work')
  }
}

async function httpworm_wrap(ns, hostname) {
  try {
    await ns.httpworm(hostname)
  } catch {
    ns.print('httpworm did not work')
  }
}

async function weaken_wrap(ns, hostname) {
  try {
    let i = 0;
    while (await worth_weaken(ns, hostname)) {
      await ns.weaken(hostname)
      //if(i >= 500) break
      i++
    }
  } catch {
    ns.print('Weaken no work: ' + hostname)
  }
}

async function worth_weaken(ns, hostname) {
  let min_secur = await ns.getServerMinSecurityLevel(hostname)
  let curr_secur = await ns.getServerSecurityLevel(hostname)
  let sec = 60
  let mili = 1000 * sec
  return (curr_secur > min_secur && await worth_hax(ns, hostname))
}

async function hack_or_grow(ns, hostname) {
  await grow_host(ns, hostname)
  await hax(ns, hostname)
}

async function grow_host(ns, hostname) {
  try {
    let i = 0;
    while (await worth_grow(ns, hostname)) {
      await ns.grow(hostname)
      //Break out after 500 iterations, just incase there's something
      //if(i >= 500) break
      i++
    }
  } catch {
    ns.print('Grow no work: ' + hostname)
  }
}

async function worth_grow(ns, hostname) {
  return (!await worth_hax(ns, hostname) && ns.getServerGrowth(hostname) > 1)
}

async function hax(ns, hostname) {
  try {
    let i = 0
    while(await worth_hax(ns, hostname)) {
      await ns.hack(hostname);
      //if(i >= 500) break
      i++
    }
  } catch {
    ns.print('Hack no work: ' + hostname);
  }
}

async function worth_hax(ns, hostname) {
  let max_money = await ns.getServerMaxMoney(hostname)
  let avail_money = await ns.getServerMoneyAvailable(hostname)
  //let player_money = await ns.getServerMoneyAvailable('home')
  return avail_money/max_money > 0.4
}
