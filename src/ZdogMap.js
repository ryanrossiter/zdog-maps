import Zdog from 'zdog';
import { toPath } from 'svg-points';

const ZOOM_DELTA = 0.08;
const PAN_DELTA = 1;

export default class ZdogMap {
    constructor({
        origin={ latitude: 44.26256742106572, longitude: -76.6080998780754 },
        zoom=0.8,
        container,
        buildings
    }) {
        this.container = container;
        this.origin = origin;
        this.zoom = zoom;
        this.buildings = buildings;
        this.offX = 0;
        this.offY = 0;

        this.svgElem = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        this.svgElem.setAttribute('width', 500);
        this.svgElem.setAttribute('height', 500);
        this.svgElem.style.pointerEvents = "none";
        this.svgElem.style.border = "1px solid blue";

        this.container.appendChild(this.svgElem);

        this.buildingGroup = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        this.svgElem.appendChild(this.buildingGroup);

        this.container.addEventListener('wheel', this.onScroll.bind(this));
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onScroll({ wheelDeltaY: dy, wheelDeltaX: dx }) {
        this.zoom *= 1 - dy / 500;
        this.setTransform();
    }

    onMouseMove({ buttons, movementX, movementY }) {
        if (buttons === 1) {
            this.offX += movementX * PAN_DELTA / this.zoom;
            this.offY += movementY * PAN_DELTA / this.zoom;
            this.setTransform();
        }
    }

    setTransform() {
        this.buildingGroup.setAttribute('transform',
            `translate(${-this.offX / 2} ${-this.offY / 2}) scale(${this.zoom}) translate(${this.offX * 1.5} ${this.offY * 1.5})`);
    }

    project(lat, lng) {
        // Size of the map
        var width = 500;
        var height = 500;
        // X and Y boundaries
        var westLong = this.origin.longitude + ZOOM_DELTA * this.zoom;
        var eastLong = this.origin.longitude - ZOOM_DELTA * this.zoom;
        var northLat = this.origin.latitude - ZOOM_DELTA * this.zoom;
        var southLat = this.origin.latitude + ZOOM_DELTA * this.zoom;
        var pi = 3.1415926535898;
        var mapLatBottomDegree = southLat  * pi / 180;
        //var longitude = -6.266327;//-9.0503;
        //var latitude = 53.2734;
        var mapLonDelta = eastLong - westLong;

        var lontest = width - (lng - westLong) * (width / mapLonDelta);

        lat = lat * pi / 180;
        var worldMapWidth = ((width / mapLonDelta) * 360) / (2 * pi);
        var mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree ))));    
        var lattest = ((worldMapWidth / 2 * Math.log((1 + Math.sin(lat )) / (1 - Math.sin(lat )))) - mapOffsetY);
        return { x: lontest, y: lattest };
    }

    render() {
        // remove all elements
        // while (this.buildingGroup.firstChild) {
        //     this.buildingGroup.removeChild(this.buildingGroup.firstChild);
        // }

        for (let { center, coordinates } of this.buildings) {
            // if (!this.inView(center.latitude, center.longitude)) continue;

            let d = toPath(coordinates.map(([latitude, longitude]) => this.project(latitude, longitude)));

            let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'green');
            this.buildingGroup.appendChild(path);
        }
    }
}