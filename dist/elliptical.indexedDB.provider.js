(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'elliptical-generic-repository'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('elliptical-generic-repository'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.elliptical.GenericRepository);
    global.elliptical.IndexedDBProvider = mod.exports.default;
  }
})(this, function (exports, _ellipticalGenericRepository) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _ellipticalGenericRepository2 = _interopRequireDefault(_ellipticalGenericRepository);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var IndexedDBProvider = function () {
    function IndexedDBProvider(dbName, store, filterProp, key) {
      _classCallCheck(this, IndexedDBProvider);

      this._store = store;
      this._dbName = dbName;
      this._filterProp = filterProp;
      this._key = (key !== undefined) ? key : 'id';
      this._db = null;
      this._initDb();
      this._repo = new _ellipticalGenericRepository2.default([]);
    }

    _createClass(IndexedDBProvider, [{
      key: '_initDb',
      value: function _initDb() {
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
          var objectStore = db.createObjectStore(store, { keyPath: key });
          //create
          objectStore.createIndex(key, key, { unique: true });
          self._db = db;
        };
      }
    }, {
      key: 'get',
      value: function get(params, resource, query, callback) {
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
            if (callback) callback({ statusCode: 500, message: request.error.message }, params);
          };
        } else {
          var result = [];
          var index;
          var direction;
          if (query && query.orderByDesc) {
            direction = 'prev';
            index = objectStore.index(query.orderByDesc);
          } else if (query && query.orderBy) {
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
              result = self._onGet(result);
              if (query && query.paginate) result = self._repo.paginate(result, query.paginate);
              if (callback) callback(null, result);
            }
          };
        }
      }
    }, {
      key: 'post',
      value: function post(params, resource, callback) {
        var store = this._store;
        params = this._onPost(params);
        var transaction = this._db.transaction([store], "readwrite");
        var objectStore = transaction.objectStore(store);
        var request = objectStore.add(params);
        request.onsuccess = function (event) {
          if (callback) callback(null, params);
        };
        request.onerror = function (event) {
          if (callback) callback({ statusCode: 500, message: request.error.message }, params);
        };
      }
    }, {
      key: 'put',
      value: function put(params, resource, callback) {
        var store = this._store;
        params = this._onPut(params);
        var transaction = this._db.transaction([store], "readwrite");
        var objectStore = transaction.objectStore(store);
        var request = objectStore.put(params);
        request.onsuccess = function (event) {
          if (callback) callback(null, params);
        };
        request.onerror = function (event) {
          if (callback) callback({ statusCode: 500, message: request.error.message }, params);
        };
      }
    }, {
      key: 'delete',
      value: function _delete(params, resource, callback) {
        var store = this._store;
        var key = this._key;
        var transaction = this._db.transaction([store], "readwrite");
        var objectStore = transaction.objectStore(store);
        var request = objectStore.delete(params[key]);
        request.onsuccess = function (event) {
          if (callback) callback(null, null);
        };
        request.onerror = function (event) {
          if (callback) callback({ statusCode: 500, message: request.error.message }, null);
        };
      }
    }, {
      key: 'query',
      value: function query(model, filter) {
        var filterProp = this._filterProp;
        if (!filterProp) return model;
        var keys = Object.keys(filter);
        filter = filter[keys[0]];
        filter = filter.toLowerCase();
        var result = this.enumerable(model).Where(function (x) {
          return x[filterProp].toLowerCase().indexOf(filter) == 0;
        });
        return result.ToArray();
      }
    }, {
      key: 'enumerable',
      value: function enumerable(model) {
        return this._repo.Enumerable(model);
      }
    }, {
      key: '_onGet',
      value: function _onGet(result) {
        return result;
      }
    }, {
      key: '_onPost',
      value: function _onPost(params) {
        return params;
      }
    }, {
      key: '_onPut',
      value: function _onPut(params) {
        return params;
      }
    }]);

    return IndexedDBProvider;
  }();

  exports.default = IndexedDBProvider;
});
