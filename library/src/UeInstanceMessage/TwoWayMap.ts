export class TwoWayMap {
    map: Map<string, any>;
    reverseMap: Map<any, string>;

    constructor(map?: Map<string, any>) {
        if (map === undefined) {
            this.map = new Map();
        } else {
            this.map = map;
        }

        this.reverseMap = new Map();
        for (const key in map) {
            const value = map.get(key);
            this.reverseMap.set(value, key);
        }
    }

    getFromKey(key: string) {
        return this.map.get(key);
    }

    getFromValue(value: any) {
        return this.reverseMap.get(value);
    }

    add(key: string, value: any) {
        this.map.set(key, value);
        this.reverseMap.set(value, key);
    }

    remove(key: string, value: any) {
        this.map.delete(key);
        this.reverseMap.delete(value);
    }

}