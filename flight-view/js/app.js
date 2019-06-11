const remote = require('electron').remote;

const angular = require('angular');
const angularAnimate = require('angular-animate');
const angularSanitize = require('angular-sanitize');
const angularUIBootstrap = require('angular-ui-bootstrap');

const IPCClient = require('./ipc-client');

let coreClient = new IPCClient('flight-view', 'core');

exports.coreClient = coreClient;

let default_telemetry = new Telemetry({}, { filled: true });

angular
  .module('flightView', ['ngAnimate', 'ngSanitize', 'ui.bootstrap'])
  .controller('FlightViewController', [
    '$scope',
    ($scope) => {
      $scope.openTab = 'dashboard';
      $scope.started = false;

      $scope.coreClient = coreClient;

      $scope.toggleConsole = () => {
        let webContents = remote.getCurrentWebContents();

        if (!webContents.isDevToolsOpened()) {
          webContents.openDevTools({ detach: true });
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
      };

      $scope.stop = () => {
        coreClient.send({
          type: 'stop',
          message: null
        });

        // TODO: Verify that the server stopped successfully
        $scope.started = false;
      };
    }
  ])
  .controller('TelemetryController', [
    '$scope',
    '$element',
    '$attrs',
    ($scope, $element, $attrs) => {
      $scope.telemetry = default_telemetry;

      function eventListener(message) {
        $scope.telemetry = message;
        $scope.$apply();
      }

      coreClient.onMessage('telemetry', eventListener);

      $element.on('$destroy', () => {
        coreClient.removeListener('telemetry', eventListener);
      });
    }
  ]);
