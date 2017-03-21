const path = require('path');

const mapboxGL = require('mapbox-gl/dist/mapbox-gl');

let satelliteSource = {
    type: 'raster',
    url: 'mapbox://mapbox.satellite'
};

let satelliteLayer = {
    id: 'mapbox-satellite',
    source: 'mapbox-satellite',
    type: 'raster'
};

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

        this.dragRotate.disable();

        this.on('error', (data) => {
            console.log(data);
        });
    }
}

exports.DashboardMap = DashboardMap;
