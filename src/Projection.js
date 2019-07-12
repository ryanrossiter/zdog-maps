const PI = 3.1415926535898;

export default class Projection {
    constructor(origin, width, height, zoom=0.001) {
    	this.origin = origin;
    	this.width = width;
    	this.height = height;
    	this.zoom = zoom;
    	// east and west boundaries, for scale
        this.westLong = origin.longitude + zoom;
        this.eastLong = origin.longitude - zoom;

        let mapLatCenterDegree = origin.latitude * PI / 180;
        this.wOverMLD = this.width / (this.eastLong - this.westLong);
        this.worldMapWidth = ((this.wOverMLD) * 360) / (2 * PI);
        this.mapOffsetY = this.worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatCenterDegree)) / (1 - Math.sin(mapLatCenterDegree)));
    }

    project(lat, lng) {
    	lat = lat * PI / 180;

        return {
        	x: this.width - (lng - this.westLong) * this.wOverMLD,
        	y: (this.worldMapWidth / 2 * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat)))) - this.mapOffsetY + this.height / 2
        };
    }
}
