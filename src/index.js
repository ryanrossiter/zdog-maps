import Zdog from 'zdog';
import Papa from 'papaparse';

import ZdogMap from './ZdogMap';
import SvgMap from './SvgMap';

const TEST_BUILDINGS = [
	[[44.230189, -76.492001], [44.225143, -76.486592], [44.230299, -76.481693]],
	[[44.236077, -76.490726], [44.235784, -76.480927], [44.242037, -76.481233], [44.244485, -76.504611]]
];

document.addEventListener('DOMContentLoaded', () => {
	let buildingData = null,
		roadSegmentData = null;
	let p0 = new Promise((resolve) => 
		Papa.parse('data/buildings.csv', {
			download: true,
			header: true,
			delimiter: ';',
			complete: ({ data }) => {
				buildingData = data;
				resolve();
			}
		})
	);

	let p1 = new Promise((resolve) => 
		Papa.parse('data/road-segments.csv', {
			download: true,
			header: true,
			delimiter: ';',
			complete: ({ data }) => {
				roadSegmentData = data;
				resolve();
			}
		})
	);

	Promise.all([p0, p1]).then(() => {
		let buildings = [], roads = [];
		// data = data.filter(({ shape_area, building_class }) => parseFloat(shape_area) > 50);
		
		for (let { geo_shape, geo_point_2d, building_id } of buildingData) {
			if (!geo_shape) continue;

			let id = parseInt(building_id);
			let geoShape = JSON.parse(geo_shape);
			let [lats, lons] = geo_point_2d.split(', ');
			let center = { latitude: parseFloat(lats), longitude: parseFloat(lons) };

			let addCoords = (coords) => {
				if (typeof coords[0][0] !== 'number') {
					for (let c of coords) addCoords(c);
				} else {
					buildings.push({
						id, center,
						coordinates: coords.map(c=>c.reverse())
					});
				}
			}

			addCoords(geoShape.coordinates);
		}

		for (let { geo_shape, geo_point_2d, road_element_id } of roadSegmentData) {
			if (!geo_shape) continue;

			let id = parseInt(road_element_id);
			let geoShape = JSON.parse(geo_shape);
			let [lats, lons] = geo_point_2d.split(', ');
			let center = { latitude: parseFloat(lats), longitude: parseFloat(lons) };
			let coordinates = geoShape.coordinates.map(c => c.reverse()); // reverse to get [lat, lng] instead of [lng, lat]

			roads.push({ id, center, coordinates });
		}

		let zDogMap = new ZdogMap({
			buildings, roads
		});
		zDogMap.render();
		console.log("Done Zdog");

		// let svgMap = new SvgMap({
		// 	container: document.querySelector("#container"),
		// 	buildings
		// });
		// svgMap.render();
		// console.log("Done SVG");
	});
}, false);