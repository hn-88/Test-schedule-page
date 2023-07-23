
/*
function doGet() {

  return HtmlService.createHtmlOutputFromFile('resptable')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
/*
   results = getTodayAsia();
  return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
      
};*/

function getMainContent() {
  return "<div>This is new HTML!</div>";
};

function getTodayAsia() {
  //use filters to make it faster maybe
  // https://yamm.com/blog/create-filters-in-google-sheets-with-google-apps-script/

}

//https://developers.google.com/apps-script/guides/html/templates#index.html_3
function doGet() {
  return HtmlService
      .createTemplateFromFile('AjaxExample')
      .evaluate()
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  // return ContentService.createTextOutput(
  //   JSON.stringify(test_getSheetsQueryResult(1,'2022-12-01 23:59:59','2022-12-10 23:59:59')) )
  //   .setMimeType(ContentService.MimeType.JSON);
}

function getData() {
  var searchValue = '2022-12-12';
  var streamdailydata = SpreadsheetApp
      .getActiveSpreadsheet().getSheetByName('streamdaily')
      .getDataRange()
      .getValues();

  var f = streamdailydata.filter(function(e) {return e[3].includes(searchValue) } );
  Logger.log(f)
  // this takes around 25 seconds
if (f.length > 0) {
  return f;
} 
// else
return SpreadsheetApp
      .getActiveSpreadsheet().getSheetByName('streamdaily')
      .getRange(1,1)
      .getValues();

  
  /*return SpreadsheetApp
      .getActiveSpreadsheet().getSheetByName('streamdaily')
      .getDataRange()
      .getValues();
      */
}

function getDataWFilter() {

   

  var searchValue = '2022-12-12';
  var sheet1 = SpreadsheetApp
      .getActiveSpreadsheet().getSheetByName('streamdaily');
  var range = sheet1.getRange("D2:D");
  const  filter = range.createFilter();
    
  const  Filter_Criteria2 = SpreadsheetApp.newFilterCriteria().whenTextContains(["2022-12-12"]);
  const columntofilter = 4;
    
  const  add_filter2 = filter.setColumnFilterCriteria(columntofilter,Filter_Criteria2);

  Logger.log(add_filter2.getRange().getA1Notation());
  // This took 32 seconds.

  // var streamdailydata = SpreadsheetApp
  //     .getActiveSpreadsheet().getSheetByName('streamdaily')
  //     .getDataRange()
  //     .getValues();

  //var f = range.getValues();
  // for some reason, this is not giving the filtered values. Maybe the column is wrong.
  //Logger.log(f)
  // this takes around 25 seconds

//add_filter2.remove();

//if (f.length > 0) {
//  return f;
//} 
// else
// return SpreadsheetApp
//       .getActiveSpreadsheet().getSheetByName('streamdaily')
//       .getRange(1,1)
//       .getValues();

  
  /*return SpreadsheetApp
      .getActiveSpreadsheet().getSheetByName('streamdaily')
      .getDataRange()
      .getValues();
      */
}


// next we can try getting the data from mysql 
// and see if it is faster than the 26 seconds for filter
// https://www.pbainbridge.co.uk/2019/12/get-data-from-sql-table-in-apps-script.html
function getDatafromMysql() {
  // Database Credentials
  var dbAddress    = 'ipaddress;
  var dbUser       = 'user';
  var dbPassword   = 'pw';
  var dbName       = '_db_name';

  // connect to SQL database
  var db = Jdbc.getConnection('jdbc:mysql://' + dbAddress + ':3306/' + dbName, dbUser, dbPassword);
  var stmt = db.createStatement();
  var TableData = stmt.executeQuery("select vu.id, vu.username, vu.firstname, vu.lastname from vv_user vu where vu.idnumber = 'CET000'");
  //https://stackoverflow.com/questions/24547406/resultset-into-2d-array
  //https://stackoverflow.com/questions/52867326/how-to-add-values-to-two-dimensional-array-with-for-loops-using-google-apps-scri
  var metadata = TableData.getMetaData();
  var numberOfColumns = metadata.getColumnCount();
  var i=0;
  var resultasarray = [];  
  
  while (TableData.next()) {
    var rowvals = [];

    for (var j = 0; j < numberOfColumns; j++) {
        rowvals.push(TableData.getString(j+1));
        //Logger.log(TableData.getString(j+1))
    }
    resultasarray.push(rowvals)
    i++;
  }
  // this takes around 6 seconds due to the loop.
  Logger.log(resultasarray);
  return resultasarray;
}

// now trying https://developers.google.com/apps-script/guides/html/best-practices
function getLotsOfThings() {
  //return getDatafromMysql();
  //return getData();
  return test_getSheetsQueryResult(1,'2022-12-08 23:59:59','2022-12-09 23:59:59')
  

}



// https://stackoverflow.com/questions/22330542/can-i-use-google-visualization-api-to-query-a-spreadsheet-in-apps-script
/*   
  Types:

    Get             Return
    number    =>    number
    string    =>    string
    date      =>    string
    datetime  =>    string
    boolean   =>    boolean

  Note: 

    The function returns strings for dates because of 2 resons:
      1. The string is automatically converted into a date when pasted into the sheet
      2. There are multiple issues with dates (like different time zones) that could modify returned values
*/
function getSheetsQueryResult_(fileId, sheetName, rangeA1, sqlText)
{

  var file = SpreadsheetApp.openById(fileId);
  var sheetId = file.getSheetByName(sheetName).getSheetId();

  var request = 'https://docs.google.com/spreadsheets/d/' + fileId + '/gviz/tq?gid=' + sheetId + '&range=' + rangeA1 + '&tq=' + encodeURIComponent(sqlText);
  var result = UrlFetchApp.fetch(request).getContentText(); 
  //Logger.log(result)    
  // get json object
  var from = result.indexOf("{");
  var to   = result.lastIndexOf("}")+1;  
  var jsonText = result.slice(from, to);  
  var parsedText = JSON.parse(jsonText); 

  try {     

    // get types
    var types = [];
    var addType_ = function(col) { types.push(col.type); }
    var cols = parsedText.table.cols;
    // above line gives error TypeError: Cannot read properties of undefined (reading 'cols')
    // that was due to "Query error"
    cols.forEach(addType_);    

    // loop rows
    var rows = parsedText.table.rows;  
    var result = [];  
    var rowQuery = [];
    var eltQuery = {};
    var row = [];
    var nRows = rows[0].c.length;
    var type = '';
    for (var i = 0, l = rows.length; i < l; i++)
    {
      rowQuery = rows[i].c;
      row = [];
      // loop values   
      for (var k = 0; k < nRows; k++)
      {
        eltQuery = rowQuery[k];
        type = types[k];
        //if (type === 'number') { row.push(parseInt(eltQuery.v)); } // this causes number fields to be duplicated.
        if (type === 'boolean' || type === 'string') { row.push(eltQuery.v); }
        else { row.push(eltQuery.f); }      
      }    
      result.push(row);
    }
  }
  catch(err) {
    var result = [];
    result.push(err);
    Logger.log("Error - either query returned no results or syntax error - "+err);
    // this results in blank screen in final output, probably that is OK
  }

  return result;

}

function test_getSheetsQueryResult(streamId,strFrom,strTo)
{
  //var fileId = 'REMOVED-w22EdE'; //this is Test schedule page resp sheet
  //streamId = 6;
  //strFrom = '2022-12-09 23:59:59';
  //strTo = '2022-12-10 19:59:59';

  var fileId = 'REMOVED-ZiZh5XI'; // this is streamdata testing sheet
  var sheetName = 'streamdata';
  var rangeA1 = 'A2:N';
  var sqlText = `select  B, C, D, E, G, H, I, M 
    where D > datetime '`+strFrom+ `'  
    and D < datetime '`+strTo+ `'
    and A contains `+streamId+`
    order by D `;
  // var rangeA1 = 'A1:H11';
  // var sqlText = "select A, C, D, F, 'google' where E > 0";

  var res = getSheetsQueryResult_(fileId, sheetName, rangeA1, sqlText);
  Logger.log(res);     
  return res; 

}

function test_getfnamesQueryResult(fids)
{
  //var fileId = '1RN6cIKMXBMz-YbJa14DQKGPRXAyMdmyqIGnB-w22EdE'; //this is Test schedule page resp sheet
  //streamId = 6;
  //strFrom = '2022-12-09 23:59:59';
  //strTo = '2022-12-10 19:59:59';
  var fids = "291,422";
  var fidsarray = fids.split(',');

  var fileId = '19LAiAh0wf4AEFrTVjJOyy42Vdcc0PHcYZTpVfQw-tVs'; // this is csv importer sheet
  var sheetName = 'radiosaifilemaster';
  var rangeA1 = 'A2:B';
  var sqlText = `select  A, B 
    where A matches `+fidsarray[0]+`
    or A matches `+fidsarray[1];
  // var rangeA1 = 'A1:H11';
  // var sqlText = "select A, C, D, F, 'google' where E > 0";

  var res = getSheetsQueryResult_(fileId, sheetName, rangeA1, sqlText);
  Logger.log(res);     
  return res; 

}

function testphpvariables()
{
  $maxDate='2002';
  Logger.log($maxDate)
}

function testdeletingrows()
{
  
}
