
// lines (layers)
const legendSettings = [{ color: '#4292C6', key: 'LS', title: 'Low Stress', checked: true},
{ color: '#F16913', key: 'HS', title: 'High Stress', checked: true},
{ key: 'desig', title: 'Bike Designated Only', checked: true}]

const layerSettings = [
  {key: 'LSdesig', color: '#4292C6', opacity: 0.6, url: 'data/design_low_stress.json'},
  {key: 'HSdesig', color: '#F16913', opacity: 0.6, url: 'data/design_high_stress.json'},
  {key: 'LSother', color: '#4292C6', opacity: 0.6, url: 'data/low_stress.json'},
  {key: 'HSother', color: '#F16913', opacity: 0.6, url: 'data/high_stress.json'},
  {key: 'LSall', color: '#4292C6', opacity: 0.2, url: 'data/all_low_stress.json'},
  {key: 'HSall', color: '#F16913', opacity: 0.2, url: 'data/all_high_stress.json'}]

var lineWeight = 2
if (!L.Browser.mobile) {
  lineWeight = lineWeight + 1
}
//var lineOpacity = 0.6
//var lineHighOpacity = lineOpacity + 0.3 //0.9 - highligh opacity

var layerGroup = new L.LayerGroup();
var layerGroupAll = new L.LayerGroup(); // for detailed layers visible only on zoom greater then threshold (currently 15)
var legendChecks = {}; //dictionary of legend checkbox ids(keys) and their states
var layers = {};  //dictionary of layers with keys from settings

// Create variable to hold map element, give initial settings to map
var centerCoord = [49.27857, -122.79942] 
if (L.Browser.mobile) {
  // increase tolerance for tapping (it was hard to tap on line exactly), zoom out a bit, and remove zoom control
  var myRenderer = L.canvas({ padding: 0.1, tolerance: 5 });
  var map = L.map("map", { center: centerCoord, zoom: 11, renderer: myRenderer, zoomControl: false });
} else {
  var map = L.map("map", { center: centerCoord, zoom: 12 });
}
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19,
  minZoom: 10
}
).addTo(map);
// Add BikeOttawa attribution
map.attributionControl.addAttribution('<a href="https://github.com/BikeOttawa">BikeOttawa</a>');
if (!L.Browser.mobile) { // add date on desktop. too clutered on mobile
  map.attributionControl.addAttribution('updated Jan 2025');
}

// add geolocation on mobile
if (L.Browser.mobile) {
  L.control.locate({
      position: "bottomright",
      icon: "fa fa-location-arrow",
      showPopup: false
  }).addTo(map);
}

//map.on("zoomend", function (e) { console.log("Z,DRAGANA::OOMEND", map.getZoom()); });

addLegend()
// show/hide legend
document.getElementById('legendbtn').onclick = function () { toggleDisplay(['legendbtn', 'legend']) };
document.getElementById('closebtn').onclick = function () { toggleDisplay(['legendbtn', 'legend']) };

addLayers()
// show/hide layer based on zoom level
map.on("zoomend", function () { zoomChanged() });

///// Functions ////

// ------ Legend
function addLegend() {
  const legend = L.control({ position: 'topright' })
  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div')

    // hide legend on mobile, show on desktop
    closeButtonDisplay = "block"
    legendDisplay = "none"
    // if (L.Browser.mobile) {
    //   closeButtonDisplay = "none"
    //   legendDisplay = "block"
    // }

    let legendHtml = '<div id="legendbtn" class="fill-darken2 pad1 icon menu button fr" style="display: ' + legendDisplay +'"></div>' +
      '<div id="legend" class="fill-darken1 round" style="display: ' + closeButtonDisplay +'">' +
      '<div id="closebtn" class="fill-darken2 pad1 icon close button fr"></div>' +
      '<div class="clearfix"></div>' +
      '<form><fieldset class="checkbox-pill clearfix">'

    legendHtml += '<div class="button quiet col12">Tri-Cities Cycling Traffic Stress</div>'
    for (let setting of legendSettings) {
      legendHtml += addLegendLine(setting)
    }
    var mapAction = "Click on"
    if (L.Browser.mobile) {
      mapAction = "Tap"
    }
    legendHtml += '<div class="button quiet col12">' + mapAction + ' map item for more info</div>'

    legendHtml += '</fieldset></form></div>'
    div.innerHTML = legendHtml

    // disable map zoom when double clicking anywhere on legend (checkboxes included)
    div.addEventListener('mouseover', function () { map.doubleClickZoom.disable(); });
    div.addEventListener('mouseout', function () { map.doubleClickZoom.enable(); });
    return div
  }
  legend.addTo(map)
}

function addLegendLine(setting) {
  var spanHtml
  if (setting.color){
    // add span element
    spanHtml = '<span style="display:inline-block; width:50px; height:8px; background-color:' + setting.color + '"></span>' +
    '&nbsp;' + setting.title
  }else{
    // just title
    spanHtml = setting.title
  }

  checkedHtml = ""
  if (setting.checked) {
    checkedHtml = 'checked'
  }
  // add item to dictionary of legend checkbox ids(keys) and their states
  legendChecks[setting.key] = setting.checked

  var lineHtml = '<input type="checkbox" id="' + setting.key + '" onclick="toggleLayer(this)" ' + checkedHtml + ' >' +
    '<label for="' + setting.key + '" id="' + setting.key + '-label" class="button icon check quiet col12">' +
    '&nbsp;' + spanHtml + ' </label>'

  return lineHtml
}

function toggleDisplay(elementIds) {
  elementIds.forEach(function (elementId) {
    var x = document.getElementById(elementId);
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  });
}

function toggleLayer(checkbox) { 

  if (checkbox.checked){
      legendChecks[checkbox.id] = true
  }else{
      legendChecks[checkbox.id] = false 
  }

  layerGroup.clearLayers()
  if (legendChecks['LS'] == true)
  {
    if (legendChecks['desig'] == true){
      // add low stress designated
      layerGroup.addLayer(layers['LSdesig'])
    }else{
      // add all low stress 
      layerGroup.addLayer(layers['LSdesig'])
      layerGroup.addLayer(layers['LSother'])
    }
  }
  if (legendChecks['HS'] == true)
  {
    if (legendChecks['desig'] == true){
      // add high stress designated
      layerGroup.addLayer(layers['HSdesig'])
    }else{
      // add all high stress
      layerGroup.addLayer(layers['HSdesig'])
      layerGroup.addLayer(layers['HSother'])
    }
  }
  // check if zoomed enough to displayed detailed layer
  zoomChanged()
}

function zoomChanged() {
  //console.log("DRAGANA::ZOOMEND", map.getZoom())
  designOnly = legendChecks['desig']
  lowStress = legendChecks['LS']
  highStress = legendChecks['HS']

  // show all only if zoomed in and designated only NOT selected
  if ((map.getZoom() > 15) && !designOnly){
      if (lowStress && !layerGroupAll.hasLayer(layers['LSall'])){
        layerGroupAll.addLayer(layers['LSall'])
      }
      if (!lowStress && layerGroupAll.hasLayer(layers['LSall'])){
        layerGroupAll.removeLayer(layers['LSall'])
      }
      if (highStress && !layerGroupAll.hasLayer(layers['HSall'])){
        layerGroupAll.addLayer(layers['HSall'])
      }
      if (!highStress && layerGroupAll.hasLayer(layers['HSall'])){
        layerGroupAll.removeLayer(layers['HSall'])
      }

      // add group to map if not already there
      if (!map.hasLayer(layerGroupAll)){
        //console.log("dragana:: adding layer");
        layerGroupAll.addTo(map);
      }
  }else{
    // zoom is below threshold, remove layerGroupAll
    if (map.hasLayer(layerGroupAll)){
      //console.log("dragana:: removing layer");
      layerGroupAll.clearLayers()
      map.removeLayer(layerGroupAll)
    }
  }
}

// ------ Layers
function addLayers() {
  
  layerGroup.addTo(map);

  for (let setting of layerSettings) {
    var ltsLayer = new L.GeoJSON.AJAX(setting.url, {
      style: getLineStyle(setting.color, setting.opacity),
      onEachFeature: onEachFeature,
    });
    ltsLayer.layerID = setting.key;
    // add to global layers dictionary
    layers[setting.key] = ltsLayer
  }
  if (legendChecks['LS'] == true)
  {
    if (legendChecks['desig'] == true){
      // add low stress designated
      layerGroup.addLayer(layers['LSdesig'])
    }else{
      // add low stress other
      layerGroup.addLayer(layers['LSother'])
    }
  }
  if (legendChecks['HS'] == true)
  {
    if (legendChecks['desig'] == true){
      // add high stress designated
      layerGroup.addLayer(layers['HSdesig'])
    }else{
      layerGroup.addLayer(layers['HSother'])
    }
  }
}

// lines style
function getLineStyle(color, opacity) {
  var lineStyle = {
    "color": color,
    "weight": lineWeight,
    "opacity": opacity
  };
  return lineStyle
}
function getHighlightStyle(color, opacity) {
  var highlighStyle = {
    "color": color,
    "weight": lineWeight + 1,
    "opacity": opacity
  };
  return highlighStyle
}

function highlightFeature(e) {
  var layer = e.target;
  var highlightStyle = getHighlightStyle(layer.options.color, layer.options.opacity)
  layer.setStyle(highlightStyle);

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlight(e) {
  var layer = e.target;
  var lineStyle = getLineStyle(layer.options.color, layer.options.opacity)
  layer.setStyle(lineStyle);
}

// add popup and highlight
function onEachFeature(feature, layer) {
  var popupContent = ""
  if (feature.properties) {
    // for this mobile version don't show link and id
    // if (feature.properties.id) {
    //   popupContent +='<b><a href="https://www.openstreetmap.org/' + feature.properties.id + '" target="_blank">' + feature.properties.id + '</a></b><hr>'
    //   //popupContent += "<b>Id: </b>";
    //   //popupContent += feature.properties.id;
    // }

    // for debug
    // if (feature.properties.id == 'way/35198494'){
    //   console.log('Dragana:: tag ' + JSON.stringify(feature.properties))
    // }

    // customize value for category (road category) tag
    // options based on analysis of Sept 2021 designated data (StressDataExploration.R)
    let highwayValueToShow = null
    let categoryValueToShow = null
    if (feature.properties.highway) {
      let highwayValue = feature.properties.highway

      if (highwayValue == "path" || highwayValue == "cycleway" || highwayValue == "footway"){
        // separated bike infrastructure
        let footValue = feature.properties.foot
        if (footValue == "designated" ||  footValue == "yes" || footValue == "permissive" || footValue == "yes;permissive"){
          footValue = "yes"
        }else{
          footValue = "no"
        }
        let bicycleValue = feature.properties.bicycle
        if (bicycleValue == "designated" ||  bicycleValue == "yes" || bicycleValue == "permissive" || bicycleValue == "yes;permissive"){
          bicycleValue = "yes"
        }else{
          bicycleValue = "no"
        }
        // path
        if (highwayValue == "path"){
          if (footValue == "yes" && bicycleValue == "yes"){
            if (feature.properties.segregated && feature.properties.segregated == "yes"){
              categoryValueToShow = "Bike Path"
            }else{
              categoryValueToShow = "Shared Path"
            }
          }else{
            categoryValueToShow = "Path"
          }
        // cycleway
        }else if (highwayValue == "cycleway"){
          if (footValue == "yes"){
            categoryValueToShow = "Shared"
          }else{
            categoryValueToShow = "Bike"
          }
          // cycleway crossings
          let cyclewayValue = feature.properties.cycleway
          if (cyclewayValue == "crossing"){
            categoryValueToShow += " Crossing"
          }else{
            categoryValueToShow += " Path"
          }
          // footway
        }else if (highwayValue == "footway"){
          if (bicycleValue == "yes"){
            categoryValueToShow = "Shared"
          }else{
            categoryValueToShow = "Foot"
          }
          // footway crossings
          let footwayValue = feature.properties.footway
          if (footwayValue == "crossing"){
            categoryValueToShow += " Crossing"
          }else{
            categoryValueToShow += " Path"
          }
        }
      }else if (highwayValue == "motorway" || highwayValue == "trunk" || highwayValue == "primary" || 
          highwayValue == "secondary" || highwayValue == "tertiary" || highwayValue == "service" ||
          highwayValue == "unclassified" || highwayValue == "residential" || 
          highwayValue == "motorway_link" || highwayValue == "trunk_link" || highwayValue == "primary_link" ||
          highwayValue == "secondary_link" || highwayValue == "tertiary_link"){
            // roads  
            if (highwayValue != "unclassified" && highwayValue != "residential" && highwayValue != "service"){
              highwayValueToShow = "highway"
            }
            if (highwayValue == "tertiary" || highwayValue == "tertiary_link"){
              highwayValueToShow = "collector"
            }
            if (highwayValue == "secondary" || highwayValue == "secondary_link"){
              highwayValueToShow = "arterial"
            }
            if (highwayValueToShow == null){
              highwayValueToShow = highwayValue
            }
            // if "service" then add what kind of service
            if (highwayValue == "service"){
              if (feature.properties.service) {
                let serviceValue = feature.properties.service
                if (serviceValue == "parking_aisle"){
                  serviceValue = "parking aisle"
                }
                highwayValueToShow += "<br><b>service: </b>";
                highwayValueToShow += serviceValue;
              }
            }
            // check if there's bike accessible shoulder
            if (feature.properties["shoulder.bicycle"]){
              let shoulderBicycleValue = feature.properties["shoulder.bicycle"]
              if (shoulderBicycleValue == "yes"){
                categoryValueToShow = "Bicycle accessible shoulder"
              }
            }
            // figure out bike infra categories ("cycleway" tag)
            let cyclewayValue = null
            if (feature.properties.cycleway) {
              cyclewayValue = feature.properties.cycleway
              // check if there's cycleway.both, cycleway.right, cycleway.left
            }else if(feature.properties["cycleway.both"]){
              cyclewayValue = feature.properties["cycleway.both"]
            }else if(feature.properties["cycleway.right"]){
              cyclewayValue = feature.properties["cycleway.right"]
            }else if(feature.properties["cycleway.left"]){
              cyclewayValue = feature.properties["cycleway.left"]
            }
            if (cyclewayValue){
              if (cyclewayValue == "shared_lane"  || cyclewayValue == "shared" || cyclewayValue == "share_busway"){
                categoryValueToShow = "Shared Lane"
              }
              if (cyclewayValue == "lane"){
                categoryValueToShow = "Painted Lane"
              }              
              if (cyclewayValue == "track"){
                categoryValueToShow = "Protected Lane"
              }
              if (cyclewayValue == "crossing"){
                categoryValueToShow = "Crossing"
              }
            }
      }else{
        // everything else
        categoryValueToShow = highwayValue
      }
    }
    // add bike category first
    if (categoryValueToShow){
      popupContent += "<b>";
      popupContent += categoryValueToShow;
      popupContent += "</b>";
    }
    // add name second
    if (feature.properties.name){
      // add new line if there's something in front of it
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>name: </b>";
      popupContent += feature.properties.name;
    }
    // then road category
    if (highwayValueToShow){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>road category: </b>";
      popupContent += highwayValueToShow;
    }
    // add surface and maxspeed
    if (feature.properties.surface){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>surface: </b>";
      let surfaceValue = feature.properties.surface
      if (surfaceValue == "paving_stones"){
        surfaceValue = "paving stones"
      }else if (surfaceValue == "fine_gravel"){
        surfaceValue = "fine gravel"
      }else if (surfaceValue == "unhewn_cobblestone"){
        surfaceValue = "unhewn cobblestone"
      }else if (surfaceValue == "grass_paver"){
        surfaceValue = "grass paver"
      }
      popupContent += surfaceValue;
    }
    if (feature.properties.maxspeed){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>max speed: </b>";
      popupContent += feature.properties.maxspeed;
    }
    // add lit and incline
    if (feature.properties.lit){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>lit: </b>";
      popupContent += feature.properties.lit;
    }
    if (feature.properties.incline){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>incline: </b>";
      popupContent += feature.properties.incline;
    }

    // FOR TEST
  // popupContent += "<br>=================";
  //   for (let property in feature.properties) {
  //       //console.log('Dragana:: tag ' + JSON.stringify(tag) +', value: '+ way.tags[tag])
  //     //if ((property != "id") && (property != "decisionMsg") && (property != "access")
  //     //  (property != "highway") && (feature.properties[property] != null)){
        
  //         popupContent += "<br><b>" + property + ": </b>";
  //       popupContent += feature.properties[property];
  //     //}
  //  }
    // for this mobile version don't show decision message
    // if (feature.properties.decisionMsg) {
    //   popupContent += "<br><br><b>Decision Msg: </b>";
    //   popupContent += feature.properties.decisionMsg;
    // }
  }
  layer.bindPopup(popupContent);

  // for mobile, use popup functions
  if (L.Browser.mobile) {
    layer.on({
      popupopen: highlightFeature,
      popupclose: resetHighlight,
    });
  } else {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }
}
