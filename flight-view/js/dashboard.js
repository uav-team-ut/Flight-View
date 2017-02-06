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
            }],
            templateUrl: './templates/status-box.html'
        }
    });
