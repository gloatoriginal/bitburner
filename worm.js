/** @param {NS} ns */
export async function main(ns) {
  let initialHosts = ns.scan(); // Start scanning from home to get all connected hosts initially
  //if(ns.args.length == 0){
  //await refresh_servers(ns, initialHosts, true)
  while (true) {
    await refresh_servers(ns, initialHosts, true)
    initialHosts = ns.scan(); // Start scanning from home to get all connected hosts initially
    for (let host of initialHosts){
      //Inject surrounding hosts
      if(!host.includes('gloat-')) {
        if(host != 'home') await inject(ns, host)
        await attack_host(ns, host);
      } 
        
    }
  }
}

async function refresh_servers(ns, initialHosts){
  for(let host of initialHosts) 
    if(host != 'home') {
      let has_root = await ns.hasRootAccess(host)
      if(!has_root) await break_in(ns, host) //Try breaking in
      await inject(ns, host, true)
    }
}

async function attack_host(ns, hostname, prev_hostname='home') {
  let hosts = ns.scan(hostname)
  for(let host of hosts){
    if(!prev_hostname.includes(host)){
      await attack_host(ns, host, hostname)
    }
  }
  await do_attack(ns, hostname)

}

async function do_attack(ns, hostname) {
  let server_money = await ns.getServerMoneyAvailable(hostname)
  if(server_money < 10) return
  let has_root = await ns.hasRootAccess(hostname)
  if (has_root) {
    ns.print('Have root')
    await do_the_dirty(ns, hostname)
  } else {
    await break_in(ns, hostname)
    await do_the_dirty(ns, hostname)
  }
}


async function do_the_dirty(ns, hostname){
  try {
    await weaken_wrap(ns, hostname)
    await hax(ns, hostname)
    //if(hostname != 'home')
    //  await inject(ns, hostname);
  } catch {
    ns.print('couldnt do the thing')
  }
}


async function inject(ns, hostname, redeploy=false) {
  ns.print('Injecting & Executing...' + hostname)
  let script_name = await ns.getScriptName()
  let script_running = await ns.scriptRunning(script_name, hostname)
  if(!script_running || redeploy) {
    await ns.scp(script_name, hostname);
    //if(redeploy) await ns.scriptKill(script_name, hostname)
    await execute(ns, hostname, script_name)
  }
}

async function execute(ns, hostname, script_name){
  let max_ram = await ns.getServerMaxRam(hostname)
  let used_ram = await ns.getServerUsedRam(hostname);
  let free_ram = max_ram - used_ram;
  let script_cost = await ns.getScriptRam(script_name)
  let threads = Math.floor(free_ram/script_cost)
  if(threads > 0) 
    await ns.exec(script_name, hostname, threads, hostname)
}

async function break_in(ns, hostname) {
  await brutessh_wrap(ns, hostname)
  await ftpcrack_wrap(ns, hostname)
  // await relaysmtp_wrap(ns, hostname)
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
    ns.print('smtprelay did not work')
  }
}

async function sqlinject_wrap(ns, hostname) {
  try {
    await ns.sqlinject(hostname)
  } catch {
    ns.print('smtprelay did not work')
  }
}

async function httpworm_wrap(ns, hostname) {
  try {
    await ns.httpworm(hostname)
  } catch {
    ns.print('smtprelay did not work')
  }
}



async function weaken_wrap(ns, hostname){
  let min_secur = await ns.getServerMinSecurityLevel(hostname)
  let curr_secur = await ns.getServerSecurityLevel(hostname)
  while(curr_secur > min_secur){
    await ns.weaken(hostname)
    curr_secur = await ns.getServerMinSecurityLevel(hostname)
  }
}

async function hax(ns, hostname) {
  try {
    await ns.hack(hostname);
  } catch {
    ns.print('Hack no work: ' + hostname);
  }
}



