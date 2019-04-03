# angular-mapbox
AngularJS MapBox library

## Installation

```npm
$   npm install angularjs-mapbox
```

## Quick Start
1. In your html, import the library `<script src="node_modules/angularjs-mapbox/index.js"></script>`
2. Include the css (or scss) in your html `<link rel="stylesheet" href="node_modules/angularjs-mapbox/angular-mapbox.css"></link>`

### HTML Example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="node_modules/angularjs-mapbox/angular-mapbox.css">
</head>
<body ng-app="baseApp">
    <h2>Your amazing site goes here</h2>
    <div ng-controller="mapController">
        ...
    </div>

    <script src = "node_modules/angular/angular.min.js"></script>
    <script src="node_modules/angularjs-mapbox/index.js"></script>
    <script src="/path/to/your/javascript.js"></script>
</body>
</html>
```

3. Import in the global modules' section:
```js
var app = angular.module('baseApp', [
    'angularMapbox'
]);
```

4. Add the key in the config section:
```js
app.config(
    [
        'angularMapboxConfigProvider', 
        function(angularMapboxConfigProvider) {
            angularMapboxConfigProvider.config({
                accessToken: '<YOUR ACCESS TOKEN>'
            });
        }
    ]
);
```

5. In your controller, declare some variables you'll use in the map for center and zoom
```js
app.controller('mapController', function($scope) {
    $scope.map = {
        zoom: 12,
        center: [ -74.804486, 10.980780 ]
    };
});
```

6. Create a new map!
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="node_modules/angularjs-mapbox/angular-mapbox.css">
</head>
<body ng-app="baseApp">
    <h2>Your amazing site goes here</h2>
    <div ng-controller="mapController">
        <angular-mapbox-map zoom="map.zoom" center="map.center" design="'mapbox://styles/mapbox/dark-v9'">
        </angular-mapbox-map>
    </div>

    <script src="node_modules/angular/angular.min.js"></script>
    <script src="node_modules/angularjs-mapbox/index.js"></script>
    <script src="/path/to/your/javascript.js"></script>
</body>
</html>
```

## Marker Example
You can create one or more markers in the map:
```html
<angular-mapbox-map zoom="map.zoom" center="map.center" design="'mapbox://styles/mapbox/dark-v9'">
    <angular-mapbox-marker ng-repeat="marker in markers" model="marker" identificator="'id'"></angular-mapbox-marker>
</angular-mapbox-map>
```

```js
app.controller('mapController', function($scope) {
    $scope.map = {
        zoom: 12,
        center: [ -74.804486, 10.980780 ]
    };

    $scope.markers = [{
        id: 'marker-1',
        lat: -74.804486,
        lng: 10.980780
    }, {
        id: 'marker-2',
        lat: -74.812486,
        lng: 10.985781
    }];
});
```

You can see more examples [here](./examples)

## Directive Reference


### Map [angular-mapbox-map]
| attribute | type    | value                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|-----------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| zoom      | numeric | The number of zoom                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| center    | array   | [longitude, latitude]                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| events    | object  | Refer to [documentation](https://docs.mapbox.com/mapbox-gl-js/api/#map.event:resize) for more information. See [examples](./examples) of how to use it.                                                                                                                                                                                                                                                                                                                         |
| design    | string  | Some of predefined styles: - mapbox://styles/mapbox/streets-v10 - mapbox://styles/mapbox/outdoors-v10 - mapbox://styles/mapbox/light-v9 - mapbox://styles/mapbox/dark-v9 - mapbox://styles/mapbox/satellite-v9 - mapbox://styles/mapbox/satellite-streets-v10 - mapbox://styles/mapbox/navigation-preview-day-v2 - mapbox://styles/mapbox/navigation-preview-night-v2 - mapbox://styles/mapbox/navigation-guidance-day-v2 - mapbox://styles/mapbox/navigation-guidance-night-v2 |


### Marker [angular-mapbox-marker]
| attribute     | type   | value                                                                                                                                                                                                                                                                                                                                                     |
|---------------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| model         | object | an object with the required values: lat, lng and additional a id field that should be unique. See [examples](./examples) for more information                                                                                                                                                                                                             |
| identificator | string | the value inside the model who has the identificator name (unique). Example: 'id'                                                                                                                                                                                                                                                                         |
| events        | object | Refer to [documentation](https://docs.mapbox.com/mapbox-gl-js/api/#marker.event:dragstart) for more information. See [./examples](examples) of how to use it. Additional, you can set events like click to the addEventListener include on the market itself. See [this documentation](https://www.w3schools.com/jsref/met_document_addeventlistener.asp) |


## To Do
- Finish Examples
- Finish documentation for geojson
- Finish documentation for popup
- Develop more stuff for mapboxgl library