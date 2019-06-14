const path = require('path');

const remote = require('electron').remote;

const enums = require('../../util/enums');
const interop = require('../../proto/messages').interop;

const mapboxGL = require('mapbox-gl/dist/mapbox-gl');

const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const MapboxMap = mapboxGL.Map;

require('dotenv').config();

const LOCAL_TILES = path.join(
  __dirname,
  '../..',
  '.data/map-cache-images/map-cache-{z}-{x}-{y}.jpg'
);

const icons = {
  plane: { url: 'img/icons/plane.png', name: 'plane' },
  airdrop: { url: 'img/icons/airdrop.png', name: 'airdrop' },
  home: { url: 'img/icons/home.png', name: 'home' },
  offaxis: { url: 'img/icons/offaxis.png', name: 'offaxis' },
  target: { url: 'img/icons/target.png', name: 'target' },
  emergent: { url: 'img/icons/unknown.png', name: 'emergent' }
};

let drawnTargets = [];

const EARTH_RADIUS = 6371008;
const EARTH_ECCEN = 0.081819;

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
    for (let j = 0; j < flyZones[i].boundary.length; j++) {
      flyZoneCoordinates[i][0].push([
        flyZones[i].boundary[j].lon,
        flyZones[i].boundary[j].lat
      ]);
    }

    flyZoneCoordinates[i][0].push([
      flyZones[i].boundary[0].lon,
      flyZones[i].boundary[0].lat
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
  let searchAreas = mission.search_area;
  let searchAreaCoordinates = [];

  for (let i = 0; i < searchAreas.length; i++) {
    searchAreaCoordinates.push([
      searchAreas[i].lon,
      searchAreas[i].lat
    ]);
  }

  if (searchAreas.length > 0) {
    searchAreaCoordinates.push([
      searchAreas[0].lon,
      searchAreas[0].lat
    ]);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [searchAreaCoordinates]
    }
  };
}

function buildWaypointsData(mission) {
  let waypoints = mission.waypoints;
  let waypointsCoordinates = [];

  for (let i = 0; i < waypoints.length; i++) {
    waypointsCoordinates.push([waypoints[i].lon, waypoints[i].lat]);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: waypointsCoordinates
    }
  };
}

function buildTelemWaypointsData(mission) {
  let waypoints = mission.mission_items;
  if (!waypoints) return null;
  let waypointsCoordinates = [];

  for (let i = 0; i < waypoints.length; i++) {
    waypointsCoordinates.push([waypoints[i].x, waypoints[i].y]);
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
    coordinates: [thing.lon, thing.lat]
  };
}

function generateCircle(lat, lon, radius) {
  lat *= Math.PI / 180;
  lon *= Math.PI / 180;

  let circle = [];

  for (let i = 0; i < 2 * Math.PI; i += Math.PI / 40) {
    let x = radius * Math.cos(i);
    let y = radius * Math.sin(i);

    let r1 =
      (EARTH_RADIUS * (1 - Math.pow(EARTH_ECCEN, 2))) /
      Math.pow(
        1 - Math.pow(EARTH_ECCEN, 2) * Math.pow(Math.sin(lat), 2),
        3 / 2
      );

    let r2 =
      EARTH_RADIUS /
      Math.sqrt(1 - Math.pow(EARTH_ECCEN, 2) * Math.pow(Math.sin(lat), 2));

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
  let statObs = obstacles.stationary;
  let statObsCoordinates = [];

  for (let i = 0; i < statObs.length; i++) {
    let lat = statObs[i].pos.lat;
    let lon = statObs[i].pos.lon;
    let radius = statObs[i].radius * 0.3048;

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
  let movObs = obstacles.moving;
  let movObsCoordinates = [];

  for (let i = 0; i < movObs.length; i++) {
    let lat = movObs[i].pos.lat;
    let lon = movObs[i].pos.lon;
    let radius = movObs[i].radius * 0.3048;

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
    if (
      targets[i].type === interop.Odlc.Type.STANDARD &&
      drawnTargets.indexOf(targets[i].id) == -1
    ) {
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
      }
    });

    this.useCache = false;
    this.cacheCount = 0;

    this.dragRotate.disable();

    this._makeContextMenu();

    for (let icon in icons) {
      this.loadImage(`${icons[icon].url}`, (err, img) => {
        if (err) {
          console.error(err);
        } else {
          this.addImage(icons[icon].name, img);
        }
      });
    }
  }

  _makeContextMenu() {
    let mapGeneralMenu = new Menu();

    mapGeneralMenu.append(
      new MenuItem({
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
      })
    );

    mapGeneralMenu.append(
      new MenuItem({
        type: 'separator'
      })
    );

    mapGeneralMenu.append(
      new MenuItem({
        type: 'checkbox',
        label: 'Use Cache',
        click: () => {
          this.useCache = !this.useCache;

          if (this.useCache) this.showCache();
          else this.hideCache();
        }
      })
    );

    this.on('contextmenu', () => {
      mapGeneralMenu.popup(remote.getCurrentWindow());
    });

    this.on('error', (err) => {
      console.error(err);
    });
  }

  showCache() {
    this.addSource('cache', cacheSource);
    this.addLayer(cacheLayer, 'mapbox-satellite');
    this.removeLayer('mapbox-satellite');
    this.removeSource('mapbox-satellite');
  }

  hideCache() {
    this.addSource('mapbox-satellite', satelliteSource);
    this.addLayer(satelliteLayer, 'cache');
    this.removeLayer('cache');
    this.removeSource('cache');
  }

  setInteropMission(mission) {
    let airDropPosition = extractPoint(mission.air_drop_pos);
    let flyZoneData = buildFlyZoneData(mission);
    // let homePosition = extractPoint(mission.home_pos);
    let waypointsData = buildWaypointsData(mission);
    let offAxisTargetPosition = extractPoint(mission.off_axis_pos);
    let emergentLastKnownPosition = extractPoint(
      mission.emergent_pos
    );
    let searchAreaData = buildSearchAreaData(mission);

    this._setAirDropPosition(airDropPosition);
    this._setFlyZone(flyZoneData);
    // this._setHomePosition(homePosition);
    this._setWaypoints(waypointsData);
    this._setOffAxisTargetPosition(offAxisTargetPosition);
    this._setEmergentLastKnownPosition(emergentLastKnownPosition);
    this._setSearchArea(searchAreaData);
  }

  setObstacles(obstacles) {
    let statObsData = buildStatObsData(obstacles);
    // let movObsData = buildMovObsData(obstacles);

    this._setStatObs(statObsData);
    // this._setMovObs(movObsData);
  }

  setTargets(targets) {
    let targetsData = buildTargetsData(targets);

    this._setTargets(targetsData);
  }

  setWaypoints(waypoints) {
    let waypointsData = buildWaypointsData(waypoints);

    this._setWaypoints(waypointsData);
  }

  setRawMission(mission) {
    let waypointsData = buildTelemWaypointsData(mission);
    if (!waypointsData) return;

    this._setRawMission(waypointsData);
  }

  setPlanePosition(lat, lon, yaw) {
    let planeData = {
      type: 'Point',
      coordinates: [lon, lat]
    };

    if (this.getSource('plane') === undefined) {
      this.addSource('plane', {
        type: 'geojson',
        data: planeData
      });

      this.addLayer({
        id: 'plane',
        type: 'circle',
        source: 'plane',
        /*
                layout: {
                    'icon-image': icons.plane.name,
                    'icon-size': .5,
                    //'icon-color': '#fa0d5e'
                },
                */
        paint: {
          'circle-radius': 7,
          'circle-color': '#3fb51c',
          'circle-blur': 0.3,
          'circle-opacity': 0.9
        }
      });
    } else {
      this.getSource('plane').setData(planeData);
    }
  }

  _setAirDropPosition(airDropPosition) {
    if (this.getSource('air-drop') === undefined) {
      this.addSource('air-drop', {
        type: 'geojson',
        data: airDropPosition
      });

      this.addLayer({
        id: 'air-drop',
        type: 'symbol',
        source: 'air-drop',
        layout: {
          'icon-image': icons.airdrop.name,
          'icon-size': 0.5
          //'icon-color': '#fae10e'
        }
        /*
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#fae10e',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
                */
      });
    } else {
      this.getSource('air-drop').setData(airDropPosition);
    }
  }

  _setFlyZone(flyZoneData) {
    if (this.getSource('fly-zone') === undefined) {
      this.addSource('fly-zone', {
        type: 'geojson',
        data: flyZoneData
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

      const coords = flyZoneData.geometry.coordinates;
      console.log(coords);
      console.log(coords[0]);
      console.log(coords[0][0]);
      this.flyTo({
        center: [coords[0][0][0][0], coords[0][0][0][1]],
        zoom: 14
      });
    } else {
      this.getSource('fly-zone').setData(flyZoneData);
    }
  }

  _setHomePosition(homePosition) {
    if (this.getSource('home-pos') === undefined) {
      this.addSource('home-pos', {
        type: 'geojson',
        data: homePosition
      });

      this.addLayer({
        id: 'home-pos',
        type: 'symbol',
        source: 'home-pos',
        layout: {
          'icon-image': icons.home.name,
          'icon-size': 0.5
          //'icon-color': '#0ae10e'
        }
        /*
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#0ae10e',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
                */
      });
    } else {
      this.getSource('home-pos').setData(homePosition);
    }
  }

  _setWaypoints(waypointsData) {
    if (this.getSource('interop-waypoints') === undefined) {
      this.addSource('interop-waypoints', {
        type: 'geojson',
        data: waypointsData
      });

      this.addLayer({
        id: 'interop-waypoints',
        type: 'line',
        source: 'interop-waypoints',
        layout: {
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

  _setRawMission(waypointsData) {
    if (this.getSource('telem-mission') === undefined) {
      this.addSource('telem-mission', {
        type: 'geojson',
        data: waypointsData
      });

      this.addLayer({
        id: 'telem-mission',
        type: 'line',
        source: 'telem-mission',
        layout: {
          'line-join': 'bevel'
        },
        paint: {
          'line-color': '#0000ff',
          'line-width': 4
        }
      });
    } else {
      this.getSource('telem-mission').setData(waypointsData);
    }
  }

  _setOffAxisTargetPosition(offAxisTargetPosition) {
    if (this.getSource('off-axis') === undefined) {
      this.addSource('off-axis', {
        type: 'geojson',
        data: offAxisTargetPosition
      });

      this.addLayer({
        id: 'off-axis',
        type: 'symbol',
        source: 'off-axis',
        layout: {
          'icon-image': icons.offaxis.name,
          'icon-size': 0.5
          //'icon-color': '#ff0000'
        }
        /*
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#ff0000',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
                */
      });
    } else {
      this.getSource('off-axis').setData(offAxisTargetPosition);
    }
  }

  _setEmergentLastKnownPosition(emergentLastKnownPosition) {
    if (this.getSource('emergent') === undefined) {
      this.addSource('emergent', {
        type: 'geojson',
        data: emergentLastKnownPosition
      });

      this.addLayer({
        id: 'emergent',
        type: 'symbol',
        source: 'emergent',
        layout: {
          'icon-image': icons.emergent.name,
          'icon-size': 0.5
          //'icon-color': '#ff0000'
        }
        /*
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#2fade1',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
                */
      });
    } else {
      this.getSource('emergent').setData(emergentLastKnownPosition);
    }
  }

  _setSearchArea(searchAreaData) {
    if (this.getSource('search-area') === undefined) {
      this.addSource('search-area', {
        type: 'geojson',
        data: searchAreaData
      });

      this.addLayer({
        id: 'search-area',
        type: 'line',
        source: 'search-area',
        layout: {
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
        type: 'geojson',
        data: statObsData
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
        type: 'geojson',
        data: movObsData
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
      targetsGeoData.push([targetsData[i].lon, targetsData[i].lat]);
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
        type: 'geojson',
        data: targetsData
      });

      this.addLayer({
        id: 'targets',
        type: 'symbol',
        source: 'targets',
        layout: {
          'icon-image': icons.target.name,
          'icon-size': 0.5
          //'icon-color': '#000000'
        }
        /*
                paint : {
                    'circle-radius': 7,
                    'circle-color': '#000000',
                    'circle-blur' : 0.3,
                    'circle-opacity': 0.9,
                }
                */
      });
    } else {
      this.getSource('targets').setData(targetsData);
    }
  }

  _setTargetsALT(targetsData) {
    for (let i = 0; i < targetsData.length; i++) {
      let popup = new mapboxGL.Popup({ offset: 25 }).setText(
        'Target #' +
          targetsData[i].id +
          '\n' +
          'Orientation: ' +
          enums.Odlc.Orientation[targetsData[i].orientation] +
          '\n' +
          'Shape: ' +
          enums.Odlc.Shape[targetsData[i].shape] +
          '\n' +
          'Color: ' +
          enums.Odlc.Color[targetsData[i].background_color] +
          '\n' +
          'Text: ' +
          enums.Odlc.Text[targetsData[i].alphanumeric] +
          '\n' +
          'Text Color: ' +
          enums.Odlc.Color[targetsData[i].alphanumeric_color] +
          '\n' +
          'Description: ' +
          targetsData[i].description +
          '\n' +
          'Autonomous: ' +
          targetsData[i].autonomous ? 'Yes' : 'No'
      );

      let el = document.createElement('div');
      el.className = 'marker';

      new mapboxGL.Marker(el, { offset: [-25, -25] })
        .setLngLat([targetsData[i].lon, targetsData[i].lat])
        .setPopup(popup)
        .addTo(this);
    }
  }
}

exports.DashboardMap = DashboardMap;
