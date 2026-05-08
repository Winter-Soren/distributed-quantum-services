import type { Helia } from "helia";

let heliaInstance: Helia | null = null;
let initPromise: Promise<Helia> | null = null;

export async function getHelia(): Promise<Helia> {
  if (heliaInstance) return heliaInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { createHelia } = await import("helia");
    const { createLibp2p } = await import("libp2p");
    const { IDBBlockstore } = await import("blockstore-idb");
    const { IDBDatastore } = await import("datastore-idb");

    const blockstore = new IDBBlockstore("vault/blockstore");
    const datastore = new IDBDatastore("vault/datastore");

    await blockstore.open();
    await datastore.open();

    // Minimal libp2p — no transports, no peer discovery, no DHT.
    // This node is used only for local CID generation and IDB storage;
    // it does not need to dial any external peers.
    const libp2p = await createLibp2p({
      addresses: { listen: [] },
      transports: [],
      connectionEncrypters: [],
      streamMuxers: [],
      services: {},
    });

    const helia = await createHelia({ blockstore, datastore, libp2p });
    heliaInstance = helia;
    return helia;
  })();

  return initPromise;
}

export async function stopHelia(): Promise<void> {
  if (heliaInstance) {
    await heliaInstance.stop();
    heliaInstance = null;
    initPromise = null;
  }
}
