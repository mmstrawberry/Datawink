type Point = {
    x: number;
    y: number;
};


export function parsePathData(d: string): Point[] {
    const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [] as Array<string>;
    const points: Point[] = [];
    let currentPoint: Point = { x: 0, y: 0 }; // Track the current position for relative commands
    const isValidNumber = (val: number | undefined) => typeof val === "number" && Number.isFinite(val);
    const pushPoint = (x: number | undefined, y: number | undefined) => {
        if (!isValidNumber(x) || !isValidNumber(y)) return;
        const point = { x, y };
        points.push(point);
        currentPoint = point;
    };

    commands.forEach(command => {
        const type = command[0].toUpperCase(); // The command type (M, L, C, etc.)
        const coords = command
            .slice(1)
            .trim()
            .split(/[\s,]+/)
            .map(Number)
            .filter((value) => Number.isFinite(value));

        switch (type) {
            case 'M': // Move to (absolute)
            case 'L': // Line to (absolute)
                for (let i = 0; i < coords.length; i += 2) {
                    pushPoint(coords[i], coords[i + 1]);
                }
                break;

            case 'H': // Horizontal line to (absolute)
                coords.forEach(x => {
                    pushPoint(x, currentPoint.y);
                });
                break;

            case 'V': // Vertical line to (absolute)
                coords.forEach(y => {
                    pushPoint(currentPoint.x, y);
                });
                break;

            case 'C': // Cubic Bézier curve (absolute)
                for (let i = 0; i < coords.length; i += 6) {
                    pushPoint(coords[i], coords[i + 1]);
                    pushPoint(coords[i + 2], coords[i + 3]);
                    pushPoint(coords[i + 4], coords[i + 5]);
                }
                break;

            case 'Q': // Quadratic Bézier curve (absolute)
                for (let i = 0; i < coords.length; i += 4) {
                    pushPoint(coords[i], coords[i + 1]);
                    pushPoint(coords[i + 2], coords[i + 3]);
                }
                break;

            case 'T': // Shorthand quadratic Bézier curve (absolute)
                for (let i = 0; i < coords.length; i += 2) {
                    pushPoint(coords[i], coords[i + 1]);
                }
                break;

            case 'A': // Elliptical arc (absolute)
                for (let i = 0; i < coords.length; i += 7) {
                    pushPoint(coords[i + 5], coords[i + 6]);
                }
                break;

            case 'Z': // Close path
                // Z has no coordinates; it just closes the current path.
                break;

            default:
                console.warn(`Unsupported command: ${type}`);
        }
    });

    return points;
}


export function roundPathD (d: string, decimalPlaces: number = 2):string {
    const commands = d.match(/[MLCZHVQTSA][^MLCZHVQTSA]*/g) || [];    // Process each command
    const roundedCommands = commands.map(command => {
        const type = command[0];
        const coords = command
            .slice(1)
            .trim()
            .split(/[\s,]+/) 
            .map(Number) 
            .map(coord => {
                if (isNaN(coord)) return 'NaN'; 
                return coord % 1 === 0 ? String(coord) : coord.toFixed(decimalPlaces); 
            })
            .join(','); // Join back with commas

        return `${type} ${coords}`.trim(); // Reconstruct command
    });

    return roundedCommands.join(' ');
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
    const l2 = (end.x - start.x) ** 2 + (end.y - start.y) ** 2; // length squared
    if (l2 === 0) return Math.hypot(point.x - start.x, point.y - start.y); // start and end are the same
    const t = ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / l2;
    if (t < 0) return Math.hypot(point.x - start.x, point.y - start.y);
    if (t > 1) return Math.hypot(point.x - end.x, point.y - end.y);
    const projection: Point = { x: start.x + t * (end.x - start.x), y: start.y + t * (end.y - start.y) };
    return Math.hypot(point.x - projection.x, point.y - projection.y);
}

/**
 * Simplify the path data using the Douglas-Peucker algorithm
 * @param points the points of the path
 * @param epsilon the tolerance for simplification
 * @returns the simplified path data
 */
function douglasPeucker(points: Point[], epsilon: number): Point[] {
    const first = points[0];
    const last = points[points.length - 1];
    
    let maxDistance = 0;
    let index = -1;

    for (let i = 1; i < points.length - 1; i++) {
        const distance = distanceToSegment(points[i], first, last);
        if (distance > maxDistance) {
            maxDistance = distance;
            index = i;
        }
    }

    if (maxDistance > epsilon) {
        const left = douglasPeucker(points.slice(0, index + 1), epsilon);
        const right = douglasPeucker(points.slice(index), epsilon);
        return left.slice(0, left.length - 1).concat(right);
    } else {
        return [first, last];
    }
}

export const decimalFormatPathData = (points: Point[], d: string): string => {
    const numberRegex = /-?\d+(\.\d+)?/g;
    let pointIndex = 0;
    const formattedPath = d.replace(numberRegex, () => {
        if (pointIndex < points.length) {
            const point = points[pointIndex];
            pointIndex++;
            const x = isNaN(point.x) ? "NaN" : point.x.toFixed(2);
            const y = isNaN(point.y) ? "NaN" : point.y.toFixed(2);

            return `${x},${y}`;
        }
        return ''; 
    });
    return formattedPath;
};


function formatToPathData(points: Point[]): string {
    const safePoints = points.filter((point) =>
        point &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y)
    );
    if (safePoints.length === 0) return "";
    return safePoints.map((point, index) => {
        return index === 0 ? `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}` : `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    }).join(' ');
}

function computeDynamicEpsilon(points: Point[], fraction: number = 0.1): number {
    if (points.length < 2) return 0; // Not enough points to calculate epsilon
    
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    // Calculate the bounding box
    points.forEach(point => {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
    });

    const width = maxX - minX;
    const height = maxY - minY;

    // Determine the range and compute epsilon
    const range = Math.sqrt(width ** 2 + height ** 2); // Diagonal length
    return range * fraction; // Epsilon as a fraction of the range
}

/**
 * Simplify the <path> d-attribue using the Douglas-Peucker algorithm
 * @param points the points of the path
 * @param epsilon the tolerance for simplification
 * @returns the simplified path data
 */
export const simplifyPath = (points: Point[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) {
        return formatToPathData(points);
    }
    const epsilon = computeDynamicEpsilon(points, 0.1); // 10% of the range
    const simplifiedPoints = douglasPeucker(points, epsilon);
    return formatToPathData(simplifiedPoints);
}



export const testSimplifyPath = () => {
    // Example usage
    const originalD = "M10 10 L20 20 L30 10 L40 40 L50 30"; // Example path
    const points = parsePathData(originalD);
    const simplifiedD = simplifyPath(points);
    console.log(simplifiedD);
}