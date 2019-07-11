import Snap from 'snapsvg-cjs';

const convertToBezier = pathString => {
  // Snap SVG method to create a set of cubic bezier curves from the path string
  const newPath = Snap.path.toCubic(pathString);
  const arrayPath = [];

  const setUpPoint = segment => {
    // using +=2 in the loop thanks to GSAP's Geek Ambassador, animation superhero Carl Schooff :D
    for (let i = 0; i < segment.length; i += 2) {
      // create a new object for the point so it can be passed into the bezier plugin
      const point = {};

      point.x = segment[i];
      point.y = segment[i + 1];

      // add the point to the array
      arrayPath.push(point);
    }
  };
  // loop through the curves collection
  for (let i = 0; i < newPath.length; i++) {
    const segment = newPath[i];

    // the first element returned in the array is a letter, quite useless for the bezier Plugin, so we remove it
    segment.shift();

    // call the function to set up the points based on the segment returned
    setUpPoint(segment);
  }
  return arrayPath;
};

export default convertToBezier;
