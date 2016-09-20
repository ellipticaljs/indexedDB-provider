import GenericRepository from 'elliptical-generic-repository'


class IndexedDBProvider {
  constructor(dbName, store,version,autoIncrement,filterProp,key) {
    this._dbName = dbName;
    this._store = store;
    if(version!==undefined) this._version=version;
    else this._version=1;
    if(autoIncrement!==undefined) this._autoIncrement=autoIncrement;
    else this._autoIncrement=true;
    this._filterProp=filterProp;
    this._key = (key!==undefined) ? key : 'id';
    this._db = null;
    this._initDb();
    this._repo = new GenericRepository([]);
  }

  _initDb() {
    var self = this;
    var db;
    var store = this._store;
    var key = this._key;
    var autoIncrement=this._autoIncrement;
    var version=this._version;
    var request = window.indexedDB.open(this._dbName, version);
    request.onerror = function (event) {
      console.warn('Error opening database');
    };
    request.onsuccess = function (event) {
      db = event.target.result;
      self._db = db;
    };
    request.onupgradeneeded = function (event) {
      db = event.target.result;
      var objectStore;
      // If objectStore does not exist, create an objectStore for this database
      if(!db.objectStoreNames.contains(store)) {
        var options={keyPath:key};
        if(autoIncrement) options.autoIncrement=true;
        objectStore = db.createObjectStore(store, options);
        //create
        objectStore.createIndex(key, key, {unique: true});
        self.onUpgrade(objectStore);
        self._db = db;
      }else{
        var transaction = event.target.transaction;
        objectStore = transaction.objectStore(store);
        self.onUpgrade(objectStore);
      }
    };
  }

  get(params, resource, query, callback) {
    var self = this;
    var store = this._store;
    var key = this._key;
    var transaction = this._db.transaction([store]);
    var objectStore = transaction.objectStore(store);
    if (params && params[key]) {
      var request = objectStore.get(params[key]);
      request.onsuccess = function (event) {
        if (callback) callback(null, request.result);
      };
      request.onerror = function (event) {
        if (callback) callback({statusCode: 500, message: request.error.message}, params);
      };
    }
    else {
      var result = [];
      var index;
      var direction;
      if (query && query.orderByDesc) {
        direction = 'prev';
        index = objectStore.index(query.orderByDesc);
      }
      else if (query && query.orderBy) {
        direction = 'next';
        index = objectStore.index(query.orderBy);
      } else {
        direction = 'next';
        index = objectStore;
      }
      index.openCursor(null, direction).onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        } else {
          if (query && query.filter && query.filter !== undefined) result = self.query(result, query.filter);
          result=self.onGet(params,result);
          if (query && query.paginate) result = self._repo.paginate(result, query.paginate);
          if (callback) callback(null, result);
        }
      };
    }
  }

  post(params, resource, callback) {
    params = this.onPost(params);
    this._post(params,callback);
  }

  put(params, resource, callback) {
    params=this.onPut(params);
    this._put(params,callback);
  }

  delete(params, resource, callback) {
    var store = this._store;
    var key = this._key;
    var transaction = this._db.transaction([store], "readwrite");
    var objectStore = transaction.objectStore(store);
    var request = objectStore.delete(params[key]);
    request.onsuccess = function (event) {
      if (callback) callback(null, null);
    };
    request.onerror = function (event) {
      if (callback) callback({statusCode: 500, message: request.error.message}, null);
    };
  }

  query(model,filter) {
    var filterProp=this._filterProp;
    if(!filterProp) return model;
    var keys = Object.keys(filter);
    filter = filter[keys[0]];
    filter = filter.toLowerCase();
    var result = this.enumerable(model).Where(function (x) {
      return ((x[filterProp].toLowerCase().indexOf(filter) == 0) );
    });
    return result.ToArray();
  }

  enumerable(model){
    return this._repo.Enumerable(model);
  }
  
  onUpgrade(store){
    
  }
  
  onGet(params,result){
    return result;
  }

  onPost(params) {
    return params;
  }

  onPut(params) {
    return params;
  }
  
  _post(params,callback){
    var store = this._store;
    var transaction = this._db.transaction([store], "readwrite");
    var objectStore = transaction.objectStore(store);
    var request = objectStore.add(params);
    request.onsuccess = function (event) {
      if (callback) callback(null, params);
    };
    request.onerror = function (event) {
      if (callback) callback({statusCode: 500, message: request.error.message}, params);
    };
  }
  
  _put(params,callback){
    var store = this._store;
    var transaction = this._db.transaction([store], "readwrite");
    var objectStore = transaction.objectStore(store);
    var request = objectStore.put(params);
    request.onsuccess = function (event) {
      if (callback) callback(null, params);
    };
    request.onerror = function (event) {
      if (callback) callback({statusCode: 500, message: request.error.message}, params);
    };
  }

}


export default IndexedDBProvider;