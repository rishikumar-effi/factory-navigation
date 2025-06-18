import { CELL_SIZE } from "../components/LeafletCanvas";

interface WallCoordinate {
  latlngs: [number, number][];
  type: string;
  id: string;
}

interface ProductCoordinate {
  lat: number;
  lng: number;
}

interface Product {
  id: string;
  type: string;
  latlngs: ProductCoordinate[][];
  productId: string;
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface GridPosition {
  x: number;
  y: number;
}

interface CoordinatePosition {
  lat: number;
  lng: number;
}

interface GridInfo {
  width: number;
  height: number;
  gridSize: number;
  bounds: Bounds;
  totalCells: number;
}

interface NearestEmptyCell extends GridPosition {
  distance: number;
}

interface ConversionResult {
  grid: number[][];
  info: GridInfo;
  converter: CoordinateToGridConverter;
}

class CoordinateToGridConverter {
  private walls: WallCoordinate[];
  private products: Product[];
  private gridSize: number;
  private bounds: Bounds;
  public gridWidth: number;
  public gridHeight: number;

  private static readonly MAX_GRID_SIZE = 10000;
  private static readonly MIN_GRID_SIZE = 1;

  constructor(walls: WallCoordinate[], products: Product[], gridSize: number = CELL_SIZE) {
    this.walls = walls || [];
    this.products = products || [];
    this.gridSize = Math.max(gridSize, 0.1);
    
    this.bounds = this.calculateBounds();
    this.validateBounds();
    
    this.gridWidth = Math.ceil((this.bounds.maxLng - this.bounds.minLng) / this.gridSize);
    this.gridHeight = Math.ceil((this.bounds.maxLat - this.bounds.minLat) / this.gridSize);
    
    this.validateGridDimensions();
  }

  private validateBounds(): void {
    if (!isFinite(this.bounds.minLat) || !isFinite(this.bounds.maxLat) ||
        !isFinite(this.bounds.minLng) || !isFinite(this.bounds.maxLng)) {
      throw new Error('Invalid bounds: contains non-finite values');
    }

    if (this.bounds.maxLat <= this.bounds.minLat || this.bounds.maxLng <= this.bounds.minLng) {
      throw new Error('Invalid bounds: max values must be greater than min values');
    }

    const latRange = this.bounds.maxLat - this.bounds.minLat;
    const lngRange = this.bounds.maxLng - this.bounds.minLng;

    if (latRange > 1000 || lngRange > 1000) {
      console.warn('Very large coordinate range detected. Consider using a larger grid size.');
    }
  }

  private validateGridDimensions(): void {
    if (this.gridWidth <= 0 || this.gridHeight <= 0) {
      throw new Error(`Invalid grid dimensions: ${this.gridWidth}x${this.gridHeight}`);
    }

    if (this.gridWidth > CoordinateToGridConverter.MAX_GRID_SIZE || 
        this.gridHeight > CoordinateToGridConverter.MAX_GRID_SIZE) {
      throw new Error(`Grid too large: ${this.gridWidth}x${this.gridHeight}. Maximum allowed: ${CoordinateToGridConverter.MAX_GRID_SIZE}x${CoordinateToGridConverter.MAX_GRID_SIZE}`);
    }

    const totalCells = this.gridWidth * this.gridHeight;
    if (totalCells > CoordinateToGridConverter.MAX_GRID_SIZE * CoordinateToGridConverter.MAX_GRID_SIZE) {
      throw new Error(`Grid too large: ${totalCells} total cells. Consider increasing grid size parameter.`);
    }
  }

  private calculateBounds(): Bounds {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    let hasData = false;

    this.walls.forEach(wall => {
      if (wall.latlngs && Array.isArray(wall.latlngs)) {
        wall.latlngs.forEach(coord => {
          if (Array.isArray(coord) && coord.length >= 2) {
            const [lat, lng] = coord;
            if (isFinite(lat) && isFinite(lng)) {
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
              hasData = true;
            }
          }
        });
      }
    });

    this.products.forEach(product => {
      if (product.latlngs && Array.isArray(product.latlngs)) {
        product.latlngs.forEach(section => {
          if (Array.isArray(section)) {
            section.forEach(coord => {
              if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' &&
                  isFinite(coord.lat) && isFinite(coord.lng)) {
                minLat = Math.min(minLat, coord.lat);
                maxLat = Math.max(maxLat, coord.lat);
                minLng = Math.min(minLng, coord.lng);
                maxLng = Math.max(maxLng, coord.lng);
                hasData = true;
              }
            });
          }
        });
      }
    });

    if (!hasData) {
      console.warn('No valid coordinate data found, using default bounds');
      return { minLat: 0, maxLat: 100, minLng: 0, maxLng: 100 };
    }

    const padding = Math.max(this.gridSize, 1);
    return { 
      minLat: minLat - padding, 
      maxLat: maxLat + padding, 
      minLng: minLng - padding, 
      maxLng: maxLng + padding 
    };
  }

  public coordToGrid(lat: number, lng: number): GridPosition {
    if (!isFinite(lat) || !isFinite(lng)) {
      throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
    }

    const gridX = Math.floor((lng - this.bounds.minLng) / this.gridSize);
    const gridY = Math.floor((lat - this.bounds.minLat) / this.gridSize);
    
    const clampedX = Math.max(0, Math.min(gridX, this.gridWidth - 1));
    const clampedY = Math.max(0, Math.min(gridY, this.gridHeight - 1));
    
    return { x: clampedX, y: clampedY };
  }

  public gridToCoord(gridX: number, gridY: number): CoordinatePosition {
    if (!isFinite(gridX) || !isFinite(gridY)) {
      throw new Error(`Invalid grid position: x=${gridX}, y=${gridY}`);
    }

    // const lng = this.bounds.minLng + (gridX * this.gridSize) + (this.gridSize / 2);
    // const lat = this.bounds.minLat + (gridY * this.gridSize) + (this.gridSize / 2);

    const lng = this.bounds.minLng + (gridX * this.gridSize);
    const lat = this.bounds.minLat + (gridY * this.gridSize);
    return { lat, lng };
  }

  public gridToCoordinate(gridX: number, gridY: number): CoordinatePosition {
    return this.gridToCoord(gridX, gridY);
  }
 
  public coordinateToGrid(lat: number, lng: number): GridPosition {
    return this.coordToGrid(lat, lng);
  }

  private fillRectangleInGrid(grid: number[][], corners: ProductCoordinate[], value: number): void {
    if (!corners || corners.length === 0) return;

    const validCorners = corners.filter(corner => 
      corner && isFinite(corner.lat) && isFinite(corner.lng)
    );

    if (validCorners.length === 0) return;

    const lats = validCorners.map(corner => corner.lat);
    const lngs = validCorners.map(corner => corner.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    try {
      const startGrid = this.coordToGrid(minLat, minLng);
      const endGrid = this.coordToGrid(maxLat, maxLng);

      for (let y = startGrid.y; y <= endGrid.y; y++) {
        for (let x = startGrid.x; x <= endGrid.x; x++) {
          if (y >= 0 && y < this.gridHeight && x >= 0 && x < this.gridWidth) {
            grid[y][x] = value;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fill rectangle in grid:', error);
    }
  }

  private fillWallInGrid(grid: number[][], wallCoords: [number, number][], value: number): void {
    if (!wallCoords || wallCoords.length < 2) return;

    try {
      const [[lat1, lng1], [lat2, lng2]] = wallCoords;
      
      if (!isFinite(lat1) || !isFinite(lng1) || !isFinite(lat2) || !isFinite(lng2)) {
        console.warn('Invalid wall coordinates:', wallCoords);
        return;
      }

      const corners: ProductCoordinate[] = [
        { lat: lat1, lng: lng1 },
        { lat: lat1, lng: lng2 },
        { lat: lat2, lng: lng2 },
        { lat: lat2, lng: lng1 }
      ];
      this.fillRectangleInGrid(grid, corners, value);
    } catch (error) {
      console.warn('Failed to fill wall in grid:', error);
    }
  }

  public generateGrid(): number[][] {
    try {
      if (this.gridHeight <= 0 || this.gridWidth <= 0) {
        throw new Error(`Invalid grid dimensions: ${this.gridHeight}x${this.gridWidth}`);
      }

      const grid: number[][] = [];
      for (let i = 0; i < this.gridHeight; i++) {
        const row = new Array(this.gridWidth).fill(0);
        grid.push(row);
      }

      this.walls.forEach((wall, index) => {
        try {
          if (wall && wall.latlngs) {
            this.fillWallInGrid(grid, wall.latlngs, 1);
          }
        } catch (error) {
          console.warn(`Failed to process wall ${index}:`, error);
        }
      });

      this.products.forEach((product, index) => {
        try {
          if (product && product.latlngs && product.productId) {
            const productValue = parseInt(product.productId) || (999 + index);

            product.latlngs.forEach(section => {
              if (Array.isArray(section)) {
                this.fillRectangleInGrid(grid, section, productValue);
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to process product ${index}:`, error);
        }
      });

      return grid;
    } catch (error) {
      console.error('Error generating grid:', error);
      throw error;
    }
  }

  public getGridInfo(): GridInfo {
    return {
      width: this.gridWidth,
      height: this.gridHeight,
      gridSize: this.gridSize,
      bounds: this.bounds,
      totalCells: this.gridWidth * this.gridHeight
    };
  }

  public findNearestEmptyCell(targetLat: number, targetLng: number, grid: number[][]): NearestEmptyCell | null {
    try {
      const targetGrid = this.coordToGrid(targetLat, targetLng);
      const queue: Array<{ x: number; y: number; distance: number }> = [
        { x: targetGrid.x, y: targetGrid.y, distance: 0 }
      ];
      const visited = new Set<string>();
      const maxDistance = Math.max(this.gridWidth, this.gridHeight);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const { x, y, distance } = current;
        
        if (distance > maxDistance) break;
        
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
          if (grid[y] && grid[y][x] === 0) {
            return { x, y, distance };
          }
        }

        const neighbors = [
          { x: x + 1, y, distance: distance + 1 },
          { x: x - 1, y, distance: distance + 1 },
          { x, y: y + 1, distance: distance + 1 },
          { x, y: y - 1, distance: distance + 1 }
        ];

        queue.push(...neighbors);
      }

      return null;
    } catch (error) {
      console.warn('Error finding nearest empty cell:', error);
      return null;
    }
  }

  public static convertToGrid(
    walls: WallCoordinate[], 
    products: Product[], 
    gridSize: number = 10
  ): ConversionResult {
    try {
      if (!Array.isArray(walls)) walls = [];
      if (!Array.isArray(products)) products = [];
      if (!isFinite(gridSize) || gridSize <= 0) gridSize = 10;

      const converter = new CoordinateToGridConverter(walls, products, gridSize);
      const grid = converter.generateGrid();
      const info = converter.getGridInfo();
      
      console.log('Grid generated successfully:', {
        dimensions: `${info.width}x${info.height}`,
        totalCells: info.totalCells,
        bounds: info.bounds
      });
      
      return {
        grid,
        info,
        converter
      };
    } catch (error) {
      console.error('Error in convertToGrid:', error);
      throw error;
    }
  }
}

export {
  CoordinateToGridConverter,
  type WallCoordinate,
  type Product,
  type GridPosition,
  type CoordinatePosition,
  type GridInfo,
  type ConversionResult
};