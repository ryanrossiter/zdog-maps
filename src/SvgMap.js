import { toPath } from 'svg-points';
import { QuadTree, Box, Point } from 'js-quadtree';

const ZOOM_DELTA = 0.003;
const PAN_DELTA = 1;

const WIDTH = 500;
const HEIGHT = 500;

export default class SvgMap {
    constructor({
        origin={ latitude: 44.24, longitude: -76.53},
        zoom=1,
        container,
        buildings
    }) {
        this.container = container;
        this.origin = origin;
        this.zoom = zoom;
        this.buildings = buildings;
        this.offX = 0;
        this.offY = 0;

        let points = [];
        for (let { center, coordinates } of buildings) {
            points.push({
                ...this.project(center.latitude, center.longitude),
                coordinates
            });
        }

        this.tree = new QuadTree(
            new Box(-1000, -1000, 2000, 2000), {
                capacity: 1000,
            }, points);

        this.svgElem = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        this.svgElem.setAttribute('width', WIDTH);
        this.svgElem.setAttribute('height', HEIGHT);
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
        this.render();
    }

    project(lat, lng) {
        // Size of the map
        const lngDelta = ZOOM_DELTA, latDelta = ZOOM_DELTA * HEIGHT / WIDTH;
        // X and Y boundaries
        var westLong = this.origin.longitude + lngDelta;
        var eastLong = this.origin.longitude - lngDelta;
        var northLat = this.origin.latitude - latDelta;
        var southLat = this.origin.latitude + latDelta;
        var pi = 3.1415926535898;
        var mapLatBottomDegree = southLat * pi / 180;
        //var longitude = -6.266327;//-9.0503;
        //var latitude = 53.2734;
        var mapLngDelta = -lngDelta * 2;

        var lontest = WIDTH - (lng - westLong) * (WIDTH / mapLngDelta);

        lat = lat * pi / 180;
        var worldMapWidth = ((WIDTH / mapLngDelta) * 360) / (2 * pi);
        var mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree ))));    
        var lattest = ((worldMapWidth / 2 * Math.log((1 + Math.sin(lat )) / (1 - Math.sin(lat )))) - mapOffsetY);
        return { x: lontest, y: lattest };
    }

    render() {
        // remove all elements
        while (this.buildingGroup.firstChild) {
            this.buildingGroup.removeChild(this.buildingGroup.firstChild);
        }

        let { x: cx, y: cy } = this.project(this.origin.latitude, this.origin.longitude);
        let visibleBuildings = this.tree.query(new Box(cx - WIDTH * 0.6 / 2 - this.offX, cy - HEIGHT * 0.6 / 2 - this.offY, WIDTH * 0.6, HEIGHT * 0.6));
        
        for (let building of visibleBuildings) {
            // console.log(building);
            // if (!this.inView(center.latitude, center.longitude)) continue;

            if (!building.path) {
                building.path = toPath(building.coordinates.map(([latitude, longitude]) => this.project(latitude, longitude)));
            }

            let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
            path.setAttribute('d', building.path);
            path.setAttribute('fill', 'green');
            this.buildingGroup.appendChild(path);
        }
    }
}