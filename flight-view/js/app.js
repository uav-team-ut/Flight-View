const remote = require('electron').remote;

const angular = require('angular');
const angularAnimate = require('angular-animate');
const angularSanitize = require('angular-sanitize');
const angularUIBootstrap = require('angular-ui-bootstrap');

const IPCClient = require('./ipc-client');
const Telemetry = require('../../util/types/telemetry');

let coreClient = new IPCClient('flight-view', 'core');

exports.coreClient = coreClient;

let default_telemetry = new Telemetry({}, {filled: true});

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
                    message: null
                }
            });

            // TODO: Verify that the server started successfully
            $scope.started = true;
            $scope.canLogIn = true;
        };

        $scope.stop = () => {
            coreClient.send({
                type: 'stop',
                message: null
            });

            // TODO: Verify that the server stopped successfully
            $scope.started = false;
            $scope.canLogIn = false;
        };

        $scope.canLogIn = false;

        $scope.loginInterop = (url, username, password) => {
            coreClient.send({
                type: 'login.request',
                message: {
                    url: url,
                    username: username,
                    password: password
                }
            });
        };

        coreClient.onMessage('login.fail', (message) => {
            console.log(message);
        });

        coreClient.onMessage('login.success', (message) => {
            $scope.canLogIn = false;
            $scope.loggedIn = true;

            $scope.$apply();
        });
    }])
    .controller('TelemetryController', ['$scope', '$element', '$attrs',
            ($scope, $element, $attrs) => {
        $scope.telemetry = default_telemetry;

        function eventListener(message) {
            let new_telemetry = Telemetry.deserialize(message);

            let doc = new_telemetry.toDocument();
            let newFields = {};

            for (let field in doc) {
                if (doc.hasOwnProperty(field)) {
                    if (doc[field] !== undefined) {
                        newFields[field] = doc[field];
                    }
                }
            }

            $scope.telemetry.add(newFields);

            $scope.$apply();
        }

        coreClient.onMessage('telemetry', eventListener);

        $element.on('$destroy', () => {
            coreClient.removeListener('telemetry', eventListener);
        });
    }]);
