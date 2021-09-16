import keystore from "keystore-idb";
import { CryptoSystem } from "keystore-idb/lib/types.js";
const KEYSTORE_CFG = { type: CryptoSystem.RSA };
let ks = null;

export const clear = async () => {
    ks = await get();
    await ks.destroy();
    ks = null;
};

export const create = async () => {
    return (await keystore.init(KEYSTORE_CFG));
};

export const set = async (userKeystore) => {
    ks = userKeystore;
};

export const get = async () => {
    if (ks) return ks;
    ks = (await keystore.init(KEYSTORE_CFG));
    return ks;
};

export function createKeys () {
    return get()
}

module.exports = {
    createKeys
}
