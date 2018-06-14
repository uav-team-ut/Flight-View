const path = require('path');

const remote = require('electron').remote;

const mapboxGL = require('mapbox-gl/dist/mapbox-gl');

const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const MapboxMap = mapboxGL.Map;

require('dotenv').config()

const LOCAL_TILES = path.join(__dirname, '../..',
        '.data/map-cache-images/map-cache-{z}-{x}-{y}.jpg');

let drawnTargets = [];

EARTH_RADIUS = 6371008
EARTH_ECCEN  = 0.081819

let satelliteSource = {
    type: 'raster',
    url: 'mapbox://mapbox.satellite'
};

let satelliteLayer = {
    id: 'mapbox-satellite',
    source: 'mapbox-satellite',
    type: 'raster'
};

let cacheSource = {
    type: 'raster',
    tiles: [LOCAL_TILES]
};

let cacheLayer = {
    id: 'cache',
    source: 'cache',
    type: 'raster'
};

function buildFlyZoneData(mission) {
    let flyZones = mission.fly_zones;
    let flyZoneCoordinates = [[[]]];

    for (let i = 0; i < flyZones.length; i++) {
        for (let j = 0; j < flyZones[i].boundary_pts.length; j++) {
            flyZoneCoordinates[i][0].push([
                flyZones[i].boundary_pts[j].longitude,
                flyZones[i].boundary_pts[j].latitude
            ]);
        }

        flyZoneCoordinates[i][0].push([
            flyZones[i].boundary_pts[0].longitude,
            flyZones[i].boundary_pts[0].latitude
        ]);
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'MultiPolygon',
            coordinates: flyZoneCoordinates
        }
    };
}

function buildSearchAreaData(mission) {
    let searchAreas = mission.search_grid_points;
    let searchAreaCoordinates = [[]];

    for (let i = 0; i < searchAreas.length; i++) {
        searchAreaCoordinates[0].push([
            searchAreas[i].longitude,
            searchAreas[i].latitude
        ]);
    }

    if (searchAreas.length > 0) {
        searchAreaCoordinates[0].push([
            searchAreas[0].longitude,
            searchAreas[0].latitude
        ]);
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: searchAreaCoordinates
        }
    };
}

function buildWaypointsData(mission) {
    let waypoints = mission.mission_waypoints;
    let waypointsCoordinates = [];

    waypointsCoordinates.sort((a, b) => parseInt(a.order) - parseInt(b.order));

    for (let i = 0; i < waypoints.length; i++) {
        waypointsCoordinates.push([
            waypoints[i].longitude,
            waypoints[i].latitude
        ]);
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: waypointsCoordinates
        }
    };
}

function extractPoint(thing) {
    return {
        type: 'Point',
        coordinates: [thing.longitude, thing.latitude]
    }
}

function generateCircle(lat, lon, radius) {
    lat *= Math.PI / 180;
    lon *= Math.PI / 180;

    let circle = [];

    for (let i = 0; i < 2 * Math.PI; i += Math.PI / 40) {
        let x = radius * Math.cos(i);
        let y = radius * Math.sin(i);

        let r1 = EARTH_RADIUS * (1 - Math.pow(EARTH_ECCEN, 2)) /
                Math.pow((1 - Math.pow(EARTH_ECCEN, 2) *
                Math.pow(Math.sin(lat), 2)), 3 / 2);

        let r2 = EARTH_RADIUS / Math.sqrt(1 - Math.pow(EARTH_ECCEN, 2) *
                Math.pow(Math.sin(lat), 2));

        let newLat = y / r1 + lat;
        let newLon = x / r2 / Math.cos(lat) + lon;

        newLat /= Math.PI / 180;
        newLon /= Math.PI / 180;

        circle.push([newLon, newLat]);
    }

    circle.push(circle[0]);

    return circle;
}

function buildStatObsData(obstacles) {
    let statObs = obstacles.stationary_obstacles;
    let statObsCoordinates = [];

    for (let i = 0; i < statObs.length; i++) {
        let lat = statObs[i].latitude;
        let lon = statObs[i].longitude;
        let radius = statObs[i].cylinder_radius * 0.3048;

        let circle = generateCircle(lat, lon, radius);

        statObsCoordinates.push([circle]);
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'MultiPolygon',
            coordinates: statObsCoordinates
        }
    };
}

function buildMovObsData(obstacles) {
    let movObs = obstacles.moving_obstacles;
    let movObsCoordinates = [];

    for (let i = 0; i < movObs.length; i++) {
        let lat = movObs[i].latitude;
        let lon = movObs[i].longitude;
        let radius = movObs[i].sphere_radius * 0.3048;

        let circle = generateCircle(lat, lon, radius);

        movObsCoordinates.push([circle]);
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'MultiPolygon',
            coordinates: movObsCoordinates
        }
    };
}

function buildTargetsData(targets) {
    let filteredTargets = [];

    for (let i = 0; i < targets.length; i++) {
        if(filteredTargets[i].type === "standard" &&
                (drawnTargets.indexOf(targets[i].id) == -1)) {
            filteredTargets.push(targets[i]);
            drawnTargets.push(targets[i].id);
        }
    }

    return filteredTargets;
}

mapboxGL.accessToken = process.env.FV_MAPBOX_KEY;

class DashboardMap extends MapboxMap {
    constructor(containerID) {
        super({
            container: containerID,
            style: {
                version: 8,
                sources: {
                    'mapbox-satellite': satelliteSource
                },
                layers: [
                    {
                        id: 'background',
                        type: 'background'
                    },
                    {
                        id: 'mapbox-satellite',
                        source: 'mapbox-satellite',
                        type: 'raster'
                    }
                ]
            },
        });

        this.useCache = false;
        this.cacheCount = 0;

        this.dragRotate.disable();

        this._makeContextMenu();
    }

    _makeContextMenu() {
        let mapGeneralMenu = new Menu();

        mapGeneralMenu.append(new MenuItem({
            label: 'Cache Map',
            click: () => {
                let bounds = this.getBounds().toArray();

                console.log(bounds);

                this.fire('map-cache-request', {
                   zoom: this.getZoom(),
                   lat_1: bounds[1][1],
                   lon_1: bounds[0][0],
                   lat_2: bounds[0][1],
                   lon_2: bounds[1][0]
                });
            }
        }));

        mapGeneralMenu.append(new MenuItem({
            type: 'separator'
        }));

        mapGeneralMenu.append(new MenuItem({
            type: 'checkbox',
            label: 'Use Cache',
            click: () => {
                this.useCache = !this.useCache;

                if (this.useCache) this.showCache();
                else this.hideCache();
            }
        }));

        this.on('contextmenu', () => {
            mapGeneralMenu.popup(remote.getCurrentWindow());
        });

        this.on('error', (data) => {
            console.log(data);
        });
    }

    showCache() {
        this.removeLayer('mapbox-satellite')
        this.removeSource('mapbox-satellite');
        this.addSource('cache', cacheSource);
        this.addLayer(cacheLayer)
    }

    hideCache() {
        this.removeLayer('cache')
        this.removeSource('cache');
        this.addSource('mapbox-satellite', satelliteSource);
        this.addLayer(satelliteLayer);
    }

    setInteropMission(mission) {

        let airDropPosition = extractPoint(mission.air_drop_pos);
        let flyZoneData = buildFlyZoneData(mission);
        let homePosition = extractPoint(mission.home_pos);
        let waypointsData = buildWaypointsData(mission);
        let offAxisTargetPosition = extractPoint(mission.off_axis_odlc_pos);
        let emergentLastKnownPosition = extractPoint(
            mission.emergent_last_known_pos);
        let searchAreaData = buildSearchAreaData(mission);

        this._setAirDropPosition(airDropPosition);
        this._setFlyZone(flyZoneData);
        this._setHomePosition(homePosition);
        this._setWaypoints(waypointsData);
        this._setOffAxisTargetPosition(offAxisTargetPosition);
        this._setEmergentLastKnownPosition(emergentLastKnownPosition);
        this._setSearchArea(searchAreaData);
    }

    setObstacles(obstacles) {
        let statObsData = buildStatObsData(obstacles);
        let movObsData = buildMovObsData(obstacles);

        this._setStatObs(statObsData);
        this._setMovObs(movObsData);
    }

    setTargets(targets) {
        let targetsData = buildTargetsData(targets);

        console.log("ello");
        this._setTargets(targetsData);
    }

    setPlanePosition(lat, lon, yaw) {
        let planeData = {
            type: 'Point',
            coordinates: [lon, lat]
        };

        if (this.getSource('plane') === undefined) {
            this.addSource('plane', {
                type:'geojson', data: planeData
            });

            this.addLayer({
                id: 'plane',
                type: 'circle',
                source: 'plane',
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#fa0d5e',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
            });

        } else {
            this.getSource('plane').setData(planeData);
        }
    }

    _setAirDropPosition(airDropPosition) {
        if (this.getSource('air-drop') === undefined) {
            this.addSource('air-drop', {
                type:'geojson', data: airDropPosition
            });

            this.addLayer({
                id: 'air-drop',
                type: 'circle',
                source: 'air-drop',
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#fae10e',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
            });

        } else {
            this.getSource('air-drop').setData(airDropPosition);
        }
    }

    _setFlyZone(flyZoneData) {
        if (this.getSource('fly-zone') === undefined) {
            this.addSource('fly-zone', {
                type: 'geojson', data: flyZoneData
            });

            this.addLayer({
                id: 'fly-zone',
                type: 'line',
                source: 'fly-zone',
                layout: {
                    'line-join': 'bevel'
                },
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 4
                }
            });
        } else {
            this.getSource('fly-zone').setData(flyZoneData);
        }
    }

    _setHomePosition(homePosition) {
        if (this.getSource('home-pos') === undefined) {
            this.addSource('home-pos', {
                type:'geojson', data: homePosition
            });

            this.addLayer({
                id: 'home-pos',
                type: 'circle',
                source: 'home-pos',
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#0ae10e',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
            });

        } else {
            this.getSource('home-pos').setData(homePosition);
        }
    }

    _setWaypoints(waypointsData) {
        if (this.getSource('interop-waypoints') === undefined) {
            this.addSource('interop-waypoints', {
                type: 'geojson', data: waypointsData
            });

            this.addLayer({
                id: 'interop-waypoints',
                type: 'line',
                source: 'interop-waypoints',
                layout:  {
                    'line-join': 'bevel'
                },
                paint: {
                    'line-color': '#0000ff',
                    'line-width': 4
                }
            });
        } else {
            this.getSource('interop-waypoints').setData(waypointsData);
        }
    }

    _setOffAxisTargetPosition(offAxisTargetPosition) {
        if (this.getSource('off-axis') === undefined) {
            this.addSource('off-axis', {
                type:'geojson', data: offAxisTargetPosition
            });

            this.addLayer({
                id: 'off-axis',
                type: 'circle',
                source: 'off-axis',
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#ff0000',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
            });
        } else {
            this.getSource('off-axis').setData(offAxisTargetPosition);
        }
    }

    _setEmergentLastKnownPosition(emergentLastKnownPosition) {
       if (this.getSource('emergent') === undefined) {
            this.addSource('emergent', {
                type:'geojson', data: emergentLastKnownPosition
            });

            this.addLayer({
                id: 'emergent',
                type: 'circle',
                source: 'emergent',
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#2fade1',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
            });

        } else {
            this.getSource('emergent').setData(emergentLastKnownPosition);
        }
    }

    _setSearchArea(searchAreaData) {
        if (this.getSource('search-area') === undefined) {
            this.addSource('search-area', {
                type: 'geojson', data: searchAreaData
            });

            this.addLayer({
                id: 'search-area',
                type: 'line',
                source: 'search-area',
                layout:  {
                    'line-join': 'bevel'
                },
                paint: {
                    'line-color': '#ffff00',
                    'line-width': 4
                }
            });
        } else {
            this.getSource('search-area').setData(searchAreaData);
        }
    }

    _setStatObs(statObsData) {
        if (this.getSource('stat-obs') === undefined) {
            this.addSource('stat-obs', {
                type: 'geojson', data: statObsData
            });

            this.addLayer({
                id: 'stat-obs',
                type: 'fill',
                source: 'stat-obs',
                paint: {
                    'fill-color': '#ff0000'
                }
            });
        } else {
            this.getSource('stat-obs').setData(statObsData);
        }
    }

    _setMovObs(movObsData) {
        if (this.getSource('mov-obs') === undefined) {
            this.addSource('mov-obs', {
                type: 'geojson', data: movObsData
            });

            this.addLayer({
                id: 'mov-obs',
                type: 'fill',
                source: 'mov-obs',
                paint: {
                    'fill-color': '#ff0000'
                }
            });
        } else {
            this.getSource('mov-obs').setData(movObsData);
        }
    }

    _setTargets(targetsData) {
        let targetsGeoData = [];
        for (let i = 0; i < targetsData.length; i++) {
            targetsGeoData.push([targetsData[i].longitude,
                    targetsData[i].latitude]);
        }

        targetsData = {
            type: 'Feature',
            geometry: {
                type: 'MultiPoint',
                coordinates: targetsGeoData
            }
        };

        if (this.getSource('targets') === undefined) {
            this.addSource('targets', {
                type: 'geojson', data: targetsData
            });

            this.addLayer({
                id: 'targets',
                type: 'circle',
                source: 'targets',
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#000000',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
            });
        } else {
            this.getSource('targets').setData(targetsData);
        }
    }

    _setTargetsALT(targetsData) {
        for (let i = 0; i < targetsData.length; i++) {
            let popup = new mapboxGL.Popup({offset:25}).setText(
                "Target #" + targetsData[i].id + '\n' +
                "Orientation: " + targetsData[i].orientation + '\n' +
                "Shape: " + targetsData[i].shape + '\n' +
                "Color: " + targetsData[i].background_color + '\n' +
                "Text: " + targetsData[i].alphanumeric + '\n' +
                "Text Color: " + targetsData[i].alphanumeric_color + '\n' +
                "Description: " + targetsData[i].description + '\n' +
                "Autonomous: " + targetsData[i].autonomous
            );

            let el = document.createElement('div');
            el.className = 'marker';

            new mapboxGL.Marker(el, {offset:[-25, -25]})
                .setLngLat([targetsData[i].longitude, targetsData[i].latitude])
                .setPopup(popup)
                .addTo(this);
        }
    }
}

exports.DashboardMap = DashboardMap;
