import Zdog from 'zdog';
import { toPath } from 'svg-points';
import { QuadTree, Box, Point } from 'js-quadtree';
import convertToBezier from './convertToBezier';

const ZOOM_DELTA = 0.01;
const PAN_DELTA = 1;

function radiansToDegrees (_val) {  
  return _val * (Math.PI/180);
}

function makeZdogBezier (_path) {   
    let arr = [];
    arr[0] = {x: _path[0].x, y: _path[0].y};    
    for(let i = 1; i < _path.length; i++) {
        if(i % 3 == 0 ) {
            var key = "bezier";
            var obj = {};
            obj[key] = [
                {x: _path[i-2].x, y: _path[i-2].y},
                {x: _path[i-1].x, y: _path[i-1].y},
                {x: _path[i].x, y: _path[i].y}
            ];
            arr.push(obj);      
        }
    }
    return arr;
}

let animationObject = { zoom:1, rotationY:0, rotationZ: -30  };

let scene = new Zdog.Anchor({
  translate: {x: 240, y: 240},
    scale: 1
});

var mainGroup = new Zdog.Group({
  addTo: scene,
  translate: {x: -0, y: 0, z: 110 }
});

export default class ZdogMap {
    constructor({
        origin={ latitude: 44.24, longitude: -76.53},
        zoom=1,
        container,
        buildings,
        zdogContainer
    }) {
        this.container = container;
        this.origin = origin;
        this.zoom = zoom;
        this.buildings = buildings;
        this.offX = 0;
        this.offY = 0;

        this.zdogContainer = zdogContainer;

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

    render() {
        // remove all elements
        while (this.buildingGroup.firstChild) {
            this.buildingGroup.removeChild(this.buildingGroup.firstChild);
        }

        let { x: cx, y: cy } = this.project(this.origin.latitude, this.origin.longitude);
        let visibleBuildings = this.tree.query(new Box(cx - this.offX / this.zoom - 200, cy - this.offY / this.zoom - 200, 400, 400));
        console.log(visibleBuildings);
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

            let lensShape = new Zdog.Shape({
              translate: {x: 0, y: 0, z: 0 },
              addTo: mainGroup,
              path:  convertToBezier(building.path) ,
              closed: true,
              stroke: 2,
                fill: false,
              color: '#000000CF'
            });
        }

        scene.renderGraphSvg(this.zdogContainer);
    }
}