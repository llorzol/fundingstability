/**
 * Namespace: leftPanel
 *
 * leftPanel is a JavaScript library to set of functions to build
 *  a list of sites in a left panel that is linked to the sites on
 *  on the web map.
 *
 $Id: /var/www/html/fundingstability/javascripts/gages/leftPanel.js, v None 2026/06/01 13:55:19 llorzol Exp $
 $Revision: None $
 $Date: 2026/06/01 13:55:19 $
 $Author: llorzol $
 $Revision: 3.18 $
 $Date: 2026/01/27 20:01:59 $
 $Author: llorzol $
 *
*/

/*
###############################################################################
# Copyright (c) U.S. Geological Survey Oregon Water Science Center
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

// Set default selection
//
$('#select-status').val('All status types');
$('#select-reason').val('All');
$('#select-funding').val('All funding levels');
    
// Builds list of areas 
//
function buildAreaList(myAreaList) {
    myLogger.debug("buildAreaList for sites ");
    //myLogger.debug("Current Area " + myArea);
    //myLogger.debug(myAreaList);

    let selectList = [];

    // Add to selection
    //
    myAreaList.sort();

    myAreaList.unshift('All states and territories');

    selectList.push('<select id="select-area" class="form-select">');

    // Loop through employees
    //
    for (let stateName of myAreaList) {
        selectList.push(`<option value="${stateName}">${stateName}</option>`);
    }
    selectList.push('</select>');

    // Build select feature
    //
    jQuery('.area-selection').html(selectList.join(""));

    // Set selection
    //
    $('#select-area').val('All states and territories');

    // Enable selection of states and territories
    //
    $("#select-area").on( "change", function( evt ) {
    //$("#select-area").on( "click", function( evt ) {

        let myArea = $('#select-area').val();
        myLogger.debug(`Area changed to ${myArea}`);

        if(/^all/i.test(myArea)) {

            // Set map extent
            //
            map.fitBounds(allSites.getBounds());

            // State polygons exists clear
            //
            usaPolygon.setStyle({
                color: '#555', // Outline color
                weight: 0,       // Outline width
                opacity: 0.0,    // Outline opacity
                fillColor: '#555555',
                fillOpacity: 0.0
            });
        }

        // State polygon
        //
        else {
            let myStateTest = new RegExp('\^' + myArea + '\$', "i");

            // State polygons exists clear
            //
            usaPolygon.setStyle({
                color: '#555', // Outline color
                weight: 0,       // Outline width
                opacity: 0.0,    // Outline opacity
                fillColor: '#555555',
                fillOpacity: 0.0
            });

            // Set state boundary
            //
            usaPolygon.eachLayer( function(layer) {
                stateName = layer.feature.properties.name

                if(myStateTest.test(stateName)) {
                    myLogger.debug(`Set state boundary to ${stateName}`);
                    stateBoundary = layer;
                    map.fitBounds(stateBoundary.getBounds());
                    layer.setStyle({
                        color: '#555555', // Outline color
                        weight: 2,       // Outline width
                        opacity: 1.0,    // Outline opacity
                        fillColor: '#555555',
                        fillOpacity: 0.15
                    });
                }
            });
        }
        // Create map and tables
        //
        //let mySiteSet = buildSiteList('areaEvent')
        //let siteTable = createTable(mySiteSet);
    });

    return;
}

// Monitor selection of status, reason, and fundingchoices
//
$("#select-status, #select-reason, #select-funding").on( "change", function( evt ) {
    myLogger.debug('Change of choice');
    myLogger.debug('One of the monitored elements changed:', $(this).val());
    const selectedValue = $(this).val();
    const elementId = $(this).attr('id');
    myLogger.debug(`Dropdown ${elementId} changed to: ${selectedValue}`);
    
    // Create map and tables
    //
    let mySiteSet = buildSiteList('selectionEvent')
    SetSiteCounts(mySiteSet)
    let siteTable = createTable(mySiteSet);
});

// Builds selected sites
//
function buildSiteList(myEvent) {
    myLogger.debug('------------- buildSiteList -------------');

   let mySiteSet   = [];
   let customList  = [];

    // Close popup
    //
    map.closePopup();

   // Check for all sites
   //
   if(!map.hasLayer(allSites))
     {
      map.addLayer(allSites);
     }

   // Remove existing custom sites
   //
   if(map.hasLayer(customSites))
     {
      map.removeLayer(customSites);
      customSites.clearLayers();
     }

    // Remove highlight marker
    //
    if(map.hasLayer(customSite)) {
        map.removeLayer(customSite);
        customSite.clearLayers();
    }

    // Set choices
    //
    myArea    = jQuery("#select-area").val();
    myStatus  = jQuery("#select-status").val();
    myFunding = jQuery("#select-funding").val();
    myReason  = jQuery("#select-reason").val();

    myLogger.debug(`buildSiteList => myEvent ${myEvent} myArea ${myArea} myStatus ${myStatus} myFunding ${myFunding} myReason ${myReason}`);

    // Set regex
    //
    var myAreaTest    = new RegExp(myArea, "i");
    var myStatusTest  = new RegExp(myStatus, "i");
    var myFundingTest = new RegExp(myFunding, "i");
    var myReasonTest  = new RegExp(myReason, "i");
    var myEventTest   = new RegExp(myEvent, "i");
    var myStateTest   = new RegExp('^' + myArea + '$', "i");

    // Loading message
    //
    //message = "Preparing map for " + myArea;
    //openModal(message);

    // Set map extent
    //
    mapBounds = map.getBounds();
        
   // Loop through sites in mapview
   //
    allSites.eachLayer(function(site) {
        
        let site_no = site.options.title;

        myLogger.debug(`myStatusTest ${mySiteSet.includes(site.site_no)} ${myStatusTest.test(mySiteInfo[site_no].status)} ${/^all/i.test(myStatus)}`)

        if(mySiteSet.includes(site.site_no) && (myStatusTest.test(site.status) || /^all/i.test(myStatus))) {
            myLogger.debug(`myStatusTest passed`)
        }

        // Mapextent
        //
        if(map.hasLayer(site)) {
            if(mapBounds.contains(site.getLatLng())) {

                site.setOpacity(0.0);

                // Mapextent true
                //
                let areaOpacity = true;

                // Status
                //
                let siteStatus = mySiteInfo[site_no].status;
                let statusOpacity  = filterByStatus(siteStatus);

                // Funding level
                //
                let siteFunding = mySiteInfo[site_no].funding;
                let fundingOpacity  = filterByFunding(siteFunding);

                // Reason level
                //
                //var siteReason = 'All';
                let siteReason = mySiteInfo[site_no].reason;
                let reasonOpacity  = filterByReason(siteReason);

                // Prepare
                //
                myLogger.debug(`Site ${site_no}:  Area--> ${myArea} = ${areaOpacity}   Status--> ${myStatus}->${siteStatus} = ${statusOpacity}   Funding--> ${myFunding}->${siteFunding} = ${fundingOpacity}   Reason--> ${myReason}->${siteReason} = ${reasonOpacity}`);

                // Passes
                //
                if(areaOpacity && statusOpacity && fundingOpacity && reasonOpacity) {

                    // Set marker
                    //
                    myIcon = mySiteInfo[site_no].symbol

                    // Add layer
                    //
                    let latlng  = L.latLng({ lat: mySiteInfo[site_no].latitude, lng: mySiteInfo[site_no].longitude });
                    var layer   = L.marker(latlng, {pane: 'customSites', icon: myIcon, title: site_no } );

                    // Popup and highlight/unhighlight site in list of left panel
                    //
                    layer.on({
                        click: (function(evt) { createPopUp(evt.target, site_no) }),
                    });

                    // Build custom layer
                    //
                    customList.push(layer);

                    // Add to list of selected sites
                    //
                    mySiteSet.push(site_no);

                    // Prepare bubble map
                    //
                    //site.setOpacity(1.0);
                }

                // Skip site
                //
                else {
                    site.unbindPopup();
                    site.off({
                        click: (function(evt) { nothing = 'nothing'; }),
                        //mouseover: (function(evt) { nothing = 'nothing'; }),
                        //mouseout: (function(evt) { nothing = 'nothing'; })
                    });
                }
            }
        }
    });

    //closeModal();

    myLogger.debug(`Selected ${mySiteSet.length} sites for ${myArea}`);

    // Build tables
    //
    if(mySiteSet.length > 0) {
        // Set custom sites
        //
        customSites = new L.FeatureGroup(customList);
        myLogger.debug('customSites');
        myLogger.debug(customSites);

        customSites.addTo(map).bringToFront();

        let statusRecords = mySitesList.filter(site =>  mySiteSet.includes(site.site_no) &&
                                               (myStatusTest.test(site.status) || /^all/i.test(myStatus)));
        myLogger.debug(`Filter for myStatus ${myStatus} for ${statusRecords.length}`)

        let fundingRecords = mySitesList.filter(site =>  mySiteSet.includes(site.site_no) &&
                                                (myFundingTest.test(site.funding) || /^all/i.test(myFunding)));
        myLogger.debug(`Filter for myFunding ${myFunding} for ${fundingRecords.length}`)

        let reasonRecords = mySitesList.filter(site =>  mySiteSet.includes(site.site_no) &&
                                                (myReasonTest.test(site.reason) || /^all/i.test(myReason)));
        myLogger.debug(`Filter for myReason ${myReason} for ${reasonRecords.length}`)

        let siteRecords = mySitesList.filter(site => mySiteSet.includes(site.site_no) &&
                                             (myStatusTest.test(site.status) || /^all/i.test(site.status)) &&
                                             (myFundingTest.test(site.funding) || /^all/i.test(site.funding)) &&
                                             (myReasonTest.test(site.reason) || /^all/i.test(site.reason)));
        myLogger.debug(`Full filter ${siteRecords.length}`)
    }

    // No selected sites
    //
    else {
        // Loading message
        //
        //message = "No sites were selected in " + myArea + " for " + myStatus + " status type(s)";
        message = "No sites were selected in mapextent";
        openModal(message);
        fadeModal(3000);

        // Remove rows and update table caption
        //
        var table = new DataTable('#stationsTable');

        table.clear().draw();

        var caption = `USGS Streamgages - 0 sites (includes 0 Federal Priority Streamgages)`;
        $('#stationsCaption').html(caption);
    }

    return mySiteSet
  }