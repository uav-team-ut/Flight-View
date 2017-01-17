const remote = require('electron').remote;

const angular = require('angular');
const angularAnimate = require('angular-animate');
const angularSanitize = require('angular-sanitize');
const angularUIBootstrap = require('angular-ui-bootstrap');

const IPCClient = require('./ipc-client');
const Telemetry = require('../../util/types/telemetry');

let coreClient = new IPCClient('flight-view', 'core');

exports.coreClient = coreClient;

let telemetry = new Telemetry();

angular.module('flightView', ['ngAnimate', 'ngSanitize', 'ui.bootstrap'])
    .controller('FlightViewController', ['$scope', ($scope) => {
        $scope.openTab = 'dashboard';
        $scope.started = false;

        $scope.toggleConsole = () => {
            let webContents = remote.getCurrentWebContents();

            if (!webContents.isDevToolsOpened()) {
                webContents.openDevTools({detach: true});
            } else {
                webContents.closeDevTools();
            }
        };

        $scope.startSolo = () => {
            coreClient.send({
                type: 'start',
                message: {
                    type: 'solo',
                    port: 25000
                }
            });

            // TODO: Verify that the server started successfully
            $scope.started = true;
        };

        $scope.stop = () => {
            coreClient.send({
                type: 'stop',
                message: null
            });

            // TODO: Verify that the server stopped successfully
            $scope.started = false;
        };
    }])
    .controller('DashboardController', ['$scope', '$element', '$attrs',
            ($scope, $element, $attrs) => {
        $scope.telemetry = telemetry;
        console.log(telemetry);

        function eventListener(message) {
            telemetry = Telemetry.deserialize(message);
            $scope.telemetry = telemetry;

            $scope.$apply();
        }

        coreClient.on('telemetry', eventListener);

        $element.on('$destroy', () => {
            coreClient.removeListener('telemetry', eventListener);
        });
    }])
    .controller('BatteryController', ['$scope', ($scope) => {
        $scope.watchStatus = ($scope, variable, warning, danger) => {
            function getStatus(value) {
                let status = 'success';

                if (warning < danger) {
                    if (value > danger) {
                        status = 'danger';
                    } else if (value > warning) {
                        status = 'warning';
                    }
                } else {
                    if (value < danger) {
                        status = 'danger';
                    } else if (value < warning) {
                        status = 'warning';
                    }
                }

                return status;
            }

            $scope.$watch(variable, () => {
                $scope.status = getStatus($scope[variable]);
            });
        };
    }])
    .controller('BatteryPercentageController', ['$scope', ($scope) => {
        $scope.max = 100;

        $scope.watchStatus($scope, 'battery_percentage', 50, 20);
    }])
    .controller('BatteryVoltageController', ['$scope', ($scope) => {
        $scope.max = 30;

        $scope.watchStatus($scope, 'battery_voltage', 15, 10);
    }])
    .controller('BatteryCurrentController', ['$scope', ($scope) => {
        $scope.max = 50;

        $scope.watchStatus($scope, 'battery_current', 30, 40);
    }]);
