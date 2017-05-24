var url_base = "./json/mul/";

var tiles = L.tileLayer(
    url_base + "{z}/{x}/{y}.json",
    {
        minZoom: 1,
        maxZoom: 8,
        maxNativeZoom: 7,
        pane: "overlayPane",
        detectRetina: true
    }
);
var rs = 128;
var rasterLayer = L.imageOverlay("assets/raster.png", [[rs, -rs], [-rs, rs]], {
    opacity: 0.25
});

var svgElement = function(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
};

var populateTile = function(tile, tileSize, data) {
    tile.setAttribute('viewBox', '0 0 512 512');
    for (var i=0; i < data.length; i++) {
        var node = data[i];
        if (node.textSize >= 4) {
            var circle = svgElement('circle');
            var size = node.textSize;
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', size / 8 + 0.2);
            circle.setAttribute('class', "node lang-" + node.lang);
            tile.appendChild(circle);
        }
    }
    for (var i=0; i < data.length; i++) {
        var node = data[i];
        if (node.showLabel && node.textSize >= 8) {
            var size = node.textSize;
            var anchor = svgElement('a');
            anchor.setAttribute('href', `http://conceptnet.io${node.uri}`);
            var label = svgElement('text');
            label.setAttribute('class', "label leaflet-interactive lang-" + node.lang);
            label.setAttribute('style', `font-size: ${node.textSize}px; stroke-width: ${node.textSize / 8 + 2}px`);
            label.innerHTML = node.label;
            label.setAttribute('x', node.x + node.textSize / 4 + 0.2);
            label.setAttribute('y', node.y + node.textSize * 5 / 8 + 0.2);
            anchor.appendChild(label);
            tile.appendChild(anchor);
        }
    }
    tile.style.width = tileSize * 2 + "px";
    tile.style.height = tileSize * 2 + "px";
};

tiles.createTile = function(coords, done) {
    var tile = svgElement('svg');
    tile.setAttribute('class', 'leaflet-tile');
    var size = this.getTileSize();
    var error;

    var url = this.getTileUrl(coords);
    if (Math.max(Math.abs(coords.x), Math.abs(coords.y)) >= Math.pow(2, coords.z)) {
        done(error, tile);
        return tile;
    }
    fetch(url).then(function(response) {
        if (response.ok) {
            response.json().then(function(data) {
                populateTile(tile, size.x, data);
                done(error, tile);
            });
        }
    });
    return tile;
};


var showMap = function() {
    var map = L.map('map', {
        crs: L.CRS.Simple,
        renderer: L.svg()
    });

    var updateZoom = function() {
        if (map.getZoom() >= 5 && map.hasLayer(rasterLayer)) {
            map.removeLayer(rasterLayer);
        }
        if (map.getZoom() <= 4 && !map.hasLayer(rasterLayer)) {
            map.addLayer(rasterLayer);
        }
        var z = map.getZoom();
        if (z >= 4) {
            rasterLayer.setOpacity(0.15);
        }
        else if (z == 3) {
            rasterLayer.setOpacity(0.25);
        }
        else if (z == 2) {
            rasterLayer.setOpacity(0.33);
        }
        else {
            rasterLayer.setOpacity(0.5);
        }
    };
    map.on('zoomend', updateZoom);
    map.on('load', updateZoom);

    rasterLayer.addTo(map);
    tiles.addTo(map);
    map.setView(L.latLng(0, 0), 3, {animation: false});
    var hash = new L.Hash(map);
};
