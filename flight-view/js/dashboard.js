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
            controller: ['$scope', ($scope) => {
                $scope.Math = Math;
            }],
            templateUrl: './templates/status-box.html'
        }
    });
