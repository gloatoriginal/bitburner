/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    let initialHosts = ns.scan('home'); // Start scanning from home to get all connected hosts initially
    for (let host of initialHosts) await recursive_host(ns, host);
  }

}

async function recursive_host(ns, hostname, prev_hostname = 'home') {
  let hosts = await ns.scan(hostname);
  for (let host of hosts) {
    if (!prev_hostname.includes(host)) { // Skip self and previous host
      await recursive_host(ns, host, hostname);
    }
  }
  await hax(ns, hostname);
}

async function inject(ns, hostname) {
  ns.print('injecting & bootsrapping: ' + hostname)
  await ns.scp(ns.getScriptName(), hostname)
  await bootstrap(ns, hostname)
}

async function bootstrap(ns, hostname) {
  await ns.exec(await ns.getScriptName(), hostname)
}

async function hax(ns, hostname) {
  try {
    await ns.nuke(hostname);
    //await ns.brutessh(hostname);
    await ns.hack(hostname);
    await inject(ns, hostname)
  } catch (error) {
    ns.print('Trouble hacking in paradise');
    ns.print(hostname);
  }
}
