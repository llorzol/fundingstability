/**
 * Namespace: Main
 *
 * Main is a JavaScript library to provide a set of functions to manage
 *  the web requests.
 *
 * $Id: /var/www/html/fundingstability/javascripts/gages/main.js, v 1.45 2026/06/01 14:46:54 llorzol Exp $
 * $Revision: 1.45 $
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
// Prevent jumping to top of page when clicking a href
//
jQuery('.noJump a').click(function(event){
   event.preventDefault();
});

// Global objects
//
var mySites             = {};
var mySiteInfo          = {};
var myFpsInfo           = {};
var myStates            = {};

var myArea              = null;
var myStatus            = null;
var myFunding           = null;
var myMessage           = null;

var myAreaList          = [];

// loglevel
//
let myLogger = log.getLogger('myLogger');
//myLogger.setLevel('debug');
myLogger.setLevel('info');

// Request data
//
$(document).ready(function() {

    // Loading message
    //
    message = "Preparing sites and basin information";
    openModal(message);
    fadeModal(3000);

    // Build ajax requests
    //
    const urls   = [];

    // Request for site information
    //
    urls.push("data/endangered_gage.geojson");

    // Request FPS information
    //
    urls.push("data/FPSSiteMaster.xml");

    // Request for us and states boundaries information
    //
    urls.push("data/states.json");

    // Request for states fips codes information
    //
    urls.push("https://api.waterdata.usgs.gov/ogcapi/v0/collections/states/items?limit=50000&sortby=country_code,state_fips_code&filter-lang=cql-text&filter=country_code%20LIKE%20%27US%%27&f=json");

    // Call the async function
    //
    webRequests(urls, 'text', processData)
});

function processData([mySites, myData, myStates, myStateJson]) {
    myLogger.debug("processData");
    myLogger.debug(mySites);
    myLogger.debug(myData);
    myLogger.debug(myStates);
    myLogger.debug(myStateJson);
 
    // Check for site data
    //
    if (!mySites) {

        // Warning message
        //
        message = `No site information for Endangered, Discontinued and Rescued Streamgages Mapper website`;
        myLogger.error.log(message);
        updateModal(message);
        fadeModal(3000);

        return false;
    }
    mySites = JSON.parse(mySites)
 
    // Check for funding data
    //
    if (!myData) {

        // Warning message
        //
        message = `No funding information for Endangered, Discontinued and Rescued Streamgages Mapper website`;
        myLogger.error.log(message);
        updateModal(message);
        fadeModal(3000);

        return false;
    }
 
    // Check for state boundary layer
    //
    if (!myStates) {

        // Warning message
        //
        message = `No state boundary layer information for Endangered, Discontinued and Rescued Streamgages Mapper website`;
        myLogger.error.log(message);
        updateModal(message);
        fadeModal(3000);

        return false;
    }
    myStates = JSON.parse(myStates)
 
    // Check for state information
    //
    if (!myStateJson) {

        // Warning message
        //
        message = `No state information for Endangered, Discontinued and Rescued Streamgages Mapper website`;
        myLogger.error.log(message);
        updateModal(message);
        fadeModal(3000);

        return false;
    }
    myStateJson = JSON.parse(myStateJson)

    // Processed FPS information
    //
    message = "Processed FPS information";
    openModal(message);
    fadeModal(2000);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(myData, "text/xml");
    //const myFpsData = xmlToJson(xmlDoc);
    var myFpsData = $.xml2json(xmlDoc); // Convert XML to JSON
    var myFpsList = myFpsData['#document']['FPSSites']['FPSSite'];
    for (let myFPS of myFpsList) {
        let mySite = myFPS.SiteNumber;
        let FPSFullFunding = myFPS.FPSFullFunding;
        let FPSPartialFunding = myFPS.FPSPartialFunding;
        let siteFunding = 'No FPS Funds';
        if(/^Y$/i.test(FPSFullFunding)) { siteFunding = "Full FPS funds"; }
        else if(/^Y$/i.test(FPSPartialFunding)) { siteFunding = "Partial FPS funds"; }
        myFpsInfo[mySite] = siteFunding;
    }
    //myLogger.info(myFpsData);
    //myLogger.info(myFpsData['#document']['FPSSites']['FPSSite']);

    // Processed States information
    //
    let myStateCodes = {};
    if(myStateJson.numberReturned) {
        if(myStateJson.numberReturned > 0) {
            for(let i = 0; i < myStateJson.numberReturned; i++) {

                // Features
                //
                let myRecords = myStateJson.features[i].properties;
                //myLogger.info(myRecords);
                
                let myStateCode = myRecords.state_fips_code;
                myStateCodes[myStateCode] = myRecords.state_name;
            }
        }
    }
    myLogger.debug('myStateCodes');
    myLogger.debug(myStateCodes);
    
    // Build map
    //
    buildMap(mySites, myFpsInfo, myStates, myStateCodes);
}
