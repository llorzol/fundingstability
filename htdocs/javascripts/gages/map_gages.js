/**
 * Namespace: Map_Gages
 *
 * Map_Gages is a JavaScript library to provide a set of functions to build
 *  the Endangered Gages Web Site.
 *
 * $Id: /var/www/html/fundingstability/javascripts/gages/map_gages.js, v 1.87 2026/06/01 14:46:54 llorzol Exp $
 * $Revision: 1.87 $
 * $Date: 2026/06/01 14:46:54 $
 * $Author: llorzol $
*/

/*
###############################################################################
# Copyright (c) Office of Planning and Programming (OPP)
# 
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.
###############################################################################
*/

// Set feature groups
//
var map;
var allSites            = new L.FeatureGroup();
var customSites         = new L.FeatureGroup();
var customSite          = new L.FeatureGroup();
var usaPolygon          = new L.LayerGroup();
var mySitesList         = []
var geojsonSites        = {};
var stateBoundary       = null;

var stateInfo           = {};

// Show base map
//
var USGSTopoBasemap = L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}");

var popup;
var popupOptions        = { 'maxHeight': '250', 'maxWidth': '300' };

var myZoomFlag          = false;

// Build min/max years
//
var minYears            = {};
var maxYears            = {};

// Counts
//
var NumberEndangered           = 0;
var NumberRecentlyDiscontinued = 0;
var NumberRescued              = 0;

// Prepare when the DOM is ready 
//
function buildMap(mySites, myFpsInfo, myStates, myStateCodes) {
    myLogger.debug("buildMap");
    myLogger.debug("mySites");
    myLogger.debug(mySites);
    myLogger.debug(myFpsInfo);

    // Loading message
    //
    message = "Building map ";
    updateModal(message);

    // Set map
    //
    map = new L.map('map', { scrollWheelZoom: false, zoomControl: false });

    // Zoom message
    //
    $("#map").on("mouseover", function () {
        if(!myZoomFlag) {
            myZoomFlag = true
            message = "Use Shift-Left Mouse Drag: Select a region by pressing the Shift key and dragging the left mouse button"
            openModal(message);
            fadeModal(2000);
        }
    });

    // Create map pane for higlighted/unlighted site
    //
    customPane = map.createPane('customPane');
    map.getPane('customPane').style.zIndex = 620;

    // Create map pane for selected set using the left panel
    //
    customPane = map.createPane('customSites');
    map.getPane('customSites').style.pointerEvents = 'auto';
    map.getPane('customSites').style.zIndex = 615;

    // Create map pane for all sites
    //
    dummyPane = map.createPane('allSites');
    map.getPane('allSites').style.pointerEvents = 'none';
    map.getPane('allSites').style.zIndex = 600;

    // Add sites
    //
    allSites = L.geoJson(mySites, {
        pointToLayer: function (feature, latlng) {
            var site_no               = feature.properties.site_no;
            var site_type             = feature.properties.site_tp_cd;
            var status                = feature.properties.status;

            // Set icon
            //
            myIcon                    = setIcon(site_no, site_type, status);
            feature.properties.symbol = myIcon;

            // Process only stream sites
            //
            let symbol = myIcon.options.iconUrl;
            if(/sw/i.test(symbol)) {

                // Set coordinates for geojson output
                //
                let [longitude, latitude] = feature.geometry.coordinates;
                feature.properties.longitude = longitude
                feature.properties.latitude  = latitude
                   
                // Reset threatened to Endangered
                //
                if(/^threatened/i.test(status)) {
                    status                    = "Endangered";
                    feature.properties.status = "Endangered";
                }

                // Set FPS funding
                //
                feature.properties.fps = "No";
                feature.properties.funding = "No FPS Funds";

                if(myFpsInfo[site_no]) {
                    if(/^Full|^Partial/i.test(myFpsInfo[site_no])) {
                        feature.properties.fps = 'Yes';
                        feature.properties.funding = myFpsInfo[site_no];
                    }
                }
                
                // Build state code list for left panel
                //
                let state_nm = "";
                let state_cd = feature.properties.state_cd;
                if(myStateCodes[state_cd]) {
                    state_nm = myStateCodes[state_cd];
                    if(!myAreaList.includes(state_nm)) { myAreaList.push(state_nm); }
                }

                // Missing state code
                //
                else {
                    myLogger.info("Missing state code " + state_cd + " for site " +  site_no);
                }
                feature.properties.state_nm = state_nm;

                // Build list of sites for stations table
                //
                if(!stateInfo[state_cd]) { stateInfo[state_cd] = []; }
                if(stateInfo[state_cd].includes(site_no)) { stateInfo[state_cd].push(site_no); }

                // Build hash of site information
                //
                if(!mySiteInfo[site_no]) {
                    mySiteInfo[site_no] = {};

                    // Build hash of site information
                    //
                    var ColumnsL = Object.keys(feature.properties);

                    for (myColumn of ColumnsL) {
                        mySiteInfo[site_no][myColumn] = feature.properties[myColumn]
                    }

                    let mySiteRecord = {}
                    for (myColumn of ['site_no', 'state_nm', 'status', 'funding', 'collection_type', 'reason']) {
                        mySiteRecord[myColumn] = feature.properties[myColumn]
                    }

                    mySitesList.push(mySiteRecord)
                }

	        return L.marker(latlng, { pane: 'allSites', icon: myIcon, title: site_no , site_no: site_no } );
            }
	},
        onEachFeature: function (feature, layer) {

            // Set
            //
            layer.setOpacity(0.0);
        }
    });
    myLogger.debug("mySiteInfo");
    myLogger.debug(mySiteInfo);
    myLogger.debug("mySitesList");
    myLogger.debug(mySitesList);

    // Add states
    //
    myLogger.debug("usaPolygon");
    myLogger.debug(myStates);
    dummyPane = map.createPane('statesBoundary');
    map.getPane('statesBoundary').style.pointerEvents = 'none';
    map.getPane('statesBoundary').style.zIndex = 600;

    usaPolygon = L.geoJson(myStates, {
        pane: 'statesBoundary',
        style: {
            color: '#555', // Outline color
            weight: 0,       // Outline width
            opacity: 0.0,    // Outline opacity
            fillColor: '#555555',
            fillOpacity: 0.0
        }
    }).addTo(map);

    // Set map extent
    //
    map.fitBounds(allSites.getBounds());

    // Add all sites
    //
    allSites.addTo(map);
    allSites.setStyle({
        opacity: 0.0,      // Controls the stroke/border opacity
        fillOpacity: 0.0   // Controls the interior fill opacity
    });
    
    // Add base map
    //
    map.addLayer(USGSTopoBasemap);

    // Add scale
    //
    L.control.scale().addTo(map);

    // Build area selection in left panel
    //
    buildAreaList(myAreaList);

    // Add home button
    //
    var zoom_bar = new L.Control.ZoomBar({position: 'topleft'}).addTo(map);

    // Refresh sites on extent change by zoom/pan of zoombar
    //  Home doesn't work properly not using initial map extent
    //
    $('.leaflet-control-zoom-in').click(function() {
        myLogger.debug('ZoomIn');
    });
    $('.leaflet-control-zoom-out').click(function() {
        myLogger.debug('ZoomOut');
    });
    $('.leaflet-control-zoom-to-start').click(function() {
        myLogger.debug('ZoomHome');
        $('#select-area').val('All states and territories').trigger('change');
    });

    // Pan/Zoom and Home events
    //
    map.on('moveend', function(evt) {
        myLogger.debug('Move');

        // Close popup
        //
        map.closePopup();

        // Determine sites and build map
        //
        mySiteSet = buildSiteList('moveEvent')
        
        // Set site counts
        //
        SetSiteCounts (mySiteSet)
        
        // Create map
        //
        createTable(mySiteSet);
    });

    // Zoom to selected site in table
    //
    jQuery(".zoomToSite").click(function() {

        // Close popup
        //
        map.closePopup();

        var Id          = this.id;
        var site_no     = Id.split(/[_]+/)[1];
        zoomToSite(mySiteInfo[site_no]);
    });

    // Determine sites
    //
    let mySiteSet =  buildSiteList('noEvent');
    //mySiteSet = mySitesList.map(site => site.site_no);

    // Set site counts
    //
    SetSiteCounts(mySiteSet)

    // Build table
    //
    createTable(mySiteSet);

    // Close message
    //
    fadeModal(3000);
}

// ==================================================
// Functions
// ==================================================

// Determine icon
//
function setIcon(site_no, site_tp_cd, status)
  {
   var iconType   = [];

   switch(site_tp_cd.toUpperCase())
     {
       case "DISCHARGE":
       case "STAGE":
       case "STREAMFLOW":
       case "ST":
         iconType.push('sw');
         break;
       case "ST-TS":
         iconType.push('sw');
         break;
       case "ST-CA":
         iconType.push('sw');
         break;
       case "SP":
         iconType.push('sw');
         break;

       default:
         iconType.push('ot');
         break;
     }

   switch(status.toLowerCase())
     {
       case "threatened":
       case "endangered":
         iconColor = 'red';
         break;
       case "rescued":
         iconColor = 'blue';
         break;
       case "discontinued":
         iconColor = 'grey';
         break;
       case "highlight":
         iconColor = 'yellow';
         break;
       default:
         iconColor = 'grey';
         break;
     }

   var iconUrl  = './icons/' + [iconColor, iconType].join("_") + '.png';
   var iconSize = [16,22];

   return L.icon({
                 iconUrl: iconUrl,
                 iconSize: iconSize,
                 iconAnchor: [5,30],
                 popupAnchor: [0, -20],
                 className: site_no
                });
}

// Set status type
//
function setStatusType(status) {

    // Check status types
    //
    switch(status.toUpperCase())
       {
        case 'THREATENED':
                          statusType = "Endangered";
                          break;
        case 'ENDANGERED':
                          statusType = "Endangered";
                          break;
        case 'DISCONTINUED':
                          statusType = "Discontinued";
                          break;
        case 'RESCUED':
                          statusType = "Rescued";
                          break;
        default:
                          statusType = "Endangered";
       }

    return statusType;
}


// Set collection type
//
function setCollectionType(collection_type) {

    switch(collection_type.toUpperCase())
       {
        case 'CONTINUOUS':
                          collectionType = "Continuous";
                          break;
        case 'PARTIAL':
                          collectionType = "Partial-Record";
                          break;
        default:
                          collectionType = "Continuous";
       }

    return collectionType;
}

// Zoom to site
//
function zoomToSite (siteInfo) {
     //myLogger.info("Zoom to site " + site_no);

    if(siteInfo.site_no) {
        var dec_lat_va  = siteInfo.dec_lat_va;
        var dec_long_va = siteInfo.dec_long_va;
        map.setView([dec_lat_va, dec_long_va], 15);
    }
    else {
        alert("The map does not contain the site " + site_no + " requested.  Super sorry.");
    }
    
    window.location = "#map";
}
        
// Set location for site
//
function filterByArea(myArea, state_nm) {

    var myAreaTest = new RegExp(myArea, "i");

    var areaFlag = false;

    if(/^all/i.test(myArea)) {
        areaFlag = true;
    }

    else if(myAreaTest.test(state_nm)) {
        areaFlag = true;
    }
    //myLogger.info(`  filterByArea --> myArea ${myArea} site ${state_nm} -------> ${areaFlag}`);

   return areaFlag;
  }
        
// Set funding level for site
//
function filterByStatus(siteStatus) {

    // Set regex
    //
    var myStatusTest = new RegExp(myStatus.replace("/","-"), "i");

    // Check regex
    //
    var statusFlag = false;

    if(/^all/i.test(myStatus))
      {
       statusFlag = true;
      }

    else if(myStatusTest.test(siteStatus))
      {
       statusFlag = true;
      }

    //myLogger.info(`  filterByStatus --> myStatus ${myStatus} siteStatus ${siteStatus} -------> ${statusFlag}`);

   return statusFlag;
  }
        
// Set funding level for site
//
function filterByFunding(siteFunding) {

    // Set regex
    //
    var myFundingTest = new RegExp(myFunding.replace("/","-"), "i");

    // Check regex
    //
    var fundingFlag = false;
    
    if(/^all/i.test(myFunding))
      {
       fundingFlag = true;
      }

    else if(myFundingTest.test(siteFunding))
      {
       fundingFlag = true;
      }
    //myLogger.info(`  filterByFunding --> myFunding ${myFunding} siteFunding ${siteFunding} -------> ${fundingFlag}`);

    return fundingFlag;
   }
        
// Set reason level for site
//
function filterByReason(siteReason) {

    // Set regex
    //
    var myReasonTest = new RegExp(myReason.replace("/","-"), "i");

    // Check regex
    //
    var reasonFlag = false;
    
    if(/^all/i.test(myReason))
      {
       reasonFlag = true;
      }

    else if(myReasonTest.test(siteReason))
      {
       reasonFlag = true;
      }
    //myLogger.info(`  filterByReason --> myReason ${myReason} siteReason ${siteReason} -------> ${reasonFlag}`);

    return reasonFlag;
   }

// Set site counts in status summary table
//
function SetSiteCounts (mySiteSet) {
    myLogger.debug("SetSiteCounts ");

    // Add counts to legend table directly beneath map
    //
    EndangeredRecords = mySitesList.filter(site => mySiteSet.includes(site.site_no) && site.status == 'Endangered')
    $(".NumberEndangered").text(EndangeredRecords.length);
    DiscontinuedRecords = mySitesList.filter(site => mySiteSet.includes(site.site_no) && site.status == 'Discontinued')
    $(".NumberDiscontinued").text(DiscontinuedRecords.length);
    RescuedRecords = mySitesList.filter(site => mySiteSet.includes(site.site_no) && site.status == 'Rescued')
    $(".NumberRescued").text(RescuedRecords.length);
    $(".TotalStations").text(`${EndangeredRecords.length + DiscontinuedRecords.length + RescuedRecords.length}`);

    return;
   }

// Build site summary table
//
function createTable (mySiteSet) {
    myLogger.debug("createTable ");

    var summary_table = [];
    var siteCount     = 0;
    var fpsCount      = 0;

    // Set object for geojson output
    //
    geojsonSites            = {};
    geojsonSites.type       = 'FeatureCollection';
    geojsonSites.features   = [];

    // Loop through sites
    //
    for(let i = 0; i <  mySiteSet.length; i++) {
        var site_no          = mySiteSet[i];
        var agency_cd        = mySiteInfo[site_no].agency_cd;
        var station_nm       = mySiteInfo[site_no].station_nm;
        var state_nm         = mySiteInfo[site_no].state_nm;
        var fps              = mySiteInfo[site_no].fps;

        if(fps == 'Yes') { fpsCount++; }
    }

    // Prepare table
    //
    var caption = `USGS Streamgages - ${mySiteSet.length} sites (includes ${fpsCount} Federal Priority Streamgages)`;

    //summary_table.push(`<span id="stationsCaption" class="w-100 text-center fs-5 fw-bold">${caption}</span>`);
    summary_table.push('<table id="stationsTable" class="table table-striped-columns fs-5">');
    summary_table.push(`<caption id="stationsCaption" class="caption-top text-center fs-5 fw-bold border-bottom">${caption}</caption>`);
    summary_table.push('<thead class="text-start fs-6 fw-bold">');
    summary_table.push('<tr scope="row">');
    summary_table.push(' <th scope="col">Status</th>');
    summary_table.push(' <th scope="col">Status Detail</th>');
    summary_table.push(' <th scope="col">State Name</th>');
    summary_table.push(' <th scope="col">Site Number</th>');
    summary_table.push(' <th scope="col">Site Name</th>');
    summary_table.push(' <th scope="col">Record Length in Years</th>');
    summary_table.push(' <th scope="col">Federal Priority Streamgage</th>');
    // summary_table.push(' <th scope="col">Map</th>');
    summary_table.push(' <th scope="col">Comment</th>');
    summary_table.push('</tr>');
    summary_table.push('</thead>');

    summary_table.push('<tbody class="text-start fs-6 fw-bold">');

    // Loop through sites
    //
    for(var i = 0; i <  mySiteSet.length; i++) {
        var site_no          = mySiteSet[i];
        var agency_cd        = mySiteInfo[site_no].agency_cd;
        var station_nm       = mySiteInfo[site_no].station_nm;
        var state_nm         = mySiteInfo[site_no].state_nm;
        var status_types     = mySiteInfo[site_no].status;
        var status_detail    = mySiteInfo[site_no].reason;
        var site_types       = mySiteInfo[site_no].site_type;
        var collection_type  = mySiteInfo[site_no].collection_type;
        var number_years     = mySiteInfo[site_no].years_of_record;
        var comments         = mySiteInfo[site_no].remarks;
        var symbol           = mySiteInfo[site_no].symbol.options.iconUrl;
        var fps              = mySiteInfo[site_no].fps;
        var funding          = mySiteInfo[site_no].funding;
        if(fps == 'Yes') { fps = `  <a target="_blank" href="https://water.usgs.gov/networks/fps/index.html?state_nm=${state_nm}">${funding}</a>`; }
        //if(fps == 'Yes') { fps = `  <a target="_blank" href="https://water.usgs.gov/networks/fps/index.html?state_nm=${state_nm}">${fps} - ${funding}</a>`; }


        // Set object for geojson output
        //
        geojsonSites.features.push({
            'type' : 'Feature',
            'properties' : {
                'agency_cd': agency_cd,
                'site_no': site_no,
                'station_nm': station_nm,
                'state_nm': state_nm,
                'status': status_types,
                'fps': fps,
                'funding': funding,
                'collection_type': collection_type,
                'comments': comments,
                'monitoring_years': number_years
            },
            'geometry' : { 'type' : 'Point',
                           'coordinates' : [parseFloat(mySiteInfo[site_no].dec_long_va),
                                            parseFloat(mySiteInfo[site_no].dec_lat_va)]
                         }
        });
        
      var symbol_img_src   = '<img src="' + symbol + '" alt="' + status_types + '"> &nbsp;';
      
      var number_years_txt = number_years;
      
      var comment          = ' --';

      var tr_id            = 'id="tr_' + site_no + '" name="tr_' + site_no + '"';
           
      summary_table.push(`<tr scope="row" ${tr_id}>`);
      
      // Status and status details
      //
      summary_table.push(
                         ' <td scope="col" class="symbols">',
                         symbol_img_src,
                         status_types,
                         ' </td>'
                        );
      summary_table.push(
                         ' <td>',
                         status_detail,
                         ' </td>'
                        );
      // State
      //
      summary_table.push(
                         ' <td scope="col" class="stationName">',
                         state_nm,
                         ' </td>'
                        );
      
      // Group duplicate site number, station name, years, funding, comments
      //
      summary_table.push(
                         ' <td scope="col">',
                         '  <a target="_blank" href="https://waterdata.usgs.gov/monitoring-location/' + site_no + '/">' + site_no + '</a>',
                         //'  <a target="_blank" href="https://waterdata.usgs.gov/nwis/inventory/?site_no=' + site_no +'&agency_cd=' + agency_cd + '">' + site_no + '</a>',
                         ' </td>'
                        );
      summary_table.push(
                         ' <td scope="col" class="stationName">',
                         station_nm,
                         ' </td>'
                        );
      summary_table.push(
                         ' <td scope="col">',
                         number_years,
                         ' </td>'
                        );
      summary_table.push(
                         ' <td scope="col">',
                         fps,
                         ' </td>'
                        );
      // summary_table.push(
      //                    ' <td scope="col">',
      //                    '  <a target="_blank" href="https://waterdata.usgs.gov/nwis/nwismap/?site_no=' + site_no +'&agency_cd=' + agency_cd + '">Map</a>',
      //                    //'<div id="site_' + site_no + '" class="zoomToSite">Map</div>',
      //                    ' </td>'
      //                   );
      summary_table.push(
                         ' <td scope="col">',
                         comments,
                         ' </td>'
                        );
      summary_table.push('</tr>');
     }
	
   summary_table.push('</tbody>');
	
   summary_table.push('</table>');

    // Build table
    //
    $('#siteTable').html("");
    $("#siteTable").html(summary_table.join("\n"));
    te_DataTable("#stationsTable",
                 `${caption}`,
                 "Funding_" + myArea);
 
   return summary_table.join("\n");
  }