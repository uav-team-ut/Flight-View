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

        $scope.coreClient = coreClient;

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
    .controller('TelemetryController', ['$scope', '$element', '$attrs',
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
    }]);
