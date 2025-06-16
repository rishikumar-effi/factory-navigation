class PathFinder {
  constructor() {
    this.grid = null;
  }

  setGrid(grid) {
    this.grid = grid.map(
      (row) => row.map((cell) => {
        return (cell === 0 ? 1 : 0)
      })
    );
    console.log(this.grid);
  }

  findPath(startX, startY, endX, endY) {
    if (!this.grid) return [];

    const rows = this.grid.length;
    const cols = this.grid[0].length;

    // Validate coordinates
    if (
      startX < 0 ||
      startX >= rows ||
      startY < 0 ||
      startY >= cols ||
      endX < 0 ||
      endX >= rows ||
      endY < 0 ||
      endY >= cols
    ) {
      return [];
    }

    // Check if start and end are walkable
    if (this.grid[startX][startY] === 0 || this.grid[endX][endY] === 0) {
      return [];
    }

    return this.aStar(startX, startY, endX, endY);
  }

  aStar(startX, startY, endX, endY) {
    const openList = [];
    const closedList = new Set();
    const nodes = {};

    const getNodeKey = (x, y) => `${x},${y}`;
    const heuristic = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

    const startNode = {
      x: startX,
      y: startY,
      g: 0,
      h: heuristic(startX, startY, endX, endY),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;

    openList.push(startNode);
    nodes[getNodeKey(startX, startY)] = startNode;

    while (openList.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openList.splice(currentIndex, 1)[0];
      closedList.add(getNodeKey(current.x, current.y));

      // Found the goal
      if (current.x === endX && current.y === endY) {
        const path = [];
        let node = current;
        while (node) {
          path.unshift([node.x, node.y]);
          node = node.parent;
        }
        return path;
      }

      // Check neighbors (up, down, left, right)
      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
      ];

      for (const neighbor of neighbors) {
        const { x, y } = neighbor;
        const key = getNodeKey(x, y);

        // Skip if out of bounds, obstacle, or already processed
        if (
          x < 0 ||
          x >= this.grid.length ||
          y < 0 ||
          y >= this.grid[0].length ||
          this.grid[x][y] === 0 ||
          closedList.has(key)
        ) {
          continue;
        }

        const g = current.g + 1;
        const h = heuristic(x, y, endX, endY);
        const f = g + h;

        // If this path to neighbor is better than any previous one
        if (!nodes[key] || g < nodes[key].g) {
          const neighborNode = {
            x,
            y,
            g,
            h,
            f,
            parent: current,
          };

          nodes[key] = neighborNode;

          // Add to open list if not already there
          if (!openList.find((node) => node.x === x && node.y === y)) {
            openList.push(neighborNode);
          }
        }
      }
    }

    return []; // No path found
  }
}

export default PathFinder;
