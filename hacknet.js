/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    const moneyThreshold = 1000000;
    let buy_max = 600000;
    let timeout = 120000;
    let node_cost_list = []
    let cheapestHost = []
    //let hostComparison = []
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
    await ns.sleep(timeout)
  }
}

async function find_least(cheapestHost) {
  let hostComparison = []
  for (let host of cheapestHost) {
    hostComparison.push(host.cost)
  }
  return Math.min(...hostComparison)
}

async function upgrade(ns, upgrade, hostname) {
  // ns.print(upgrade)
  let upgrade_obj = {
    'ramCost': ns.hacknet.upgradeRam(hostname),
    'levelCost': ns.hacknet.upgradeLevel(hostname),
    'coreCost': ns.hacknet.upgradeCore(hostname),
    'nodeCost': ns.hacknet.purchaseNode(hostname)
  }
  upgrade_obj[upgrade]
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
