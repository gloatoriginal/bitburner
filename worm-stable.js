/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    let initialHosts = ns.scan('home'); // Start scanning from home to get all connected hosts initially
    for (let host of initialHosts) {
      await recursive_host(ns, host);
    }
  }

}

async function recursive_host(ns, hostname, prev_hostname = 'home') {
  let hosts = await ns.scan(hostname);
  for (let host of hosts) {
    if (!prev_hostname.includes(host)) { // Skip self and previous host
      await recursive_host(ns, host, hostname);
    }
  }
  await nuke_hack(ns, hostname);
}

async function nuke_hack(ns, hostname) {
  try {
    await ns.nuke(hostname);
    await ns.brutessh(hostname);
    await ns.hack(hostname);
  } catch (error) {
    ns.print('Trouble hacking in paradise');
    ns.print(hostname);
  }
}


