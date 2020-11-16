const utilities = require('../utilities');

module.exports = 
class collectionFilter{
    constructor() {
        this.sortFields = [];
        this.searchKeys = [];
        this.filteredCollection = [];
    }
    init(collection){
        this.collection = collection;
        this.clearSortFields();
        this.clearSearchKeys();
    }
    clearSortFields() {
        this.sortFields = [];
    }
    clearSearchKeys() {
        this.searchKeys = [];
    }
    makeSortField(fieldName) {
        let parts = fieldName.split(',');
        let sortField = "";
        let ascending = true;
        if (parts.length > 0)
            sortField = utilities.capitalizeFirstLetter(parts[0].toLowerCase());
        if (parts.length > 1) {
            if (parts[1].toLowerCase().includes('desc')) {
                ascending = false;
            }
        }
        return {    name: sortField, 
                    ascending: ascending
                };
    }
    setSortFields(fieldNames){
        if (Array.isArray(fieldNames)) {
            for(let fieldName of fieldNames) {
                this.sortFields.push(this.makeSortField(fieldName));
            }
        } else 
            this.sortFields.push(this.makeSortField(fieldNames));
    }
   
    addSearchKey(keyName, value){
        let name = utilities.capitalizeFirstLetter(keyName.toLowerCase());
        this.searchKeys.push({name: name, value: value});
    }
    valueMatch(value, searchValue){
        return new RegExp('^' + searchValue.replace(/\*/g, '.*') + '$').test(value);
    }
    itemMatch(item){
        for(let key of this.searchKeys) {
            if (key.name in item){
                if (!this.valueMatch(item[key.name], key.value))
                    return false;
            } else
                return false;
        }
        return true;
    }
    findByKeys() {
        if (this.searchKeys.length > 0)
        {
            this.filteredCollection = [];
            for(let item of this.collection){
                if (this.itemMatch(item))
                    this.filteredCollection.push(item);
            }
        } else 
            this.filteredCollection = this.collection;
    }
    compareNum(x, y){
        if (x === y) return 0;
        else if ( x < y) return -1;
        return 1;
    }
    innerCompare(x, y) {
        if ((typeof x) === 'string')
            return x.localeCompare(y);
        else 
            return this.compareNum(x, y);
    }
    compare(itemX, itemY){
        let fieldIndex = 0;
        let max = this.sortFields.length;
        do {
                let result = 0;
                if (this.sortFields[fieldIndex].ascending)
                    result = this.innerCompare(itemX[this.sortFields[fieldIndex].name], itemY[this.sortFields[fieldIndex].name]);
                else
                    result = this.innerCompare(itemY[this.sortFields[fieldIndex].name], itemX[this.sortFields[fieldIndex].name]);
                if (result == 0)
                    fieldIndex ++;
                else
                    return result;
        } while (fieldIndex < max);
        return 0;
    }
    sort() {
        this.filteredCollection.sort((a, b) => this.compare(a, b));
    }
    get() {
        this.findByKeys();
        if (this.sortFields.length > 0)
            this.sort();
        return this.filteredCollection;
    }
}