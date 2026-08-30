(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend-nextjs/components/WorkstationMap.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WorkstationMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend-nextjs/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend-nextjs/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend-nextjs/node_modules/leaflet/dist/leaflet-src.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function WorkstationMap({ center, zoom, baseMapType, showBBoxes, entities, onUpdate }) {
    _s();
    const mapContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapInstanceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const layerGroupRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const tileLayerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Initialize Map
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WorkstationMap.useEffect": ()=>{
            if (!mapContainerRef.current) return;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            const map = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].map(mapContainerRef.current, {
                center: center,
                zoom: zoom,
                zoomControl: true,
                attributionControl: false
            });
            const tileUrl = baseMapType === 'esri' ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            const tileLayer = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].tileLayer(tileUrl, {
                maxZoom: 19
            }).addTo(map);
            tileLayerRef.current = tileLayer;
            const layerGroup = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].layerGroup().addTo(map);
            layerGroupRef.current = layerGroup;
            // Track pan/zoom
            map.on('move', {
                "WorkstationMap.useEffect": ()=>{
                    const c = map.getCenter();
                    onUpdate(c.lat, c.lng, map.getZoom());
                }
            }["WorkstationMap.useEffect"]);
            map.on('zoomend', {
                "WorkstationMap.useEffect": ()=>{
                    const c = map.getCenter();
                    onUpdate(c.lat, c.lng, map.getZoom());
                }
            }["WorkstationMap.useEffect"]);
            mapInstanceRef.current = map;
            setTimeout({
                "WorkstationMap.useEffect": ()=>{
                    map.invalidateSize();
                }
            }["WorkstationMap.useEffect"], 150);
            return ({
                "WorkstationMap.useEffect": ()=>{
                    map.remove();
                    mapInstanceRef.current = null;
                }
            })["WorkstationMap.useEffect"];
        }
    }["WorkstationMap.useEffect"], []);
    // Update Base Layer (Satellite <-> Topo)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WorkstationMap.useEffect": ()=>{
            if (!mapInstanceRef.current || !tileLayerRef.current) return;
            const tileUrl = baseMapType === 'esri' ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            tileLayerRef.current.setUrl(tileUrl);
        }
    }["WorkstationMap.useEffect"], [
        baseMapType
    ]);
    // Handle Scenario FlyTo
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WorkstationMap.useEffect": ()=>{
            if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(center, zoom, {
                    animate: true,
                    duration: 1.0
                });
            }
        }
    }["WorkstationMap.useEffect"], [
        center[0],
        center[1],
        zoom
    ]);
    // Render High-Precision Grounded BBoxes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WorkstationMap.useEffect": ()=>{
            if (!layerGroupRef.current) return;
            layerGroupRef.current.clearLayers();
            if (showBBoxes) {
                entities.forEach({
                    "WorkstationMap.useEffect": (item)=>{
                        const bounds = [
                            [
                                item.latMin,
                                item.lngMin
                            ],
                            [
                                item.latMax,
                                item.lngMax
                            ]
                        ];
                        const rect = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].rectangle(bounds, {
                            color: item.color,
                            weight: 2,
                            fillOpacity: 0.18,
                            dashArray: undefined
                        });
                        rect.bindTooltip(`${item.name} • ${(item.confidence * 100).toFixed(1)}%`, {
                            permanent: true,
                            direction: 'top',
                            className: 'custom-leaflet-tooltip'
                        });
                        layerGroupRef.current?.addLayer(rect);
                    }
                }["WorkstationMap.useEffect"]);
            }
        }
    }["WorkstationMap.useEffect"], [
        showBBoxes,
        entities
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2d$nextjs$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: mapContainerRef,
        className: "w-full h-full bg-slate-950 z-0"
    }, void 0, false, {
        fileName: "[project]/frontend-nextjs/components/WorkstationMap.tsx",
        lineNumber: 145,
        columnNumber: 10
    }, this);
}
_s(WorkstationMap, "HKY2jat4WgemUhyuSWBWogc3Wds=");
_c = WorkstationMap;
var _c;
__turbopack_context__.k.register(_c, "WorkstationMap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend-nextjs/components/WorkstationMap.tsx [app-client] (ecmascript, next/dynamic entry)", (function(__turbopack_context__){

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend-nextjs/components/WorkstationMap.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend-nextjs_components_WorkstationMap_tsx_1y_sp1n._.js.map