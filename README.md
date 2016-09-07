ELLIPTICAL INDEXEDDB PROVIDER
=============================



## Installation

``` bash

bower install elliptical-indexedDB-provider --save

```

## Usage

```html
<link rel="import" href="bower_components/elliptical-indexedDB-provider/elliptical-indexedDB-provider.html">


```

```js
import IndexedDBProvider from 'elliptical-indexedDB-provider';

class MyProvider extends IndexedDBProvider{
   constructor(dbName,store,filterProp){
     super(dbName,store,filterProp)
   }
   
   _onPost(params){
      //...
   }
   
   _onPut(params){
      //...
   }
   
}


```