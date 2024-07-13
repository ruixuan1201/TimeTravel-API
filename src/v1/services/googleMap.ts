import { IMatrixDistance } from '../entities/dispatcher';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const distance = require('google-distance-matrix');

export const getDistance = (startPos: string[], endPos: string[], callback: (distance: IMatrixDistance) => any) => {
  distance.key(process.env.GOOGLE_MAP_API_KEY);
  distance.matrix(startPos, endPos, async (err: any, distances: IMatrixDistance) => {
    if (!err) {
      callback(distances);
    }
  });
};
