import { decimalFormatPathData, parsePathData, roundPathD, simplifyPath } from "./path-processing";

const ID_ALIAS = 'wid' // unique identifier for each SVG element

const removeAttributes = (svgStr: string) => {
    return svgStr
}

const setDecimalPlaces = (valStr: string, numDecimals: number = 1) => {
    if (valStr.includes('NaN')) return valStr
    if (valStr.includes('%')) return valStr
    const val = parseFloat(valStr)
    if (Number.isInteger(val)) return val.toString() 
    return val.toFixed(numDecimals);
}

/** Parse SVG polygon/polyline points (numbers separated by commas and/or whitespace). */
const parseSvgPointsList = (points: string): number[] =>
    points
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(parseFloat)
        .filter((n) => !Number.isNaN(n));

const formatSvgPointsList = (coords: number[]): string =>
    coords.map((n) => setDecimalPlaces(String(n))).join(" ");

// Phase I Module 1: Identity Assignment
/**
 * Add an identifier to each element in the SVG for binding key information
 * @param svgStr the SVG string
 * @returns the SVG string with identifiers
 */
const addIdentifier = (svgStr: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, "image/svg+xml");
    const elements = doc.getElementsByTagName("*");
    let id = 0;
    Array.from(elements).forEach((element) => {
        id++;
        element.setAttribute(ID_ALIAS, id.toString());
    });
    return doc.documentElement.outerHTML;
}


// Phase I Module 2: Noise Reduction
const tidySvgWithHeuristics = (svgStr: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, "image/svg+xml");

    const styles = doc.getElementsByTagName("style");
    Array.from(styles).forEach((style) => {
        style.remove();
    });


    const defs = doc.getElementsByTagName("defs");
    Array.from(defs).forEach((def) => {
        const children = def.getElementsByTagName("*");
        Array.from(children).forEach((child) => {
            if (child.tagName === 'clipPath') return 
                const grandChildren = child.getElementsByTagName("*");
                Array.from(grandChildren).forEach((grandChild) => {
                    grandChild.remove();
                });
        });
    });

    const all = doc.getElementsByTagName("*");

    Array.from(all).forEach((ele) => {
        // if transform exist
        const transform = ele.getAttribute("transform");
        if (!transform) return
        if (transform.includes('translate')) {
            const translate = transform.split('translate(')[1].split(')')[0];
            const translateVals = translate.split(',').map((v) => setDecimalPlaces(v));
            const newTransform = `translate(${translateVals.join(',')})`
            ele.setAttribute("transform", newTransform);
        } else if (transform.includes('matrix')) {
            const matrixValStr = transform.split('(')[1].split(')')[0];
            const matrixVals = matrixValStr.split(',').map((v) => setDecimalPlaces(v));
            const newTransform = `matrix(${matrixVals.join(',')})`
            ele.setAttribute("transform", newTransform);
        }
    });

    const paths = doc.getElementsByTagName("path");
    Array.from(paths).forEach((path) => {
        const points = parsePathData(path.getAttribute("d") || "");
        // Heuristic: when the path has more than 50 points, simplify it
       if (points.length > 50 ) {
           path.setAttribute("d", simplifyPath(points));
       } else {
           path.setAttribute("d", roundPathD(path.getAttribute("d") || "",1));
       }
    });

    const circles = doc.getElementsByTagName("circle");
    Array.from(circles).forEach((circle) => {
        circle.setAttribute("cx", setDecimalPlaces(circle.getAttribute("cx") || "0"));
        circle.setAttribute("cy", setDecimalPlaces(circle.getAttribute("cy") || "0"));
        circle.setAttribute("r", setDecimalPlaces(circle.getAttribute("r") || "0"));  
    });

    const rects = doc.getElementsByTagName("rect");
    Array.from(rects).forEach((rect) => {
        rect.setAttribute("x", setDecimalPlaces(rect.getAttribute("x") || "0"));
        rect.setAttribute("y", setDecimalPlaces(rect.getAttribute("y") || "0"));
        rect.setAttribute("width", setDecimalPlaces(rect.getAttribute("width") || "0"));
        rect.setAttribute("height", setDecimalPlaces(rect.getAttribute("height") || "0"));
    });

    const lines = doc.getElementsByTagName("line");
    Array.from(lines).forEach((line) => {
        line.setAttribute("x1", setDecimalPlaces(line.getAttribute("x1") || "0"));
        line.setAttribute("y1", setDecimalPlaces(line.getAttribute("y1") || "0"));
        line.setAttribute("x2", setDecimalPlaces(line.getAttribute("x2") || "0"));
        line.setAttribute("y2", setDecimalPlaces(line.getAttribute("y2") || "0"));
    });

    const polygons = doc.getElementsByTagName("polygon");
    Array.from(polygons).forEach((polygon) => {
        const points = polygon.getAttribute("points") || "";
        polygon.setAttribute("points", formatSvgPointsList(parseSvgPointsList(points)));
    });

    const polylines = doc.getElementsByTagName("polyline");
    Array.from(polylines).forEach((polyline) => {
        const points = polyline.getAttribute("points") || "";
        polyline.setAttribute("points", formatSvgPointsList(parseSvgPointsList(points)));
    });

    const ellipses = doc.getElementsByTagName("ellipse");
    Array.from(ellipses).forEach((ellipse) => {
        ellipse.setAttribute("cx", setDecimalPlaces(ellipse.getAttribute("cx") || "0"));
        ellipse.setAttribute("cy", setDecimalPlaces(ellipse.getAttribute("cy") || "0"));
        ellipse.setAttribute("rx", setDecimalPlaces(ellipse.getAttribute("rx") || "0"));
        ellipse.setAttribute("ry", setDecimalPlaces(ellipse.getAttribute("ry") || "0"));
    });

    const serializer = new XMLSerializer();
    const processedSvgStr = serializer.serializeToString(doc);
    console.log(`Tidy SVG from ${svgStr.length} to ${processedSvgStr.length}`)
    console.log(processedSvgStr, 'debug')
    return processedSvgStr;
}

/** Map a defs child in the layered SVG to the same node in the original (uploaded) SVG. */
const findCorrespondingSourceNode = (srcDoc: Document, child: Element): Element | null => {
    const wid = child.getAttribute(ID_ALIAS);
    if (wid) {
        const byWid = srcDoc.querySelector(`[${ID_ALIAS}="${wid}"]`);
        if (byWid) return byWid as Element;
    }
    const local = child.localName?.toLowerCase() ?? "";
    if (local === "lineargradient" || local === "radialgradient") {
        const gid = child.getAttribute("id");
        if (gid) {
            const byId = srcDoc.getElementById(gid);
            if (byId) return byId;
        }
    }
    return null;
};

/** Reverse the SVG into a full version after preprocessing */
const reverseSvg = (source: string, target: string) => {
    const parser = new DOMParser();
    const srcDoc = parser.parseFromString(source, "image/svg+xml");
    const targetDoc = parser.parseFromString(target, "image/svg+xml");

    const defs = targetDoc.getElementsByTagName("defs");
    Array.from(defs).forEach((def) => {
        // Direct children only — avoids re-processing <stop> etc. after replacing <linearGradient>,
        // and matches how LLM usually hollows gradients while keeping the parent tag.
        const children = Array.from(def.children) as Element[];
        children.forEach((child) => {
            if (child.localName?.toLowerCase() === "clippath") return;
            const corres = findCorrespondingSourceNode(srcDoc, child);
            if (!corres || !child.parentNode) return;
            const imported = targetDoc.importNode(corres, true);
            child.parentNode.replaceChild(imported, child);
        });
    });

    const paths = targetDoc.getElementsByTagName("path");
    Array.from(paths).forEach((path) => {
        const id = path.getAttribute(ID_ALIAS);
        path.removeAttribute("xmlns");
        const srcPath = srcDoc.querySelector(`[${ID_ALIAS}="${id}"]`);
        if (srcPath) {
            path.setAttribute("d", srcPath.getAttribute("d") || "");
        }
    });

    const circles = targetDoc.getElementsByTagName("circle");
    Array.from(circles).forEach((circle) => {
        const id = circle.getAttribute(ID_ALIAS);
        const srcCircle = srcDoc.querySelector(`[${ID_ALIAS}="${id}"]`);
        if (srcCircle) {
            circle.setAttribute("cx", srcCircle.getAttribute("cx") || "");  
            circle.setAttribute("cy", srcCircle.getAttribute("cy") || "");
            circle.setAttribute("r", srcCircle.getAttribute("r") || "");
        }
    });

    const lines = targetDoc.getElementsByTagName("line");
    Array.from(lines).forEach((line) => {
        const id = line.getAttribute(ID_ALIAS);
        const srcLine = srcDoc.querySelector(`[${ID_ALIAS}="${id}"]`);
        if (srcLine) {
            line.setAttribute("x1", srcLine.getAttribute("x1") || "");
            line.setAttribute("y1", srcLine.getAttribute("y1") || "");
            line.setAttribute("x2", srcLine.getAttribute("x2") || "");
            line.setAttribute("y2", srcLine.getAttribute("y2") || "");
        }
    }); 

    const rects = targetDoc.getElementsByTagName("rect");
    Array.from(rects).forEach((rect) => {
        const id = rect.getAttribute(ID_ALIAS);
        const srcRect = srcDoc.querySelector(`[${ID_ALIAS}="${id}"]`);
        if (srcRect) {
            rect.setAttribute("x", srcRect.getAttribute("x") || "");    
            rect.setAttribute("y", srcRect.getAttribute("y") || "");
            rect.setAttribute("width", srcRect.getAttribute("width") || "");
            rect.setAttribute("height", srcRect.getAttribute("height") || "");
        }
    });

    const polygons = targetDoc.getElementsByTagName("polygon");
    Array.from(polygons).forEach((polygon) => {
        const id = polygon.getAttribute(ID_ALIAS);
        const srcPolygon = srcDoc.querySelector(`[${ID_ALIAS}="${id}"]`);
        if (srcPolygon) {
            polygon.setAttribute("points", srcPolygon.getAttribute("points") || "");    
        }
    });

    const polylines = targetDoc.getElementsByTagName("polyline");
    Array.from(polylines).forEach((polyline) => {
        const id = polyline.getAttribute(ID_ALIAS);
        const srcPolyline = srcDoc.querySelector(`[${ID_ALIAS}="${id}"]`);  
        if (srcPolyline) {
            polyline.setAttribute("points", srcPolyline.getAttribute("points") || "");
        }
    });

    const ellipses = targetDoc.getElementsByTagName("ellipse");
    Array.from(ellipses).forEach((ellipse) => {
        const id = ellipse.getAttribute(ID_ALIAS);
        const srcEllipse = srcDoc.querySelector(`[${ID_ALIAS}="${id}"]`);
        if (srcEllipse) {
            ellipse.setAttribute("cx", srcEllipse.getAttribute("cx") || "");
            ellipse.setAttribute("cy", srcEllipse.getAttribute("cy") || "");
            ellipse.setAttribute("rx", srcEllipse.getAttribute("rx") || "");
            ellipse.setAttribute("ry", srcEllipse.getAttribute("ry") || "");
        }   
    });

    const srcStyles = srcDoc.getElementsByTagName("style");
    Array.from(srcStyles).forEach((style) => {
        targetDoc.insertBefore(style, targetDoc.firstChild);
    });

    const targetElements = targetDoc.getElementsByTagName("*");
    Array.from(targetElements).forEach((element) => {
        element.removeAttribute(ID_ALIAS);
    });

    return targetDoc.documentElement.outerHTML;
}

const getSvgWithSimplifiedPath = (svgStr: string, aggregateFlag: boolean = false) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, "image/svg+xml");
    const paths = doc.getElementsByTagName("path");
    Array.from(paths).forEach((path) => {
        const points = parsePathData(path.getAttribute("d") || "");
         // Heuristic: when the path has more than 50 points, simplify it
        if (points.length > 50 && (!aggregateFlag)) {
            path.setAttribute("d", simplifyPath(points));
        } else {
            path.setAttribute("d", roundPathD(path.getAttribute("d") || "", 2));
        }
    });
    return doc.documentElement.outerHTML;
}


/**
 * Get the rendered SVG bitmap image data URL
 * @async
 * @param svgStr the SVG string
 * @param plotId the id of the plot, default is "plotCanvas"
 * @returns the rendered SVG image data URL
 */
const getRenderedSvg = async (svgStr: string, plotId: string): Promise<string> => {
    const normalizeSvgNamespaces = (rawSvg: string) => {
        let normalized = rawSvg;
        // Prefer SVG2 href and keep backward compatibility for older templates.
        normalized = normalized.replace(/\bxlink:href=/g, "href=");

        const hasSvgTag = /<svg\b[^>]*>/i.test(normalized);
        if (!hasSvgTag) return normalized;

        const usesXlinkPrefix = /\bxlink:/.test(normalized);
        normalized = normalized.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
            let nextAttrs = attrs;
            if (!/\bxmlns=/.test(nextAttrs)) {
                nextAttrs += ` xmlns="http://www.w3.org/2000/svg"`;
            }
            if (usesXlinkPrefix && !/\bxmlns:xlink=/.test(nextAttrs)) {
                nextAttrs += ` xmlns:xlink="http://www.w3.org/1999/xlink"`;
            }
            return `<svg${nextAttrs}>`;
        });
        return normalized;
    };

    const normalizedSvgStr = normalizeSvgNamespaces(svgStr);

    // First load all external images in the SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(normalizedSvgStr, 'image/svg+xml');
    const images = Array.from(svgDoc.querySelectorAll('image'));
    
    // Collect concise failure reasons for runtime errors.
    const failureReasons: string[] = [];

    const xmlParserErrors = svgDoc.getElementsByTagName("parsererror");
    if (xmlParserErrors.length > 0) {
        const parserErrorDetails = Array.from(xmlParserErrors).map((node, index) => {
            const raw = (node.textContent || node.innerHTML || "").replace(/\s+/g, " ").trim();
            return `parsererror[${index}]: ${raw}`;
        });
        failureReasons.push("SVG XML parser error detected");
        failureReasons.push(...parserErrorDetails);
        console.error("SVG XML parser errors:", parserErrorDetails);
    }

    const toDataUrl = (blob: Blob) =>
        new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });

    const resolveImageUrl = (href: string) => {
        try {
            return new URL(href, window.location.href).toString();
        } catch {
            return href;
        }
    };

    // Load all referenced images first (absolute, relative, and remote)
    await Promise.all(images.map(async (img) => {
        const href = img.getAttribute('href') || img.getAttribute('xlink:href');
        if (href && !href.startsWith('data:') && !href.startsWith('#')) {
            const imageUrl = resolveImageUrl(href);
            try {
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const blob = await response.blob();
                const dataUrl = await toDataUrl(blob);
                img.setAttribute('href', dataUrl);
                img.removeAttribute('xlink:href');
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                failureReasons.push(`Image fetch failed (${imageUrl}): ${errMsg}`);
                console.error('Failed to load image:', imageUrl, errMsg);
            }
        }
    }));

    // Convert back to string with embedded images
    const serializer = new XMLSerializer();
    const processedSvgStr = serializer.serializeToString(svgDoc);

    return new Promise((resolve, reject) => {
        const canvas = document.getElementById(plotId) as HTMLCanvasElement;
        canvas.setAttribute('opacity', '1')
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        const img = new Image();
        
        img.onload = () => {
            const targetWidth = 400;
            const scale = targetWidth / Math.max(1, img.width);
            const targetHeight = Math.max(1, Math.round(img.height * scale));

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            // Single-pass downscale to reduce text artifacts.
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            resolve(canvas.toDataURL("image/png"));
            canvas.setAttribute('opacity', '0')
        }; 
        img.onerror = (event) => {
            const reasonSummary = failureReasons.length > 0
                ? failureReasons.join(" | ")
                : "No upstream parser/fetch error captured";
            const renderError = new Error(`Failed to load SVG. Reasons: ${reasonSummary}`);
            console.error("SVG render failed", { plotId, reasons: failureReasons, onErrorEvent: event });
            reject(renderError);
        };
        img.src = 'data:image/svg+xml,' + encodeURIComponent(processedSvgStr);
    });
}

/**
 * Strip custom `datagroup` wrappers (LLM layering markers) by hoisting their
 * children to the parent, preserving order. Nested datagroups are unwrapped inside-out.
 */
const getStandardSvgStr = (svgStr: string): string => {
    // Match opening tags with attributes, e.g. <datagroup id="x"> (not only <datagroup>)
    if (!/<datagroup\b/i.test(svgStr)) return svgStr;
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, "image/svg+xml");
    const groups = Array.from(doc.getElementsByTagName("*")).filter(
        (el) => el.localName?.toLowerCase() === "datagroup"
    );
    for (let i = groups.length - 1; i >= 0; i--) {
        const group = groups[i];
        const parent = group.parentNode;
        if (!parent) continue;
        while (group.firstChild) {
            parent.insertBefore(group.firstChild, group);
        }
        parent.removeChild(group);
    }
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc.documentElement);
}

/**
 * Hoist children of each `<g vis-layer="...">` to the parent and remove the wrapper `<g>`.
 * Nested vis-layer groups are unwrapped inside-out.
 */
const flattenVisLayerGroups = (svgStr: string): string => {
    if (!/\bvis-layer\b/i.test(svgStr)) return svgStr;

    const trimmed = svgStr.trim();
    const isFragment = !/^<svg[\s>]/i.test(trimmed);
    const toParse = isFragment
        ? `<svg xmlns="http://www.w3.org/2000/svg">${trimmed}</svg>`
        : trimmed;

    const parser = new DOMParser();
    const doc = parser.parseFromString(toParse, "image/svg+xml");
    const groups = Array.from(doc.querySelectorAll("g[vis-layer]"));

    for (let i = groups.length - 1; i >= 0; i--) {
        const group = groups[i];
        const parent = group.parentNode;
        if (!parent) continue;
        while (group.firstChild) {
            parent.insertBefore(group.firstChild, group);
        }
        parent.removeChild(group);
    }

    const serializer = new XMLSerializer();
    if (isFragment) {
        return Array.from(doc.documentElement.childNodes)
            .map((node) => serializer.serializeToString(node))
            .join("");
    }
    return serializer.serializeToString(doc.documentElement);
}

const extractLayersFromName = (svgStr: string, matchStr: string="svg-layer=='chart'") => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, "image/svg+xml");
    const elements = doc.querySelectorAll(`[${matchStr}]`);
    const newEle = doc.querySelector(`[data-layer-id="${matchStr}"]`);
    if (newEle) {
        newEle.remove();
    }
    return elements
}
export {
    getRenderedSvg,
    addIdentifier,
    reverseSvg,
    removeAttributes,
    tidySvgWithHeuristics,
    getSvgWithSimplifiedPath,
    getStandardSvgStr,
    flattenVisLayerGroups,
    extractLayersFromName,
}