'use strict';

const angular = require('angular');

angular.module('flightView')
    .directive('fvMap', () => {
        return {
            restrict: 'E',
            template: 'TODO: make map work'
        }
    })
    .directive('fvStatusBox', () => {
        return {
            restrict: 'E',
                // function setScales(newValue, oldValue) {
                //     $scope.pitchMinor = [-15, -5, 5, 15];
                //     $scope.pitchMajor = [-20, -10, 10, 20];
                // }
                //
                // $scope.$watch(($scope) => $scope.telemetry, setScales);
                //
                // setScales($scope.telemetry, $scope.telemetry);
                //
            templateUrl: './templates/status-box.html'
        }
    });
