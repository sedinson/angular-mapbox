var config = {},
    markers = {};

var obtain = function (scope, what) {
    if(scope[what]) {
        return scope[what];
    }

    return obtain(scope.$parent, what);
};

angular.module('angularMapbox', []).provider('angularMapboxConfig', function () {
    return {
        config: function (_config) {
            config = _config;
        },
        $get: function () {
            return config;
        }
    };
}).directive('angularMapboxMap', [function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            zoom: '=',
            center: '=',
            events: '=',
            design: '=',
            controls: '='
        },
        template: "<div class='angular-mapbox-gls'></div><div class='angular-mapbox-hidden' ng-transclude></div>",
        controller: ['$scope', '$element', function ($scope, $element) {
            mapboxgl.accessToken = config.accessToken;
            $scope.mapbox_map = new mapboxgl.Map({
                container: $element[0].getElementsByClassName('angular-mapbox-gls')[0], // container id
                style: $scope.design, // stylesheet location
                center: $scope.center, // starting position [lng, lat]
                zoom: $scope.zoom // starting zoom
            });

            $scope.mapbox_markers = {};

            Object.keys($scope.events || {}).forEach(function (event) {
                $scope.mapbox_map.on(event, function (e) {
                    $scope.$apply(function () {
                        $scope.events[event]($scope.mapbox_map, e);
                    });
                });
            });

            var natives = ['NavigationControl', 'GeolocateControl', 'AttributionControl', 'ScaleControl', 'FullscreenControl'];

            for(var key in $scope.controls) {
                $scope.controls[key].options = $scope.controls[key].options || {};

                if(natives.indexOf(key) >= 0) {
                    $scope.mapbox_map.addControl(new mapboxgl[key]($scope.controls[key].options), $scope.controls[key].position);
                } else {
                    $scope.controls[key].options.accessToken = mapboxgl.accessToken;
                    $scope.mapbox_map.addControl(new window[key]($scope.controls[key].options), $scope.controls[key].position);
                }
            };

            $scope.$watch('center', function (new_center) {
                if(Array.isArray(new_center) && (new_center[0] || 0) != 0 && (new_center[1] || 0) != 0) {
                    $scope.mapbox_map.panTo(new_center);
                }
            });

            $scope.$on('$destroy', function() {
                $scope.mapbox_map.remove();
            });
        }]
    }
}]).directive('angularMapboxMarker', [function () {
    return {
        require: '^^angularMapboxMap',
        restrict: 'E',
        transclude: true,
        template: '<div ng-transclude></div>',
        scope: {
            model: '=',
            events: '=',
            identificator: '='
        },
        controller: ['$scope', '$compile', function ($scope, $compile) {
            var identificator = $scope.identificator || 'id',
                id = null,
                template_popup = null,
                options_popup = null,
                _popup = null;

            var map = obtain($scope.$parent, 'mapbox_map'),
                markers = obtain($scope.$parent, 'mapbox_markers');

            var _generate = function () {
                var content = $compile(template_popup)($scope),
                    element = document.createElement('div');
                
                for(var i=0; i<content.length; i++) {
                    element.append(content[i]);
                }

                _popup = _popup || new mapboxgl.Popup(options_popup);
                _popup.setDOMContent(element);

                if(id && !markers[id]._mapbox_marker.getPopup()) {
                    !markers[id]._mapbox_marker.setPopup(_popup);
                }
            }

            $scope.$on('$destroy', function () {
                markers[id]._mapbox_marker && markers[id]._mapbox_marker.remove();
                delete markers[id];
            });

            $scope.$watch('model', function (new_marker, old_marker) {
                if(new_marker) {
                    id = new_marker[identificator];
                    
                    //-- Create / Update markers
                    if(!markers[id]) {
                        var _marker = new mapboxgl.Marker(new_marker.options);
                        _marker.setLngLat([new_marker.lng || 0, new_marker.lat || 0]);

                        Object.keys($scope.events || {}).forEach(function (event) {
                            if(['dragstart', 'drag', 'dragend'].indexOf(event) >= 0) {
                                _marker.on(event, function (e) {
                                    $scope.$apply(function () {
                                        $scope.event[event](new_marker, e);
                                    });
                                });
                            } else {
                                _marker.getElement().addEventListener(event, function (e) {
                                    $scope.$apply(function () {
                                        $scope.events[event](new_marker, e);
                                    });
                                });
                            }
                        });

                        _marker.addTo(map);

                        new_marker._mapbox_marker = _marker;
                        markers[id] = new_marker;
                        _generate();
                    } else {
                        if(markers[id].lat != new_marker.lat || markers[id].lng != new_marker.lng) {
                            markers[id]._mapbox_marker.setLngLat([new_marker.lng || 0, new_marker.lat || 0]);
                            markers[id].lat = new_marker.lat;
                            markers[id].lng = new_marker.lng;
                        }

                        if(markers[id].draggable != new_marker.draggable) {
                            markers[id]._mapbox_marker.setDraggable(new_marker.draggable);
                            markers[id].draggable = new_marker.draggable;
                        }

                        _generate();
                    }
                }
                
                if(!new_marker) {
                    if(old_marker) {
                        markers[old_marker[identificator]]._mapbox_marker && markers[old_marker[identificator]]._mapbox_marker.remove();
                        delete markers[(old_marker || {})[identificator]];
                    }
                } else if(old_marker && old_marker[identificator] != new_marker[identificator]) {
                    markers[old_marker[identificator]]._mapbox_marker && markers[old_marker[identificator]]._mapbox_marker.remove();
                    delete markers[(old_marker || {})[identificator]];
                }
            });

            this.setPopup = function (template, options) {
                template_popup = template;
                options_popup = options;
                _generate();
            };
        }]
    }
}]).directive('angularMapboxPopup', [function () {
    return {
        require: '^^angularMapboxMarker',
        restrict: 'E',
        transclude: true,
        template: '<div ng-transclude></div>',
        scope: {
            options: '='
        },
        link: function (scope, element, attrs, markerController) {
            scope.self = scope.$parent.model;
            markerController.setPopup(element[0].getElementsByTagName('div')[0].innerHTML, scope.options);
        }
    };
}]).directive('angularMapboxGeojson', [function () {
    return {
        require: '^^angularMapboxMap',
        restrict: 'E',
        transclude: true,
        template: '<div ng-transclude></div>',
        scope: {
            identificator: '=',
            data: '=',
            type: '=',
            layout: '=',
            paint: '='
        },
        controller: ['$scope', function ($scope) {
            var map = obtain($scope.$parent, 'mapbox_map');

            $scope.$watch('data', function (new_data) {
                if(new_data) {
                    map.getSource($scope.identificator) && map.getSource($scope.identificator).setData(new_data);
                }
            }, true);

            $scope.$watch('paint', function (new_paint, old_paint) {
                var properties = Object.keys(new_paint);

                for(var i=0; i<properties.length; i++) {
                    var val = properties[i];
                    if(new_paint[val] != old_paint[val]) {
                        map.setPaintProperty($scope.identificator, val, new_paint[val]);
                    }
                }
            }, true);

            $scope.$on('$destroy', function () {
                if(map.getLayer($scope.identificator)) {
                    map.removeLayer($scope.identificator);
                    map.removeSource($scope.identificator);
                }
            });

            var is_loaded = false,
            onMapLoad = function () {
                is_loaded = true;

                !map.getSource($scope.identificator)? map.addSource($scope.identificator, {
                    type: 'geojson',
                    data: $scope.data || {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": []
                        }
                    }
                }) : map.getSource($scope.identificator).setData($scope.data);
    
                !map.getLayer($scope.identificator) && map.addLayer({
                    id: $scope.identificator,
                    type: $scope.type,
                    source: $scope.identificator,
                    layout: $scope.layout,
                    paint: $scope.paint
                });
            };

            if(is_loaded) {
                onMapLoad();
            } else {
                map.on('load', onMapLoad);
            }
        }]
    }
}]).directive('angularMapboxCircle', [function () {
    var radiusAtMaxZoom = function (unit, radius, latitude) {
        switch(unit) {
            case 'px':
                return radius;
            case 'km':
                radius *= 1000;
                break;
        }

        return radius / 0.075 / Math.cos(latitude * Math.PI / 180);
    };

    return {
        require: '^^angularMapboxMap',
        restrict: 'E',
        transclude: true,
        template: '<div ng-transclude></div>',
        scope: {
            identificator: '=',
            radius: '=',
            center: '=',
            layout: '=',
            paint: '=',
            unit: '='
        },
        controller: ['$scope', function ($scope) {
            var map = obtain($scope.$parent, 'mapbox_map');

            var change_radius = function () {
                map.getSource($scope.identificator) && map.setPaintProperty($scope.identificator, 'circle-radius', {
                    stops: [
                        [0, 0],
                        [20, radiusAtMaxZoom($scope.unit, $scope.radius, $scope.center[1])]
                    ],
                    base: 2
                });
            };

            $scope.$watch('center', function (new_data, old_data) {
                if(new_data) {
                    map.getSource($scope.identificator) && map.getSource($scope.identificator).setData({
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": $scope.center
                            }
                        }]
                    });
                }
            }, true);

            $scope.$watch('paint', function (new_paint, old_paint) {
                var properties = Object.keys(new_paint);
                
                for(var i=0; i<properties.length; i++) {
                    var val = properties[i];
                    if(val != 'circle-radius' && new_paint[val] != old_paint[val]) {
                        map.setPaintProperty($scope.identificator, val, new_paint[val]);
                    }
                }
            }, true);

            $scope.$watch('radius', function (new_radius) {
                change_radius();
            });

            $scope.$watch('unit', function (new_unit) {
                change_radius();
            });

            $scope.$on('$destroy', function () {
                if(map.getLayer($scope.identificator)) {
                    map.removeLayer($scope.identificator);
                    map.removeSource($scope.identificator);
                }
            });

            var is_loaded = false,
            onMapLoad = function () {
                is_loaded = true;
                
                !map.getSource($scope.identificator)? map.addSource($scope.identificator, {
                    type: 'geojson',
                    data: {
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": $scope.center
                            }
                        }]
                    }
                }) : map.getSource($scope.identificator).setData({
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": $scope.center
                        }
                    }]
                });
    
                !map.getLayer($scope.identificator) && map.addLayer({
                    id: $scope.identificator,
                    type: 'circle',
                    source: $scope.identificator,
                    layout: $scope.layout,
                    paint: $scope.paint
                });

                change_radius();
            };

            if(is_loaded) {
                onMapLoad();
            } else {
                map.on('load', onMapLoad);
            }
        }]
    }
}]);