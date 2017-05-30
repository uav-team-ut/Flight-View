'use strict';

const remote = require('electron').remote;

const angular = require('angular');

const DashboardMap = require('./map').DashboardMap;

angular.module('flightView')
    .directive('fvMap', () => {
        let template = '<div id="mapbox-map" style=' +
                '"position:absolute;top:0;bottom:0;left:0;right:0;"></div>';

        return {
            restrict: 'E',
            controller: ['$scope', '$element', ($scope, $element) => {
                let coreClient = $scope.coreClient;

                $scope.$watch(() => document.getElementById('mapbox-map'),
                        () => {
                    $scope.map = new DashboardMap('mapbox-map');

                    $scope.map.on('map-cache-request', (data) => {
                        coreClient.send({
                            type: 'map-cache-image',
                            message: {
                               zoom: data.zoom,
                               lat_1: data.lat_1,
                               lon_1: data.lon_1,
                               lat_2: data.lat_2,
                               lon_2: data.lon_2
                            }
                        });
                    });
                });

                function missionListener(message) {
                    $scope.map.setInteropMission(message);
                }

                coreClient.onMessage('interop-mission', missionListener);

                $element.on('$destroy', () => {
                    coreClient.removeListener('interop-mission',
                            missionListener);
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

                function setHeadingLines() {
                    $scope.headingMinor = [];
                    $scope.headingMajor = [];

                    let heading = $scope.telemetry.yaw.degrees;
                    let direction = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W',
                            'NW'];

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
                }

                setHeadingLines();

                $scope.$watch('telemetry.yaw.degrees', () => {
                    setHeadingLines();
                });
            }],
            templateUrl: './templates/status-box.html'
        }
    });
