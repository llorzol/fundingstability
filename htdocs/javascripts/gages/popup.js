/**
 * Namespace: Popup Functions
 *
 * Provides set of functions to build a Popup.
 *
 * $Id: /var/www/html/fundingstability/javascripts/gages/popup.js, v 2.82 2026/06/01 14:46:45 llorzol Exp $
 * $Revision: 2.82 $
 * $Date: 2026/06/01 14:46:45 $
 * $Author: llorzol $
*/

/*
###############################################################################
# Copyright (c) 2018 U.S. Geological Survey
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

// Popup specs
//
var popupOptions = { 'maxHeight': '250', 'maxWidth': '300', offset: new L.Point(0, -15) };

// Adds a new DIV table row with two columns
//
function addTableRow(col1, col2) {
	var content = '<div class="divTableRow">';
	content    += ' <div class="divTableCell">';
	content    += col1;
	content    += ' </div>';
	content    += ' <div class="divTableCell">';
	content    += col2;
	content    += ' </div>';
	content    += '</div>';

	return content;
}

// Adds a new DIV table row with two columns
//
function addDivSeparator2() {
	var content = '<div class="divTableRow">';
	content    += ' <hr class="divSeparator"></hr>';
	content    += '</div>';

	return content;
}

// Adds a new DIV table row with two columns
//
function addDivSeparator() {
	var content = '<div class="divTableRow">';
	content    += ' <div class="divTableCell">';
	content    += '  <hr class="divSeparator"></hr>';
	content    += ' </div>';
	content    += ' <div class="divTableCell">';
	content    += '  <hr class="divSeparator"></hr>';
	content    += ' </div>';
	content    += '</div>';

	return content;
}

// Build popup
//
function createPopUp(site, site_no) {
    myLogger.debug(`createPopUp for site ${site_no}`);
    myLogger.debug(`Clicked site ${site_no}`);

    //  Set information
    //
    let agency_cd            = mySiteInfo[site_no].agency_cd;
    let station_nm           = mySiteInfo[site_no].station_nm;
    //let site_tp_cd           = mySiteInfo[site_no].site_tp_cd;
    let latitude             = mySiteInfo[site_no].latitude;
    let longitude            = mySiteInfo[site_no].longitude;
    let status               = mySiteInfo[site_no].status;
    let years_of_record      = mySiteInfo[site_no].years_of_record;

    //  Create Nwisweb entry
    //
    let inventory_url = `<a class="popupLink" href="https://waterdata.usgs.gov/monitoring-location/?site_no=${site_no}" target="_blank">${site_no}</a>`

    //  Create popup content
    //
    let popupContent  = '<div class="leaflet-popup-body">';
    popupContent     += '<div class="divTable">';
    popupContent     += '<div class="divTableBody">';

    //  Create General entries
    //
    popupContent     += addTableRow('<span class="label">Site Number:</span>', inventory_url);
    popupContent     += addTableRow('<span class="label">Site Name:</span>', station_nm);
    popupContent     += addTableRow('<span class="label">Site Status:</span>', status);
    //popupContent     += addTableRow('<span class="label">Record Length:</span>', years_of_record);
    //popupContent     += addTableRow('<span class="label">Latitude:</span>', latitude);
    //popupContent     += addTableRow('<span class="label">Longitude:</span>', longitude);
    popupContent     += addTableRow('<span class="label">For more site information:</span>',
                                    `<span id="${site_no}" class="clickToTable">Click for Table below</span>`)

    popupContent     += '</div></div></div>';

    // Highlight marker with popup
    //
    let popMarker = null;
    map.on('popupopen',function(e) {
        if(popMarker) { map.removeLayer(popMarker); }

        myIcon = setIcon (site_no, 'ST', 'highlight')
        popMarker = L.marker(e.popup.getLatLng(), { pane: 'customPane', icon: myIcon, title: `${site_no}` } ).addTo(map);
        
        // Enable selection of network and reset sites visible
        //
        $(".clickToTable").on( "click", function( e ) {
            let mySite  = $(this).prop('id');

            let table = $('#stationsTable').DataTable();
            table.search(site_no).draw();
        })
    });

    map.on('popupclose',function(e) {
        myLogger.debug(`popupclose`);
        if(popMarker) {
            map.removeLayer(popMarker);
            
            let table = $('#stationsTable').DataTable();
            table.search('').draw();
        }
    });

    // Open popup
    //
    let latlng  = L.latLng(latitude, longitude);
    let myPopup = new L.responsivePopup({ hasTip: false,
                                          autoPan: false,
                                          offset: [30, 30]}).setLatLng(latlng).setContent(popupContent).openOn(map);
    $(".leaflet-popup-close-button").before('<div class="leaflet-popup-title text-white">Site Information</div>');

    return;
}
function nowRetired () {
        
        // Enable selection of network and reset sites visible
        //
        $(".clickToTable").on( "click", function( e ) {
            let mySite  = $(this).prop('id');

            // Scroll down to table
            //
            document.getElementsByName("tr_" + mySite)[0].scrollIntoView();
            $("#tr_" + mySite).css("border", "3px solid red");
            //$("#tr_" + mySite).css("background-color", "#ede978");
            //$("#tr_" + mySite).css("bgcolor", "#ede978");
            setTimeout(function() {
                $("#tr_" + mySite).css("border", "1px solid black");
            }, 3000);
        });
}