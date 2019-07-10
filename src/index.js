import Zdog from 'zdog';
import Papa from 'papaparse';

import ZdogMap from './ZdogMap';

const TEST_BUILDINGS = [
	[[44.230189, -76.492001], [44.225143, -76.486592], [44.230299, -76.481693]],
	[[44.236077, -76.490726], [44.235784, -76.480927], [44.242037, -76.481233], [44.244485, -76.504611]]
];

document.addEventListener('DOMContentLoaded', () => {
	Papa.parse('data/buildings.csv', {
		download: true,
		header: true,
		delimiter: ';',
		complete: ({ data }) => {
			let buildings = [];
			data = data.filter(({ shape_area, building_class }) => parseFloat(shape_area) > 50 && building_class === "Commercial");

			for (let { geo_shape, geo_point_2d } of data) {
				if (!geo_shape) continue;

				let coords = JSON.parse(geo_shape).coordinates;
				// if (coords[0][0].length > 2) console.log(coords);
				// buildings.push(coords[0]);
				// continue;
				let [lats, lons] = geo_point_2d.split(', ');
				let center = { latitude: parseFloat(lats), longitude: parseFloat(lons) };

				let addCoords = (coords) => {
					if (typeof coords[0][0] !== 'number') {
						for (let c of coords) addCoords(c);
					} else {
						for (let c of coords) {
							buildings.push({
								center,
								coordinates: coords.map(c=>c.reverse())
							});
						}
					}
				}

				addCoords(coords[0]);
			}

			let map = new ZdogMap({
				container: document.querySelector("#container"),
				buildings
			});
			map.render();
			console.log("done");
		}
	});


	// var illoElem = document.querySelector('#content');
	// var illoSize = 24;
	// var minWindowSize = Math.min( window.innerWidth - 20, window.innerHeight - 40 );
	// var zoom = Math.floor( minWindowSize / illoSize );
	// illoElem.setAttribute( 'width', illoSize * zoom );
	// illoElem.setAttribute( 'height', illoSize * zoom );

	// [ Zdog.Shape, Zdog.Rect ].forEach( function( ItemClass ) {
	//   ItemClass.defaults.fill = true;
	//   ItemClass.defaults.backface = false;
	//   ItemClass.defaults.stroke = 1/zoom;
	// });

	// var white = 'white';
	// var black = '#333';
	// var isSpinning = true;
	// var TAU = Zdog.TAU;
	// var initRotate = { y: TAU/4 };

	// var illo = new Zdog.Illustration({
	//   element: illoElem,
	//   zoom: zoom,
	//   rotate: initRotate,
	//   dragRotate: true,
	//   onDragStart: function() {
	//     isSpinning = false;
	//   },
	// });

	// // -- illustration shapes --- //

	// function makeWall( options ) {
	//   var rotor = new Zdog.Anchor({
	//     addTo: illo,
	//     rotate: options.rotate,
	//   });

	//   // rotor
	//   var wall = new Zdog.Anchor({
	//     addTo: rotor,
	//     translate: { z: 4 },
	//   });

	//   var topBlock = new Zdog.Anchor({
	//     addTo: wall,
	//     translate: { x: -4, y: -4 },
	//   });

	//   // side faces
	//   var face = new Zdog.Rect({
	//     addTo: topBlock,
	//     width: 2,
	//     height: 2,
	//     translate: { z: 1 },
	//     color: options.outside,
	//   });
	//   face.copy({
	//     translate: { x: -1 },
	//     rotate: { y: TAU/4 },
	//     color: options.left,
	//   });
	//   face.copy({
	//     translate: { x: 1 },
	//     rotate: { y: -TAU/4 },
	//     color: options.right,
	//   });
	//   face.copy({
	//     translate: { z: -1 },
	//     rotate: { y: TAU/2 },
	//     color: options.inside,
	//   });
	//   // top
	//   face.copy({
	//     translate: { y: -1 },
	//     rotate: { x: TAU/4 },
	//     color: black,
	//   });

	//   topBlock.copyGraph({
	//     translate: { x:  0, y: -4 },
	//   });

	//   var topTile = new Zdog.Rect({
	//     addTo: wall,
	//     width: 2,
	//     height: 2,
	//     color: black,
	//     rotate: { x: TAU/4 },
	//     translate: { x: -2, y: -3 },
	//   });
	//   topTile.copy({
	//     translate: { x:  2, y: -3 }
	//   });

	//   // outside arch

	//   // outside arch
	//   var arch = new Zdog.Shape({
	//     addTo: wall,
	//     path: [
	//       { x: 0, y: -3 },
	//       { x: 3, y: -3 },
	//       { x: 3, y:  2 },
	//       { arc: [
	//         { x: 3, y: -1 },
	//         { x: 0, y: -1 }
	//       ]},
	//     ],
	//     translate: { z: 1 },
	//     color: options.outside,
	//   });
	//   arch.copy({
	//     scale: { x: -1 },
	//   });


	//   // inside arch
	//   arch.copy({
	//     translate: { z: -1 },
	//     rotate: { y: TAU/2 },
	//     color: options.inside,
	//   });
	//   arch.copy({
	//     translate: { z: -1 },
	//     rotate: { y: TAU/2 },
	//     scale: { x: -1 },
	//     color: options.inside,
	//   });

	//   // outside columns
	//   var outsideColumn = new Zdog.Rect({
	//     addTo: wall,
	//     width: 2,
	//     height: 8,
	//     translate: { x: -4, y: 1, z: 1 },
	//     color: options.outside,
	//   });
	//   outsideColumn.copy({
	//     translate: { x: 4, y: 1, z: 1 },
	//   });

	//   var insideColumn = new Zdog.Rect({
	//     addTo: wall,
	//     width: 2,
	//     height: 3,
	//     translate: { x: -3, y: 3.5 },
	//     rotate: { y: -TAU/4 },
	//     color: options.right,
	//   });
	//   insideColumn.copy({
	//     translate: { x:  3, y: 3.5 },
	//     rotate: { y: TAU/4 },
	//     color: options.left,
	//   });

	//   // under arch, quarter arc
	//   var underArch = new Zdog.Shape({
	//     addTo: wall,
	//     path: [
	//       { x:  3, y:  2 },
	//       { arc: [
	//         { x: 3, y: -1 },
	//         { x: 0, y: -1 }
	//       ]},
	//       { x: 0, y: -1, z: -2 },
	//       { arc: [
	//         { x: 3, y: -1, z: -2 },
	//         { x: 3, y: 2, z: -2 },
	//       ]},
	//     ],
	//     translate: { z: 1 },
	//     backface: true,
	//     color: options.left,
	//   });
	//   underArch.copyGraph({
	//     scale: { x: -1 },
	//     color: options.right,
	//   });

	//   // feet soles
	//   new Zdog.Rect({
	//     addTo: wall,
	//     width: 2,
	//     height: 2,
	//     translate: { x: -4, y: 5, z: 0 },
	//     rotate: { x: -TAU/4 },
	//     color: white,
	//   });

	// }

	// makeWall({
	//   rotate: {},
	//   outside: white,
	//   inside: black,
	//   left: white,
	//   right: black,
	// });

	// makeWall({
	//   rotate: { y: -TAU/4 },
	//   outside: black,
	//   inside: white,
	//   left: white,
	//   right: black,
	// });

	// makeWall({
	//   rotate: { y: -TAU/2 },
	//   outside: black,
	//   inside: white,
	//   left: black,
	//   right: white,
	// });

	// makeWall({
	//   rotate: { y: TAU * -3/4 },
	//   outside: white,
	//   inside: black,
	//   left: black,
	//   right: white,
	// });


	// // -- animate --- //

	// var ticker = 0;
	// var cycleCount = 105;

	// var keyframes = [
	//   { x: TAU * 0,       y: TAU * 1/4 },
	//   { x: TAU * -35/360, y: TAU * 5/8 },
	//   { x: TAU * -1/4,    y: TAU * 3/4 },
	//   { x: TAU * -35/360, y: TAU * 9/8 },
	//   { x: TAU * 0,       y: TAU * 5/4 },
	// ];

	// function animate() {
	//   // update
	//   if ( isSpinning ) {
	//     var progress = ticker / cycleCount;
	//     var tween = Zdog.easeInOut( progress % 1, 4 );
	//     var turnLimit = keyframes.length - 1;
	//     var turn = Math.floor( progress % turnLimit );
	//     var keyA = keyframes[ turn ];
	//     var keyB = keyframes[ turn + 1 ];
	//     illo.rotate.x = Zdog.lerp( keyA.x, keyB.x, tween );
	//     illo.rotate.y = Zdog.lerp( keyA.y, keyB.y, tween );
	//     ticker++;
	//   }

	//   illo.updateRenderGraph();
	//   requestAnimationFrame( animate );
	// }

	// animate();
}, false);