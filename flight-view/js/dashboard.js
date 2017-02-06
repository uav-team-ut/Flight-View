'use strict';

const angular = require('angular');

angular.module('flightView')
    .directive('fvMap', () => {
        let template = '<div id="mapbox-map" style=' +
                '"position:absolute;top:0;bottom:0;left:0;right:0;"></div>';

        return {
            restrict: 'E',
            controller: ['$scope', ($scope) => {
                $scope.$watch(() => document.getElementById('mapbox-map'),
                        () => {
                    const mapboxGL = require('mapbox-gl/dist/mapbox-gl');
                    const Map = mapboxGL.Map;

                    mapboxGL.accessToken = process.env.FV_MAPBOX_KEY;

                    let map = new Map({
                        container: 'mapbox-map',
                        style: 'mapbox://styles/mapbox/satellite-v9'
                    });
                });
            }],
            template: template
        }
    })
    .directive('fvStatusBox', () => {
        return {
            restrict: 'E',
            controller: ['$scope', ($scope) => {
                $scope.Math = Math;
                $scope.headingMinor = [];
                $scope.headingMajor = [];

                let heading = $scope.telemetry.yaw.degrees;
                let direction = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

                for (let i = -500; i <= 500; i += 5) {
                    if (Math.abs(heading - i) <= 50 && i % 45 != 0) {
                        $scope.headingMinor.push(i);
                    }
                }

                for (let i = -405; i <= 405; i += 45) {
                    if (Math.abs(heading - i) <= 50) {
                        $scope.headingMajor.push([i,
                                direction[(i % 360 + 360) % 360 / 45]]);
                    }
                }
            }],
            templateUrl: './templates/status-box.html'
        }
    });
