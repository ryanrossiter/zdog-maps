import { toPath } from 'svg-points';
import { QuadTree, Box, Point } from 'js-quadtree';
import Projection from './Projection';

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
        this.projection = new Projection(origin, WIDTH, HEIGHT);

        this.buildings = buildings;
        this.offX = 0;
        this.offY = 0;

        let points = [];
        for (let { center, coordinates } of buildings) {
            points.push({
                ...this.projection.project(center.latitude, center.longitude),
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

        this.setTransform();
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
        this.buildingGroup.setAttribute('transform', `
            translate(${(1 - this.zoom) * WIDTH / 2} ${(1 - this.zoom) * HEIGHT / 2})
            scale(${this.zoom})
            translate(${this.offX} ${this.offY})`);
        this.render();
    }

    render() {
        // remove all elements
        while (this.buildingGroup.firstChild) {
            this.buildingGroup.removeChild(this.buildingGroup.firstChild);
        }

        let { x: cx, y: cy } = this.projection.project(this.origin.latitude, this.origin.longitude);

        let visibleBuildings = this.tree.query(new Box(cx - this.offX - WIDTH / 2 / this.zoom, cy - this.offY - HEIGHT / 2 / this.zoom, WIDTH / this.zoom, HEIGHT / this.zoom));
        
        for (let building of visibleBuildings) {
            // console.log(building);
            // if (!this.inView(center.latitude, center.longitude)) continue;

            if (!building.path) {
                building.path = toPath(building.coordinates.map(([latitude, longitude]) => this.projection.project(latitude, longitude)));
            }

            let path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
            path.setAttribute('d', building.path);
            path.setAttribute('fill', 'green');
            this.buildingGroup.appendChild(path);
        }
    }
}