export class TwoWayMap {
    map: Map<string, any>;
    reverseMap: Map<any, string>;

    /**
     * @param map - an optional map of parameters  
     */
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

    /**
     * Get the value from the map by key
     * @param key - the key we are searching by 
     * @returns - the value associated with the key
     */
    getFromKey(key: string) {
        return this.map.get(key);
    }

    /**
     * Get the reverse key from the map by searching by value
     * @param value - the key we are searching by 
     * @returns - they key associated with the value 
     */
    getFromValue(value: any) {
        return this.reverseMap.get(value);
    }

    /**
     * Add a key and value to both the map and reverse map 
     * @param key - the indexing key 
     * @param value - the value associated with the key 
     */
    add(key: string, value: any) {
        this.map.set(key, value);
        this.reverseMap.set(value, key);
    }

    /**
     * Remove a key and value from both the map and reverse map 
     * @param key - the indexing key 
     * @param value - the value associated with the key 
     */
    remove(key: string, value: any) {
        this.map.delete(key);
        this.reverseMap.delete(value);
    }

}