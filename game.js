
let deck = [];
let currentCard = null;
let score = 0;
let roundNumber = 0;
let alive = true;

let verticalLine = [];
let horizontalLine = [];
let centerPlace = null;
let primaryAxis = null; // null, "v", or "h"

let cardW = 180;
let cardH = 80;
let gapX = 35;
let gapY = 35;

const baseCardW = 180;
const baseCardH = 80;
const baseGapX = 35;
const baseGapY = 35;

const rainbowColors = [
  "#e6194b", "#f58231", "#ffe119", "#3cb44b",
  "#42d4f4", "#4363d8", "#911eb4", "#f032e6"
];

let selectedCountry = "italy";
let places = COUNTRY_DATA[selectedCountry];

populateCountryDropdown();
newGame();

function changeCountry() {
  selectedCountry = document.getElementById("countrySelect").value;
  places = COUNTRY_DATA[selectedCountry];
  newGame();
}

function colorForTurn(turn) {
  return rainbowColors[turn % rainbowColors.length];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function newGame() {
  deck = places.map(p => ({...p}));
  shuffle(deck);

  const firstPlace = deck.pop();
  firstPlace.cardColor = colorForTurn(0);

  verticalLine = [firstPlace];
  horizontalLine = [firstPlace];
  centerPlace = null;
  primaryAxis = null;

  currentCard = null;
  score = 0;
  roundNumber = 0;
  alive = true;

  drawCard();
  render();
  document.getElementById("message").innerText = "";
}

function placedNamesSet() {
  const names = new Set();
  verticalLine.forEach(p => names.add(p.name_de));
  horizontalLine.forEach(p => names.add(p.name_de));
  return names;
}

function drawCard() {
  if (!alive) return;

  if (currentCard === null) {
    const placedNames = placedNamesSet();

    while (deck.length > 0) {
      const candidate = deck.pop();

      if (!placedNames.has(candidate.name_de)) {
        currentCard = candidate;
        return;
      }
    }

    currentCard = null;
    alive = false;
    document.getElementById("message").innerText = "Keine Karten mehr im Deck.";
  }
}

function stopGame() {
  alive = false;
  document.getElementById("message").innerText =
    "Du sicherst " + score + " Punkte.";
  render();
}

function isNorthOf(a, b) { return a.latitude > b.latitude; }
function isSouthOf(a, b) { return a.latitude < b.latitude; }
function isWestOf(a, b) { return a.longitude < b.longitude; }
function isEastOf(a, b) { return a.longitude > b.longitude; }

function canInsertVertical(index) {
  const northNeighbor = index > 0 ? verticalLine[index - 1] : null;
  const southNeighbor = index < verticalLine.length ? verticalLine[index] : null;

  if (northNeighbor && !isSouthOf(currentCard, northNeighbor)) return false;
  if (southNeighbor && !isNorthOf(currentCard, southNeighbor)) return false;

  return true;
}

function canInsertHorizontal(index) {
  const westNeighbor = index > 0 ? horizontalLine[index - 1] : null;
  const eastNeighbor = index < horizontalLine.length ? horizontalLine[index] : null;

  if (westNeighbor && !isEastOf(currentCard, westNeighbor)) return false;
  if (eastNeighbor && !isWestOf(currentCard, eastNeighbor)) return false;

  return true;
}

function colorCurrentCard() {
  const newPlace = {...currentCard};
  newPlace.cardColor = colorForTurn(roundNumber + 1);
  return newPlace;
}

function awardAndDraw(newPlace) {
  roundNumber += 1;

  const difficulty = parseInt(newPlace.difficulty_1_easy_5_hard);
  const gained = roundNumber * difficulty;
  score += gained;

  document.getElementById("message").innerText =
    "Richtig! +" + gained + " Punkte.";

  currentCard = null;
  drawCard();
  render();
}

function fail(message) {
  alive = false;
  score = 0;
  document.getElementById("message").innerText = message;
  showSolutionMap();
}

function insertVertical(index) {
  if (!alive || currentCard === null) return;

  if (!canInsertVertical(index)) {
    fail("Falsch. " + currentCard.name_de + " gehört nicht an diese Nord-Süd-Stelle.");
    return;
  }

  const newPlace = colorCurrentCard();
  verticalLine.splice(index, 0, newPlace);

  if (centerPlace === null) primaryAxis = "v";

  awardAndDraw(newPlace);
}

function insertHorizontal(index) {
  if (!alive || currentCard === null) return;

  if (!canInsertHorizontal(index)) {
    fail("Falsch. " + currentCard.name_de + " gehört nicht an diese West-Ost-Stelle.");
    return;
  }

  const newPlace = colorCurrentCard();
  horizontalLine.splice(index, 0, newPlace);

  if (centerPlace === null) primaryAxis = "h";

  awardAndDraw(newPlace);
}

function startHorizontalFromVertical(anchorVerticalIndex, direction) {
  if (!alive || currentCard === null) return;

  const anchor = verticalLine[anchorVerticalIndex];

  const correct = direction === "w"
    ? isWestOf(currentCard, anchor)
    : isEastOf(currentCard, anchor);

  if (!correct) {
    fail(
      "Falsch. " + currentCard.name_de + " liegt nicht " +
      (direction === "w" ? "westlich" : "östlich") +
      " von " + anchor.name_de + "."
    );
    return;
  }

  centerPlace = anchor;

  const newPlace = colorCurrentCard();

  horizontalLine = direction === "w"
    ? [newPlace, centerPlace]
    : [centerPlace, newPlace];

  awardAndDraw(newPlace);
}

function startVerticalFromHorizontal(anchorHorizontalIndex, direction) {
  if (!alive || currentCard === null) return;

  const anchor = horizontalLine[anchorHorizontalIndex];

  const correct = direction === "n"
    ? isNorthOf(currentCard, anchor)
    : isSouthOf(currentCard, anchor);

  if (!correct) {
    fail(
      "Falsch. " + currentCard.name_de + " liegt nicht " +
      (direction === "n" ? "nördlich" : "südlich") +
      " von " + anchor.name_de + "."
    );
    return;
  }

  centerPlace = anchor;

  const newPlace = colorCurrentCard();

  verticalLine = direction === "n"
    ? [newPlace, centerPlace]
    : [centerPlace, newPlace];

  awardAndDraw(newPlace);
}

function updateLayoutSizes() {
  const board = document.getElementById("board");

  const horizontalCount = Math.max(horizontalLine.length, 1);
  const verticalCount = Math.max(verticalLine.length, 1);

  const zoneMarginX = 120;
  const zoneMarginY = 90;

  const neededW =
    horizontalCount * baseCardW +
    (horizontalCount - 1) * baseGapX +
    zoneMarginX;

  const neededH =
    verticalCount * baseCardH +
    (verticalCount - 1) * baseGapY +
    zoneMarginY;

  const scaleX = board.clientWidth / neededW;
  const scaleY = board.clientHeight / neededH;

  const scale = Math.min(1, scaleX, scaleY);

  cardW = Math.max(42, baseCardW * scale);
  cardH = Math.max(24, baseCardH * scale);
  gapX = Math.max(2, baseGapX * scale);
  gapY = Math.max(2, baseGapY * scale);
}

function render() {
  const board = document.getElementById("board");
  board.className = "";
  board.innerHTML = "";

  document.getElementById("status").innerHTML =
    "<b>Neue Karte:</b> " + (currentCard ? currentCard.name_de : "-") +
    "<br><b>Score:</b> " + score +
    " | <b>Richtige Karten:</b> " + roundNumber;

  updateLayoutSizes();

  const layout = computeLayout();
  const shifted = shiftLayoutIntoBoard(layout, board);

  drawLayout(shifted);
}

function computeLayout() {
  const items = [];

  if (centerPlace === null) {
    if (primaryAxis === "h") {
      const centerH = Math.floor(horizontalLine.length / 2);

      horizontalLine.forEach((place, index) => {
        items.push({
          place: place,
          x: (index - centerH) * (cardW + gapX),
          y: 0
        });
      });
    } else {
      const centerV = Math.floor(verticalLine.length / 2);

      verticalLine.forEach((place, index) => {
        items.push({
          place: place,
          x: 0,
          y: (index - centerV) * (cardH + gapY)
        });
      });
    }

    return items;
  }

  const centerV = verticalLine.indexOf(centerPlace);
  const centerH = horizontalLine.indexOf(centerPlace);

  verticalLine.forEach((place, index) => {
    items.push({
      place: place,
      x: 0,
      y: (index - centerV) * (cardH + gapY)
    });
  });

  horizontalLine.forEach((place, index) => {
    if (place === centerPlace) return;

    items.push({
      place: place,
      x: (index - centerH) * (cardW + gapX),
      y: 0
    });
  });

  return items;
}

function shiftLayoutIntoBoard(items, board) {
  const padding = 40;

  const minX = Math.min(...items.map(i => i.x));
  const maxX = Math.max(...items.map(i => i.x + cardW));
  const minY = Math.min(...items.map(i => i.y));
  const maxY = Math.max(...items.map(i => i.y + cardH));

  const layoutW = maxX - minX;
  const layoutH = maxY - minY;

  const shiftX = (board.clientWidth - layoutW) / 2 - minX;
  const shiftY = (board.clientHeight - layoutH) / 2 - minY;

  return items.map(i => ({
    ...i,
    x: i.x + shiftX,
    y: i.y + shiftY
  }));
}

function drawLayout(items) {
  items.forEach(item => {
    drawCardElement(item.place, item.x, item.y);
  });

  items.forEach(item => {
    addCardTouchZones(item);
  });
}

function addCardTouchZones(item) {
  const place = item.place;
  const x = item.x;
  const y = item.y;

  const vIndex = verticalLine.indexOf(place);
  const hIndex = horizontalLine.indexOf(place);

  if (centerPlace === null) {
    if (primaryAxis === null) {
      addTouchZone(x, y, cardW, cardH * 0.35, () => insertVertical(0));
      addTouchZone(x, y + cardH * 0.65, cardW, cardH * 0.35, () => insertVertical(1));
      addTouchZone(x, y, cardW * 0.35, cardH, () => insertHorizontal(0));
      addTouchZone(x + cardW * 0.65, y, cardW * 0.35, cardH, () => insertHorizontal(1));
      return;
    }

    if (primaryAxis === "v" && vIndex !== -1) {
      addTouchZone(x, y, cardW, cardH * 0.35, () => insertVertical(vIndex));
      addTouchZone(x, y + cardH * 0.65, cardW, cardH * 0.35, () => insertVertical(vIndex + 1));
      addTouchZone(x, y, cardW * 0.35, cardH, () => startHorizontalFromVertical(vIndex, "w"));
      addTouchZone(x + cardW * 0.65, y, cardW * 0.35, cardH, () => startHorizontalFromVertical(vIndex, "e"));
      return;
    }

    if (primaryAxis === "h" && hIndex !== -1) {
      addTouchZone(x, y, cardW, cardH * 0.35, () => startVerticalFromHorizontal(hIndex, "n"));
      addTouchZone(x, y + cardH * 0.65, cardW, cardH * 0.35, () => startVerticalFromHorizontal(hIndex, "s"));
      addTouchZone(x, y, cardW * 0.35, cardH, () => insertHorizontal(hIndex));
      addTouchZone(x + cardW * 0.65, y, cardW * 0.35, cardH, () => insertHorizontal(hIndex + 1));
      return;
    }
  }

  if (centerPlace !== null) {
    if (vIndex !== -1) {
      addTouchZone(x, y, cardW, cardH * 0.35, () => insertVertical(vIndex));
      addTouchZone(x, y + cardH * 0.65, cardW, cardH * 0.35, () => insertVertical(vIndex + 1));
    }

    if (hIndex !== -1) {
      addTouchZone(x, y, cardW * 0.35, cardH, () => insertHorizontal(hIndex));
      addTouchZone(x + cardW * 0.65, y, cardW * 0.35, cardH, () => insertHorizontal(hIndex + 1));
    }
  }
}

function addTouchZone(x, y, w, h, action) {
  const zone = document.createElement("div");
  zone.className = "touch-zone";
  zone.style.left = x + "px";
  zone.style.top = y + "px";
  zone.style.width = w + "px";
  zone.style.height = h + "px";
  zone.onclick = action;

  document.getElementById("board").appendChild(zone);
}

function drawCardElement(place, x, y) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.left = x + "px";
  card.style.top = y + "px";
  card.style.width = cardW + "px";
  card.style.height = cardH + "px";
  card.style.paddingTop = Math.max(3, cardH * 0.22) + "px";
  card.style.fontSize = Math.max(7, cardH * 0.27) + "px";
  card.style.background = place.cardColor || "#333";
  card.innerHTML = place.name_de;
  document.getElementById("board").appendChild(card);
}

function addInsertZone(axis, index, x, y) {
  const zone = document.createElement("div");
  zone.className = "zone";
  zone.style.left = x + "px";
  zone.style.top = y + "px";

  if (axis === "v") {
    zone.style.width = Math.max(50, cardW * 0.5) + "px";
    zone.style.height = Math.max(18, cardH * 0.35) + "px";
  } else {
    zone.style.width = Math.max(20, cardW * 0.2) + "px";
    zone.style.height = Math.max(32, cardH * 0.75) + "px";
  }

  zone.title = axis === "v" ? "Nord-Süd einfügen" : "West-Ost einfügen";

  zone.onclick = axis === "v"
    ? () => insertVertical(index)
    : () => insertHorizontal(index);

  document.getElementById("board").appendChild(zone);
}

function addInitialHorizontalZone(direction, x, y) {
  const zone = document.createElement("div");
  zone.className = "zone";
  zone.style.left = x + "px";
  zone.style.top = y + "px";
  zone.style.width = Math.max(20, cardW * 0.2) + "px";
  zone.style.height = Math.max(32, cardH * 0.75) + "px";
  zone.title = direction === "w" ? "westlich einfügen" : "östlich einfügen";
  zone.onclick = direction === "w"
    ? () => insertHorizontal(0)
    : () => insertHorizontal(1);

  document.getElementById("board").appendChild(zone);
}

function addHorizontalChoiceZone(anchorVerticalIndex, direction, x, y) {
  const zone = document.createElement("div");
  zone.className = "zone";
  zone.style.left = x + "px";
  zone.style.top = y + "px";
  zone.style.width = Math.max(20, cardW * 0.2) + "px";
  zone.style.height = Math.max(32, cardH * 0.75) + "px";
  zone.title = direction === "w" ? "westlich einfügen" : "östlich einfügen";
  zone.onclick = () => startHorizontalFromVertical(anchorVerticalIndex, direction);

  document.getElementById("board").appendChild(zone);
}

function addVerticalChoiceZone(anchorHorizontalIndex, direction, x, y) {
  const zone = document.createElement("div");
  zone.className = "zone";
  zone.style.left = x + "px";
  zone.style.top = y + "px";
  zone.style.width = Math.max(50, cardW * 0.5) + "px";
  zone.style.height = Math.max(18, cardH * 0.35) + "px";
  zone.title = direction === "n" ? "nördlich einfügen" : "südlich einfügen";
  zone.onclick = () => startVerticalFromHorizontal(anchorHorizontalIndex, direction);

  document.getElementById("board").appendChild(zone);
}

function getAllPlacedPlaces() {
  const seen = new Set();
  const result = [];

  verticalLine.forEach(p => {
    if (!seen.has(p.name_de)) {
      seen.add(p.name_de);
      result.push(p);
    }
  });

  horizontalLine.forEach(p => {
    if (!seen.has(p.name_de)) {
      seen.add(p.name_de);
      result.push(p);
    }
  });

  return result;
}

function populateCountryDropdown() {
  const select = document.getElementById("countrySelect");

  select.innerHTML = "";

  Object.keys(COUNTRY_DATA)
    .sort()
    .forEach(country => {

      const option = document.createElement("option");

      option.value = country;

      option.textContent =
        country.charAt(0).toUpperCase() +
        country.slice(1);

      select.appendChild(option);
    });

  select.value = selectedCountry;

  select.onchange = changeCountry;
}

function getGeometryPolygons(geometry) {
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }

  if (geometry.type === "GeometryCollection") {
    let polygons = [];

    geometry.geometries.forEach(g => {
      polygons = polygons.concat(getGeometryPolygons(g));
    });

    return polygons;
  }

  return [];
}

function drawCountryOutline(svg, area, country, bounds) {
  const geometry = COUNTRY_OUTLINES[country];
  if (!geometry) return;

  const polygons = getGeometryPolygons(geometry);

  polygons.forEach(polygon => {
    polygon.forEach(ring => {
      const points = ring.map(([lon, lat]) => {
        const [x, y] = projectGeo(lon, lat, bounds, area);
        return x + "," + y;
      }).join(" ");

      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", points);
      poly.setAttribute("fill", "#dcecff");
      poly.setAttribute("stroke", "#8aa8c8");
      poly.setAttribute("stroke-width", 1.5);
      poly.setAttribute("opacity", 0.75);
      svg.appendChild(poly);
    });
  });
}

function getCountryBounds(country) {
  const geometry = COUNTRY_OUTLINES[country];

  if (!geometry) {
    return getGeoBounds(getAllPlacedPlaces());
  }

  const polygons = getGeometryPolygons(geometry);
  const coords = [];

  polygons.forEach(polygon => {
    polygon.forEach(ring => {
      ring.forEach(coord => coords.push(coord));
    });
  });

  const lons = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);

  return {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats)
  };
}

function showSolutionMap() {
  const board = document.getElementById("board");
  board.className = "";
  board.innerHTML = "";

  const allPlaces = getAllPlacedPlaces();

  if (currentCard !== null) {
    allPlaces.push({
      ...currentCard,
      cardColor: "#ffffff",
      isWrongCard: true
    });
  }

  const width = board.clientWidth || 1100;
  const height = board.clientHeight || 750;
  const halfWidth = width / 2;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.background = "#eef5ff";
  svg.style.border = "1px solid #ccc";

  addSvgText(svg, 30, 35, "Deine Platzierung", 24, "bold");
  addSvgText(svg, halfWidth + 30, 35, "Lösung: echte Positionen", 24, "bold");

  // LEFT: placed layout
  const oldCardW = cardW;
  const oldCardH = cardH;

  cardW = 90;
  cardH = 42;

  const placedLayout = shiftSvgLayoutIntoPanel(
    computeLayout(),
    20,
    70,
    halfWidth - 40,
    height - 90
  );

  placedLayout.forEach(item => {
    drawSvgCard(svg, item.place, item.x, item.y, cardW, cardH);
  });

  cardW = oldCardW;
  cardH = oldCardH;

  // RIGHT: geographic solution
  const mapArea = {
    x: halfWidth + 30,
    y: 70,
    w: halfWidth - 60,
    h: height - 100
  };

// Use the real country outline bounds, not only the placed cities
const bounds = getCountryBounds(selectedCountry);

drawCountryOutline(svg, mapArea, selectedCountry, bounds);

allPlaces.forEach(place => {
  const [x, y] = projectGeo(
    place.longitude,
    place.latitude,
    bounds,
    mapArea
  );

  drawGeoDot(svg, place, x, y);
});

  board.appendChild(svg);
}


function addSvgText(svg, x, y, text, size, weight) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("font-size", size);
  el.setAttribute("font-weight", weight);
  el.textContent = text;
  svg.appendChild(el);
}

function drawSvgCard(svg, place, x, y, w, h) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", w);
  rect.setAttribute("height", h);
  rect.setAttribute("rx", 8);
  rect.setAttribute("fill", place.cardColor || "#333");
  rect.setAttribute("stroke", "#333");
  rect.setAttribute("stroke-width", 2);
  svg.appendChild(rect);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", x + w / 2);
  text.setAttribute("y", y + h / 2 + 5);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", 13);
  text.setAttribute("font-weight", "bold");
  text.setAttribute("fill", "white");
  text.textContent = place.name_de;
  svg.appendChild(text);
}

function shiftSvgLayoutIntoPanel(items, panelX, panelY, panelW, panelH) {
  const minX = Math.min(...items.map(i => i.x));
  const maxX = Math.max(...items.map(i => i.x + cardW));
  const minY = Math.min(...items.map(i => i.y));
  const maxY = Math.max(...items.map(i => i.y + cardH));

  const layoutW = maxX - minX;
  const layoutH = maxY - minY;

  const scale = Math.min(
    1,
    panelW / layoutW,
    panelH / layoutH
  );

  return items.map(i => ({
    ...i,
    x: panelX + (panelW - layoutW * scale) / 2 + (i.x - minX) * scale,
    y: panelY + (panelH - layoutH * scale) / 2 + (i.y - minY) * scale
  }));
}

function getGeoBounds(placesList) {
  const lats = placesList.map(p => p.latitude);
  const lons = placesList.map(p => p.longitude);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons)
  };
}

function projectGeo(lon, lat, bounds, area) {
  const pad = 40;

  const lonRange = bounds.maxLon - bounds.minLon || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;

  const x = area.x + pad + ((lon - bounds.minLon) / lonRange) * (area.w - 2 * pad);
  const y = area.y + area.h - pad - ((lat - bounds.minLat) / latRange) * (area.h - 2 * pad);

  return [x, y];
}

function drawGeoDot(svg, place, x, y) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.setAttribute("r", place.isWrongCard ? 13 : 10);
  circle.setAttribute("fill", place.cardColor || "#333");
  circle.setAttribute("stroke", place.isWrongCard ? "#000" : "#333");
  circle.setAttribute("stroke-width", place.isWrongCard ? 4 : 2);
  svg.appendChild(circle);

  const letter = document.createElementNS("http://www.w3.org/2000/svg", "text");
  letter.setAttribute("x", x);
  letter.setAttribute("y", y + 5);
  letter.setAttribute("text-anchor", "middle");
  letter.setAttribute("font-size", 14);
  letter.setAttribute("font-weight", "bold");
  letter.setAttribute("fill", place.isWrongCard ? "#000" : "white");
  letter.textContent = place.name_de[0];
  svg.appendChild(letter);
}
