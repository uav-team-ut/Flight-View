const remote = require('electron').remote

const IPCClient = require('./ipc-client')
const sprintf = require('sprintf-js').sprintf

const angular = require('angular')
const angularAnimate = require('angular-animate')
const angularSanitize = require('angular-sanitize')
const angularUIBootstrap = require('angular-ui-bootstrap')

let ipcClient = new IPCClient('flight_view', 'core')

ipcClient.on('connect', () => {
    console.log('CONNECTED.')
})

ipcClient.onMessage('telemetry.data', (message) => {
    ipcClient.emit('telemetry', message)
})

// ipcClient.on('telemetry', (message) => {
//     test.innerHTML = (JSON.stringify(message, null, '\t'))
// })

// // FOR CHECKING MESSAGES IN AND OUT
// ipcClient.on('send', (message) => {
//     console.log('Sending: ' + message)
// })
//
// ipcClient.on('receive', (message) => {
//     console.log('Received: ' + message)
// })

exports.ipcClient = ipcClient

let telemetry = {
    time: -1,
    lat: 0,
    lon: 0,
    alt: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    airspeed: 0,
    battery_percentage: 0,
    battery_voltage: 0,
    battery_current: 0,
    wind_speed: 0,
    wind_direction: 0
}

angular.module('flightView', ['ngAnimate', 'ngSanitize', 'ui.bootstrap'])
    .controller('FlightViewController', ['$scope', ($scope) => {
        $scope.openTab = 'dashboard'
        $scope.toggleConsole = () => {
            let webContents = remote.getCurrentWebContents()

            if (!webContents.isDevToolsOpened()) {
                webContents.openDevTools({detach: true})
            } else {
                webContents.closeDevTools()
            }
        }
    }])
    .controller('ClientEventController', ['$scope', '$element', '$attrs',
            ($scope, $element, $attrs) => {

        $scope.format = (string, value) => {
            return sprintf(string, value)
        }

        for (let key in telemetry) {
            $scope[key] = telemetry[key]
        }

        function eventListener(message) {
            for (let key in message) {
                telemetry[key] = message[key]
                $scope[key] = telemetry[key]
            }

            $scope.$apply()
        }

        ipcClient.on($attrs.event, eventListener)

        $element.on('$destroy', () => {
            ipcClient.removeListener($attrs.event, eventListener)
        })
    }])
    .controller('BatteryController', ['$scope', ($scope) => {
        $scope.watchStatus = ($scope, variable, warning, danger) => {
            function getStatus(value) {
                let status = 'success'

                if (warning < danger) {
                    if (value > danger) {
                        status = 'danger'
                    } else if (value > warning) {
                        status = 'warning'
                    }
                } else {
                    if (value < danger) {
                        status = 'danger'
                    } else if (value < warning) {
                        status = 'warning'
                    }
                }

                return status
            }

            $scope.$watch(variable, () => {
                $scope.status = getStatus($scope[variable])
            })
        }
    }])
    .controller('BatteryPercentageController', ['$scope', ($scope) => {
        $scope.max = 100

        $scope.watchStatus($scope, 'battery_percentage', 50, 20)
    }])
    .controller('BatteryVoltageController', ['$scope', ($scope) => {
        $scope.max = 30

        $scope.watchStatus($scope, 'battery_voltage', 15, 10)
    }])
    .controller('BatteryCurrentController', ['$scope', ($scope) => {
        $scope.max = 50

        $scope.watchStatus($scope, 'battery_current', 30, 40)
    }])
