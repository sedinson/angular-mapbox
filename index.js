require('angular');

var mapboxgl = require('mapbox-gl/dist/mapbox-gl'),
    _ = require('lodash');

var config = {},
    map = null,
    markers = {};

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
            design: '='
        },
        template: "<div id='mapbox-gls'></div><div class='angular-mapbox-hidden' ng-transclude></div>",
        controller: ['$scope', function ($scope) {
            mapboxgl.accessToken = config.accessToken;

            map = new mapboxgl.Map({
                container: 'mapbox-gls', // container id
                style: $scope.design || 'mapbox://styles/mapbox/streets-v9', // stylesheet location
                center: $scope.center, // starting position [lon, lat]
                zoom: $scope.zoom // starting zoom
            });

            _.each(Object.keys($scope.events || {}), function (event) {
                map.on(event, function (e) {
                    $scope.events[event](map, e);
                });
            });

            $scope.$watch('center', function (new_center) {
                if(Array.isArray(new_center) && (new_center[0] || 0) != 0 && (new_center[1] || 0) != 0) {
                    map.panTo(new_center);
                }
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
            events: '='
        },
        controller: ['$scope', '$compile', function ($scope, $compile) {
            var identificator = $scope.identificator || 'id',
                id = null,
                template_popup = null,
                options_popup = null,
                _popup = null;

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
                        _marker.setLngLat([new_marker.lon || 0, new_marker.lat || 0]);

                        _.each(Object.keys($scope.events || {}), function (event) {
                            if(['dragstart', 'drag', 'dragend'].indexOf(event) >= 0) {
                                _marker.on(event, function (e) {
                                    $scope.event[event](new_marker, e);
                                });
                            } else {
                                _marker.getElement().addEventListener(event, function (e) {
                                    $scope.events[event](new_marker, e);
                                });
                            }
                        });

                        _marker.addTo(map);

                        new_marker._mapbox_marker = _marker;
                        markers[id] = new_marker;
                        _generate();
                    } else {
                        if(markers[id].lat != new_marker.lat || markers[id].lon != new_marker.lon) {
                            markers[id]._mapbox_marker.setLngLat([new_marker.lon || 0, new_marker.lat || 0]);
                            markers[id].lat = new_marker.lat;
                            markers[id].lon = new_marker.lon;
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
            $scope.$watch('data', function (new_data) {
                if(new_data) {
                    map.getSource($scope.identificator) && map.getSource($scope.identificator).setData(new_data);
                }
            }, true);

            map.on('load', function () {
                map.addSource($scope.identificator, {
                    type: 'geojson',
                    data: $scope.data || {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": []
                        }
                    }
                });
    
                map.addLayer({
                    id: $scope.identificator,
                    type: $scope.type,
                    source: $scope.identificator,
                    layout: $scope.layout,
                    paint: $scope.paint
                });
            });
        }]
    }
}]);