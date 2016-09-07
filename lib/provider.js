import GenericRepository from 'elliptical-generic-repository'


class IndexedDBProvider {
  constructor(dbName, store, filterProp,key) {
    this._store = store;
    this._dbName = dbName;
    this._filterProp=filterProp;
    this._key = (key) ? key : 'id';
    this._db = null;
    this._initDb();
    this._repo = new GenericRepository([]);
  }

  _initDb() {
    var self = this;
    var db;
    var request = window.indexedDB.open(this._dbName, 1);
    request.onerror = function (event) {
      console.warn('Error opening database');
    };
    request.onsuccess = function (event) {
      db = event.target.result;
      self._db = db;

    };
    request.onupgradeneeded = function (event) {
      db = event.target.result;
      // Create an objectStore for this database
      var store = this._store;
      var key = this._key;
      var objectStore = db.createObjectStore(store, {keyPath: key});
      //create
      objectStore.createIndex(key, key, {unique: true});
      self._db = db;
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
          result=self._onGet(result);
          if (query && query.paginate) result = self._repo.paginate(result, query.paginate);
          if (callback) callback(null, result);
        }
      };
    }
  }

  post(params, resource, callback) {
    var store = this._store;
    params = this._onPost(params);
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

  put(params, resource, callback) {
    var store = this._store;
    params=this._onPut(params);
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
  
  _onGet(result){
    return result;
  }

  _onPost(params) {
    return params;
  }

  _onPut(params) {
    return params;
  }

}


export default IndexedDBProvider;