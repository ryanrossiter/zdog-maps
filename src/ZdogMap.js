import Zdog from 'zdog';
import { QuadTree, Box, Circle, Point } from 'js-quadtree';
import Projection from './Projection';

const ZOOM_DELTA = 0.001;
const PAN_DELTA = 1;

const MAX_ZOOM = 2.5;
const MIN_ZOOM = 0.8;

let frames = 0;
let lastFrameTime = Date.now();
window.fps = 0;

export default class ZdogMap {
    constructor({
        origin={ latitude: 44.24, longitude: -76.53},
        zoom=1,
        buildings,
        zdogElement='.zdog-canvas'
    }) {
        this.container = document.querySelector(zdogElement);
        this.origin = origin;
        this.zoom = zoom;
        this.buildings = buildings;
        this.offX = 0;
        this.offY = 0;

        let illustration = new Zdog.Illustration({
            element: zdogElement,
            
            scale: this.zoom,
            rotate: {x: Zdog.TAU/7, z: Zdog.TAU / 8}
        });

        let mainGroup = new Zdog.Group({
            addTo: illustration,
            translate: {x: -illustration.width / 2, y: -illustration.height / 2},
            // translate: {x: -0, y: 0, z: 110 }
        });

        this.zdog = { illustration, mainGroup };

        this.projection = new Projection(origin, illustration.width, illustration.height);


        let points = [];
        for (let { center, ...rest } of buildings) {
            points.push({
                ...this.projection.project(center.latitude, center.longitude),
                ...rest
            });
        }

        this.tree = new QuadTree(
            new Box(-1000, -1000, 2000, 2000), {
                capacity: 1000,
            }, points);

        this.container.addEventListener('wheel', this.onScroll.bind(this));
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onScroll({ wheelDeltaY: dy, wheelDeltaX: dx }) {
        this.zoom *= 1 - dy / 500;
        this.zoom = Math.min(Math.max(this.zoom, MIN_ZOOM), MAX_ZOOM);
        this.zdog.illustration.scale = this.zoom;
        this.genMap();
    }

    onMouseMove({ buttons, movementX, movementY }) {
        if (buttons === 1) {
            let xd = movementX * PAN_DELTA / this.zoom,
                yd = movementY * PAN_DELTA / this.zoom,
                zr = this.zdog.illustration.rotate.z;
            this.offX += yd * Math.sin(zr) + xd * Math.cos(zr);
            this.offY += yd * Math.cos(zr) - xd * Math.sin(zr);

            this.zdog.mainGroup.translate.x = this.offX - this.zdog.illustration.width / 2;
            this.zdog.mainGroup.translate.y = this.offY - this.zdog.illustration.height / 2;

            this.genMap();
        }
    }

    genZdogWall(parent, p0, p1, height) {
        return new Zdog.Shape({
            addTo: parent,
            path: [
                { ...p0, z: 0 },
                { ...p1, z: 0 },
                { ...p1, z: height },
                { ...p0, z: height },
            ],
            stroke: 2,
            fill: true,
            color: '#0000AA'
        });
    }

    genZdogFloor(parent, points, height=0, color="#000") {
        return new Zdog.Shape({
          addTo: parent,
          path: points.map(p => ({ ...p, z: height })),
          closed: true,
          stroke: 2,
          fill: true,
          color
        });
    }

    genZdogBuilding(parent, points, height) {
        let group = new Zdog.Group({ addTo: parent });
        let zdog = {
            group,
            roof: null,
            walls: [],
        };

        for (let i = 0; i < points.length; i++) {
            let p0 = points[i],
                p1 = points[(i + 1) % points.length];

            zdog.walls.push(this.genZdogWall(group, p0, p1, height));
        }

        // create after so it appears over top
        zdog.roof = this.genZdogFloor(group, points, height);

        return zdog;
    }

    genMap() {
        // empty the group before adding children
        this.zdog.mainGroup.children = [];

        let { x: cx, y: cy } = this.projection.project(this.origin.latitude, this.origin.longitude);
        let visibleBuildings = this.tree.query(new Circle(cx - this.offX, cy - this.offY, this.zdog.illustration.width / this.zoom));

        for (let building of visibleBuildings) {
            // console.log(building);
            // if (!this.inView(center.latitude, center.longitude)) continue;

            if (!building.zdog) {
                building.points = building.coordinates.map(([latitude, longitude]) => this.projection.project(latitude, longitude));
                building.zdog = this.genZdogBuilding(this.zdog.mainGroup, building.points, 20);
            } else {
                this.zdog.mainGroup.addChild(building.zdog.group);
            }
        }

        this.zdog.mainGroup.updateGraph();
    }

    render() {
        this.genMap()

        this.renderLoop();
    }

    renderLoop() {
        this.zdog.illustration.rotate.z += 0.01;
        this.zdog.illustration.updateRenderGraph();

        frames++;
        if (Date.now() - lastFrameTime > 1000) {
            lastFrameTime = Date.now();
            window.fps = frames;
            frames = 0;
        }

        requestAnimationFrame(this.renderLoop.bind(this));
    }
}