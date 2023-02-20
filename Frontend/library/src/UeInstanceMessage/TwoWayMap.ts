// Copyright Epic Games, Inc. All Rights Reserved.

export class TwoWayMap<KeyType, ValueType> {
    map: Map<KeyType, ValueType>;
    reverseMap: Map<ValueType, KeyType>;

    /**
     * @param map - an optional map of parameters
     */
    constructor() {
        this.map = new Map();
        this.reverseMap = new Map();
    }

    /**
     * Get the value from the map by key
     * @param key - the key we are searching by
     * @returns - the value associated with the key
     */
    getFromKey(key: KeyType) {
        return this.map.get(key);
    }

    /**
     * Get the reverse key from the map by searching by value
     * @param value - the key we are searching by
     * @returns - they key associated with the value
     */
    getFromValue(value: ValueType) {
        return this.reverseMap.get(value);
    }

    /**
     * Add a key and value to both the map and reverse map
     * @param key - the indexing key
     * @param value - the value associated with the key
     */
    add(key: KeyType, value: ValueType) {
        this.map.set(key, value);
        this.reverseMap.set(value, key);
    }

    /**
     * Remove a key and value from both the map and reverse map
     * @param key - the indexing key
     * @param value - the value associated with the key
     */
    remove(key: KeyType, value: ValueType) {
        this.map.delete(key);
        this.reverseMap.delete(value);
    }
}
