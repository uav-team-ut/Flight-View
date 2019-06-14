const remote = require('electron').remote;
const angular = require('angular');
const angularAnimate = require('angular-animate');
const angularSanitize = require('angular-sanitize');
const angularUIBootstrap = require('angular-ui-bootstrap');

const sprintf = require('sprintf-js').sprintf;

const IPCClient = require('./ipc-client');

const telemetry = require('../../proto/messages').telemetry;

let coreClient = new IPCClient('flight-view', 'core');

exports.coreClient = coreClient;

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
          webContents.openDevTools({ mode: 'detach' });
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

      $scope.getPlaneMission = () => {
        coreClient.send({
          type: 'get-plane-mission',
          message: null
        });
      };
    }
  ])
  .controller('TelemetryController', [
    '$scope',
    '$element',
    '$attrs',
    ($scope, $element, $attrs) => {
      $scope.telemetry = telemetry.Overview.create({
        time: 0,
        pos: {},
        rot: {},
        alt: {},
        vel: {},
        speed: {},
        battery: {}
      });
      console.log($scope.telemetry);

      function eventListener(message) {
        $scope.telemetry = message;
        $scope.$apply();
      }

      coreClient.onMessage('telemetry', eventListener);

      $element.on('$destroy', () => {
        coreClient.removeListener('telemetry', eventListener);
      });

      $scope.getAirTime = (time) => {
        return new Date(time * 1000).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
      };

      $scope.metersToFeet = (meters) => meters / .3048;
      $scope.msToKnots = (ms) => ms / .514444;

      $scope.sprintf = sprintf;
    }
  ]);
