import Zdog from 'zdog';
import { toPath } from 'svg-points';
import { QuadTree, Box, Point } from 'js-quadtree';

const ZOOM_DELTA = 0.002;
const PAN_DELTA = 1;

let frames = 0;
let lastFrameTime = Date.now();
window.fps = 0;

function radiansToDegrees (_val) {  
  return _val * (Math.PI/180);
}


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

        this.container.addEventListener('wheel', this.onScroll.bind(this));
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));

        let illustration = new Zdog.Illustration({
            element: zdogElement,
            
            scale: 1,
            rotate: {x: Zdog.TAU/6, z: Zdog.TAU / 8}
        });

        let mainGroup = new Zdog.Group({
            addTo: illustration,
            translate: {x: -240, y: -240},
            // translate: {x: -0, y: 0, z: 110 }
        });

        this.zdog = { illustration, mainGroup };
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
        // this.render();
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

    genZdogWall(p0, p1, height) {
        new Zdog.Shape({
            addTo: this.zdog.mainGroup,
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

    genZdogFloor(points, height=0, color="#000") {
        new Zdog.Shape({
          addTo: this.zdog.mainGroup,
          path: points.map(p => ({ ...p, z: height })),
          closed: true,
          stroke: 2,
          fill: true,
          color
        });
    }

    genZdogBuilding(points, height) {
        for (let i = 0; i < points.length; i++) {
            let p0 = points[i],
                p1 = points[(i + 1) % points.length];

            this.genZdogWall(p0, p1, height);
        }

        this.genZdogFloor(points, height);
    }

    render() {

        let { x: cx, y: cy } = this.project(this.origin.latitude, this.origin.longitude);
        let visibleBuildings = this.tree.query(new Box(cx - 200, cy - 200, 400, 400));
        console.log(visibleBuildings);
        for (let building of visibleBuildings) {
            // console.log(building);
            // if (!this.inView(center.latitude, center.longitude)) continue;

            if (!building.path) {
                building.points = building.coordinates.map(([latitude, longitude]) => this.project(latitude, longitude))
                building.path = toPath(building.points);
            }

            this.genZdogBuilding(building.points, Math.random() * 10);
        }

        this.renderLoop();
    }

    renderLoop() {
        this.zdog.illustration.rotate.z += 0.03;
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