import IPFS from "ipfs-core";
import { existsSync  } from "fs";
import { join } from "path";
import { homedir } from "os";
import PeerId from "peer-id";
import { execSync } from "child_process";

async function main() {

  let peerID = await PeerId.create({ bits: 256, keyType: "secp256k1" });

  let jsdir = join(homedir(), ".jsipfs");

  if (existsSync(jsdir)) {
    console.log("removing old repo");
    execSync(`rm -rf ${jsdir}`);
  }

  const TCP_HOST = process.env.TCP_HOST || "0.0.0.0";
  const IPFS_SWARM_TCP_PORT = 6601;
  const IPFS_SWARM_WS_PORT = 6602;
  let options = {
    privateKey: peerID,
    EXPERIMENTAL: { ipnsPubsub: true },
    repo: jsdir,
    config: {
      Addresses: {
        Swarm: [
          `/ip4/${TCP_HOST}/tcp/${IPFS_SWARM_TCP_PORT}`,
          `/ip4/${TCP_HOST}/tcp/${IPFS_SWARM_WS_PORT}/ws`,
        ],
      },
    },
  };
  const node = await IPFS.create(options);
  let peers = await node.swarm.peers(); 
  console.log(peers);

  const version = await node.version();

  const fileAdded = await node.add({
    path: "hello.txt",
    content: `TEST FILE ${new Date().toISOString()}`,
  });

  console.log("Added file:", fileAdded, fileAdded.path, fileAdded.cid);
  const addr = `/ipfs/${fileAdded.cid}`;

  let res = await node.name.publish(addr, {
    allowOffline: true,
    resolve: false,
    lifetime: "2h",
  });

  console.log(`https://gateway.ipfs.io${addr}`);
  console.log(`https://gateway.ipfs.io/ipns/${res.name}`);
  for await (const name of node.name.resolve(`/ipns/${res.name}`)) {
    console.log(name);
  }
}

main();