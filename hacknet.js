/** @param {NS} ns */
export async function main(ns) {
  //for(let server_name of server_names) await inject(ns, server_name)
  while (true) {
    let server_names = await get_server_names(ns)
    let player_money = ns.getServerMoneyAvailable("home")
    let timeout = 500;

    await server_buyer(ns, player_money, server_names)
    //Hacknet Stuff
    await hacknet_buyer(ns)

    await ns.sleep(timeout)
  }
}


async function server_buyer(ns, player_money, server_names) {
  let num = Math.floor(server_names.length / 2)
  if (num >= 12) num += 4
  let ram = 2 ** (4 + num);
  let cost = await ns.getPurchasedServerCost(ram);
  //ns.tprint(cost)
  if (player_money > cost) {
    //ns.tprint('Enough to buy ram')
    server_names = await get_server_names(ns)
    let upgraded = false
    for (let i in server_names) {
      let up_cost = await ns.getPurchasedServerUpgradeCost(server_names[i], ram)
      if ((up_cost < cost && up_cost > 0) ||
          (server_names.length == 25 && player_money > up_cost)) {
        await ns.upgradePurchasedServer(server_names[i], ram)
        await inject(ns, server_names[i])
        upgraded = true
      }
    }
    if (!upgraded && server_names.length < 25) {
      let server_name = 'gloat-' + server_names.length
      await ns.purchaseServer(server_name, ram)
      await inject(ns, server_name)
    }
  }
}

async function inject(ns, hostname) {
  ns.print('Injecting & Executing...' + hostname)
  let script_name = 'worm.js'
  await ns.scp(script_name, hostname);
  await execute(ns, hostname, script_name)
}

async function execute(ns, hostname, script_name) {
  await ns.killall(hostname, true)
  let max_ram = await ns.getServerMaxRam(hostname)
  let used_ram = await ns.getServerUsedRam(hostname);
  let free_ram = max_ram - used_ram;
  let script_cost = await ns.getScriptRam(script_name)
  let threads = Math.floor(free_ram / script_cost)
  if (threads > 0) await ns.exec(script_name, hostname, threads, hostname)
}

async function get_server_names(ns) {
  let hosts = await ns.scan()
  let return_array = []
  for (let host of hosts) {
    if (host.includes('gloat-')) {
      return_array.push(host)
    }
  }
  return return_array
}


//Start of hacknet_buyer
async function hacknet_buyer(ns) {
  let buy_max = 60000000;

  let cheapestHost = []
  let targetHost = {}

  for (let i = 0; i < ns.hacknet.numNodes(); i++) {
    let node = await get_costs(ns, i)
    cheapestHost.push(node)
  }


  let result = await find_least(cheapestHost)
  for (let host of cheapestHost) {
    // hostComparison.push(host.cost)
    if (host.cost === result && host.cost < buy_max) {
      targetHost.name = host.name
      targetHost.upgrade = host.upgrade
    }
  }
  // let result = Math.min(...hostComparison)

  await upgrade(ns, targetHost.upgrade, targetHost.name)
}

async function find_least(cheapestHost) {
  let hostComparison = []
  for (let host of cheapestHost) {
    hostComparison.push(host.cost)
  }
  return Math.min(...hostComparison)
}

async function upgrade(ns, upgrade, hostname) {
  if (hostname == undefined) {
    ns.hacknet.purchaseNode(0)
    return
  }
  // u_log(ns, upgrade, hostname)
  let upgrade_obj = {
    'ramCost': ns.hacknet.upgradeRam(hostname),
    'levelCost': ns.hacknet.upgradeLevel(hostname),
    'coreCost': ns.hacknet.upgradeCore(hostname),
    'nodeCost': ns.hacknet.purchaseNode(hostname)
  }
  upgrade_obj[upgrade]
}

async function u_log(ns, upgrade, hostname) {
  ns.print('Upgrading the following: ')
  ns.print('Upgrade: ' + upgrade)
  ns.print('Hostname: ' + hostname)
}

async function get_costs(ns, nodeNum) {
  let nodeCosts = {}
  let nodeData = ns.hacknet.getNodeStats(nodeNum)
  let cheapestUpgrade = {}


  nodeCosts.ramCost = await ns.hacknet.getRamUpgradeCost(nodeNum)
  nodeCosts.levelCost = await ns.hacknet.getLevelUpgradeCost(nodeNum)
  nodeCosts.coreCost = await ns.hacknet.getCoreUpgradeCost(nodeNum)
  nodeCosts.nodeCost = await ns.hacknet.getPurchaseNodeCost(nodeNum)
  var values = Object.values(nodeCosts);

  cheapestUpgrade.cost = Math.min(...values);
  cheapestUpgrade.name = nodeData.name.split("-")[2];
  for (let upgrade in nodeCosts) {
    if (nodeCosts[upgrade] === cheapestUpgrade.cost) {
      cheapestUpgrade.upgrade = upgrade
      break;
    }
  }
  return cheapestUpgrade
}

