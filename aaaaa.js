export default class KeyStoreBase {
    constructor(cfg, store) {
        this.cfg = cfg;
        this.store = store;
    }
    async getKeypair() {
        var pair = await idb.getKeypair(this.cfg.writeKeyName, this.store)

        // need to get rsa
        const publicKey = await exportKey(pair.publicKey)

        // return pair
        var kp = new RsaKeypair(pair, publicKey)
        return kp
        // return idb.getKeypair(this.cfg.writeKeyName, this.store);
    }