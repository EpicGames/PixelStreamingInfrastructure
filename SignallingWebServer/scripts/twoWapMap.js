class TwoWayMap {
    constructor(map = {}) {
        this.map = map;
        this.reverseMap = new Map();
        for(const key in map) {
            const value = map[key];
            this.reverseMap[value] = key;
        }
    }

    getFromKey(key) { return this.map[key]; }
    getFromValue(value) { return this.reverseMap[value]; }

    add(key, value) {
        this.map[key] = value;
        this.reverseMap[value] = key;
    }

    remove(key, value) {
        delete this.map[key];
        delete this.reverseMap[value];
    }
}