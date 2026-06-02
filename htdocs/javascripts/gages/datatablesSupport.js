/**
 * Namespace: datatablesSupport
 *
 * datatablesSupport is a JavaScript library to provide a set of functions to build
 *  a table with buttons to export table content.
 *
 * $Id: /var/www/html/fundingstability/javascripts/gages/datatablesSupport.js, v None 2026/06/01 14:44:48 llorzol Exp $
 * $Revision: None $
 * $Date: 2026/06/01 14:44:48 $
 * $Author: llorzol $
 * $Revision: 1.66 $
 * $Date: 2026/06/01 13:54:27 $
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
//let activeRe        = new RegExp(/(^<img)\s+(\w+)Green-Triangle.gif")');
//let discontinuedRed = new RegExp(/[<img src="Symbols/Red-Triangle.gif">]/);
                   //data.replace( /(^<img)\s+(\w+)Green-Triangle.gif(\w+)/, 'X' ) :

var te_excelButton = 
  {
   exportOptions: {
       format: {
           body: function ( data, row, column, node ) {

               // Strip href
               //
               //var data = column > 0 || column < 2 ? data.replace( /^<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)/i, 'Yes' ) : data;
               //var data = column > 0 || column < 2 ? data.replace( /^(<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)(\d+))/i, 'Yes' ) : data;
               //var data = column > 0 || column < 2 ? data.replace( /^(<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)(\d+)*">)((\d+))<\/a>/i, $6 ) : data;
               var data = column > 0 || column < 2 ? data.replace( /^(<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)(\d+)*">)/i, '' ) : data;
               data     = column > 0 || column < 2 ? data.replace( /(<\/a>)$/i, '' ) : data;
               data     = column === 0 ? data.replace( /^(<span class="site_no">)/i, '' ) : data;
               data     = column === 0 ? data.replace( /(<\/span>)$/i, '' ) : data;

               // Strip img tag
               //
               var data = column === 0 ? data.replace( /<img .*?>/, '' ) : data;
               var data = column === 0 ? data.replace( /&nbsp;/, '' ) : data;

               return data;
         }
       }
     }
  }

var excelButtonSave = 
  {
   exportOptions: {
       format: {
           body: function ( data, row, column, node ) {

               // Strip img tag
               //
               return column == 0 ?
                   data.replace( /<img src="\.\/\w+\/\w+.png">/, '' ) :
                   data;
         }
       }
     }
  }

var printButton = 
  {
   exportOptions: {
       format: {
           body: function (data, row, column, node ) {
               //jQuery('.stations_table > caption' ).remove();
               return data;
         }
       }
     }
  }

// Describes Excel structure
//
//    https://datatables.net/reference/button/excelHtml5#Customisation
//    https://docs.sheetjs.com/
//    http://officeopenxml.com/SSstyles.php
//
function te_DataTable (tableSelector, myTitle, excelFileName) 
  {
     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     jQuery(tableSelector).DataTable( {
         rowGroup: {dataSrc: 1 },
        "paging":    false,
         scrollCollapse: true,
         scrollY: '40vh',
        "ordering":  true,
        //"info":      false,
        //"searching": false,
        "autoWidth": true,
        "stripeClasses": [],
         "bAutoWidth": false,
        "order": [[2, 'asc' ],[3, 'asc' ]],
        dom: 'Bfrtip',
        buttons: [
            $.extend( true, {}, te_excelButton, {
                extend: 'excelHtml5',
                text: 'Excel',
                sheetName: "T&E",
                messageTop: myTitle,
                title: '',
                filename: excelFileName,
                exportOptions: { columns: [0, 1, 2, 3, 4, 5, 7],
                                 rows: ':visible'
                               },
                customize: function ( xlsx ) {
                    var sheet = xlsx.xl.worksheets['sheet1.xml'];

                    // Highlight table caption
                    //
                    $('row:first c', sheet).attr( 's', '42' );
 
                    // Left justify column A for all rows except row 1
                    //  [not working ??]
                    //
                    $('row:gt(0) c[r="A"]', sheet).attr( 's', '50' );
 
                    // Set column A to text for all rows except row 1
                    //
                    $('row:gt(0) c[r="A"]', sheet).attr( 's', '0' );
                }
            } ),
            $.extend( true, {}, printButton, {
                extend: 'print',
                title: myTitle,
                autoPrint: false
            } ),
            {
                extend: 'pdfHtml5',
                messageTop: myTitle,
                autoPrint: false,
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7],
                    rows: ':visible'
                },
                customize: function (doc) {
                    doc.defaultStyle.fontSize = 8;
                    doc.styles.tableHeader.fontSize = 8;
                }
            },
            {
                text: 'Geojson',
                autoPrint: true,
                action: function ( e, dt, node, config ) {
                    message = 'Exporting sites in geojson format';
                    openModal(message);
                    fadeModal(3000);
                    var file = 'Threatened-Endangered.geojson';
                      saveAs(new File([JSON.stringify(geojsonSites)], file, {
                        type: "text/plain;charset=utf-8"
                      }), file);
                }
            }
        ]
     });
  }

// Describes Excel structure
//
//    https://datatables.net/reference/button/excelHtml5#Customisation
//    https://docs.sheetjs.com/
//    http://officeopenxml.com/SSstyles.php
//
function te_DataTableSave (tableSelector, myTitle, excelFileName) 
  {
     console.log("datatablesInit " + jQuery(tableSelector).length);

     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     jQuery(tableSelector).DataTable( {
        "paging":    false,
        "ordering":  true,
        "info":      false,
        "searching": false,
        "autoWidth": true,
        "stripeClasses": [],
        "fixedHeader": { header: true, footer: false, headerOffset: $('#fixed').height() },
//        "columnDefs": [
//            { "type": "html", "targets": 0 }
//        ],
        dom: 'Bfrtip',
        "order": [[1, 'asc' ],[2, 'asc' ]],
        buttons: [
            $.extend( true, {}, te_excelButton, {
                extend: 'excelHtml5',
                exportOptions: { columns: [0, 1, 2, 3, 4, 5, 7] },
                title: '',
                messageTop: myTitle,
                sheetName: "T&E",
                filename: excelFileName,
                customize: function ( xlsx ) {
                    var sheet = xlsx.xl.worksheets['sheet1.xml'];

                    // Highlight table caption
                    //
                    $('row:first c', sheet).attr( 's', '42' );
 
                    // Left justify column A for all rows except row 1
                    //  [not working ??]
                    //
                    $('row:gt(0) c[r="A"]', sheet).attr( 's', '50' );
 
                    // Set column A to text for all rows except row 1
                    //
                    $('row:gt(0) c[r="A"]', sheet).attr( 's', '0' );
                }
            } ),
            $.extend( true, {}, printButton, {
                extend: 'print',
                title: myTitle,
                autoPrint: false
            } )
        ]
     });
  }

function minDataTables (tableSelector, myTitle) 
  {
     console.log("datatablesInit " + jQuery(tableSelector).length);

     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     jQuery(tableSelector).DataTable( {
        "paging":    false,
        "ordering":  true,
        "info":      false,
        "searching": false,
        "autoWidth": true,
        "stripeClasses": [],
        dom: 'Bfrtip',
        "bAutoWidth": false,
        "order": [[1, 'asc' ]],
        buttons: [
            {
                extend: 'excelHtml5',
                title: '',
                sheetName: myTitle
            },
            {
                extend: 'print',
                autoPrint: false
            },
            {
                text: 'Site Customer Approval Tool',
                action: function ( e, dt, node, config ) {
                            url          = 'index.html?wsc_id=' + wsc_id;
                            var myWindow = window.open(url, '_blank', '');
                               
                            // Change title
                            // 
                            //jQuery(myWindow.document).prop("title", "Customer Summary of All Active Sites for " + wsc_name);
                            myWindow.focus();
                }
            }
        ]
     });
  }

// Works but no preprocessing of Excel table
//
function maxDataTables (tableSelector, myTitle) 
  {
     console.log("datatablesInit " + jQuery(tableSelector).length);

     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     jQuery(tableSelector).DataTable( {
        "paging":    false,
        "ordering":  true,
        "info":      false,
        "searching": false,
        "autoWidth": true,
        "stripeClasses": [],
        dom: 'Bfrtip',
        "order": [[1, 'asc' ]],
        buttons: [
            $.extend( true, {}, excelButton, {
                extend: 'excelHtml5',
                columns: [0, 1, 2, 3, 4, 5, 6, 7],
                title: '',
                messageTop: myTitle,
                sheetName: "FPS sheet"
            } ),
            $.extend( true, {}, printButton, {
                extend: 'print',
                title: myTitle,
                //messageTop: myTitle,
                customize: function ( win ) {
                    jQuery('.customerHeader' )
                         .preappend('<p>');
                    jQuery('.customerHeader' )
                         .append('/p>');
                },
                autoPrint: false
            } )
        ]
     });
  }

// https://regex101.com/r/eR2oH3/24
// https://datatables.net/reference/button/excelHtml5#Built-in-styles
// https://stackoverflow.com/questions/41485310/exporting-jquery-datatable-to-excel-with-additional-rows-is-not-working-ie
// https://stackoverflow.com/questions/61313581/jquery-datatable-export-to-excel-customization-make-first-row-bold
// https://stackoverflow.com/questions/40243616/jquery-datatables-export-to-excelhtml5-hyperlink-issue
// https://stackoverflow.com/questions/41230596/datatables-how-to-fill-a-column-with-a-hyperlink
// https://datatables.net/extensions/buttons/examples/html5/titleMessage.html
//
function exportCustomExcel (tableSelector, myTitle) 
  {
     console.log("datatablesInit " + jQuery(tableSelector).length);

     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     jQuery(tableSelector).DataTable( {
        "paging":    false,
        "ordering":  true,
        "info":      false,
        "searching": false,
        "autoWidth": true,
        "stripeClasses": [],
        dom: 'Bfrtip',
        "order": [[1, 'asc' ]],
        buttons: [
            $.extend( true, {}, excelButton, {
                extend: 'excelHtml5',
                columns: [0, 1, 2, 3, 4, 5, 6, 7],
                title: '',
                messageTop: myTitle,
                sheetName: "FPS",
                customize: function ( xlsx ) {
                    var sheet = xlsx.xl.worksheets['sheet1.xml'];
                    $('row:first c', sheet).attr( 's', '42' );

                    // Loop over all cells in sheet
                    //
                    //$('row a', sheet).each( function () {
                    $('row href', sheet).each( function () {
                        console.log(" Row " + $(this).text());

                        // If cell starts with http
                        //
                        if ( $('is t', this).text().indexOf("<a href") === 0 ) {

                           // (2.) change the type to `str` which is a formula
                           //
                           $(this).attr('t', 'str');
                           
                           // Append the formula
                           //
                           $(this).append('<f>' + 'HYPERLINK("'+$('is t', this).text()+'","'+$('is t', this).text()+'")'+ '</f>');
                           
                           // Remove the inlineStr
                           //
                           $('is', this).remove();
                           
                           // (3.) underline
                           //
                           $(this).attr( 's', '4' );
                       }
                    });
                }
            } ),
            $.extend( true, {}, printButton, {
                extend: 'print',
                title: myTitle,
                autoPrint: false
            } )
        ]
     });
  }

function datatablesExport (tableSelector) 
  {
   var tableSelector = '#' + tableSelector;

     console.log("datatablesExport " + jQuery(tableSelector).length);

     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     jQuery(tableSelector).DataTable( {
        "paging":    false,
        "ordering":  false,
        "info":      false,
        "searching": false,
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'csv',
                autoClose: true,
                filename: 'file_name'
            }
        ]
     });

   $(".dt-buttons").hide();
   $('.buttons-csv').click()
  }

function datatablesFull (tableSelector, myTitle) 
  {
     console.log("datatablesExport " + jQuery(tableSelector).length);


     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     jQuery(tableSelector).DataTable( {
        "paging":    false,
        "ordering":  true,
        "info":      false,
        "searching": false,
        "stripeClasses": [],
        dom: 'Bfrtip',
        "order": [[1]],
        buttons: [
            {
                extend: 'excelHtml5',
                title: '',
                sheetName: myTitle
            },
            {
                extend: 'print',
                autoPrint: false
            }
        ]
     });
  }

function datatablesSearch () 
  {
     console.log("datatablesSearch " + jQuery("#employee_table").length);

     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     jQuery("#employee_table").DataTable( {
         //'searching': true,
         //'search': "Search for individual",
         'paging': false,
         'ordering': false,
         'info': false
     });

  }

function datatablesDestroy (tableSelector) 
  {
  console.log("datatablesDestroy " + jQuery(tableSelector).length);
  
  var table = $(tableSelector).DataTable();
  //console.log(table);
  
  table.destroy();
  
  jQuery(tableSelector).empty(); // empty in case the columns change

  console.log("Destroyed " + jQuery(tableSelector).length);
  }