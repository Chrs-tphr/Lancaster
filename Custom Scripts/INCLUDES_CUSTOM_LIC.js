/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM_LIC.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be available to all master scripts
|
| Notes   
|
|         
/------------------------------------------------------------------------------------------------------*/

function calcMonthsLate(date1){//date1 is the ASI Business Open Date (Application) or License Expiration Date (Renewal) passed by calculateLicAppRenewPenaltyFee
//		var fDate =  new Date("12/01/2016");

	var fDate = convertDate(fileDate); logDebug("fDate: "+fDate);
	var monthLate = 0;
	var yMonthLate = 0;
	var monthsLate = 0;
	
	if(date1 < fDate){
		
		var oMonth = date1.getMonth();
		var oYear = date1.getFullYear();
			logDebug("oMonth: "+oMonth+" oYear: "+oYear);
		
		var fDateMonth = fDate.getMonth();
		var fDateYear = fDate.getFullYear();
			logDebug("fDateMonth: "+fDateMonth+" fDateYear: "+fDateYear);
		
		if((oYear < fDateYear) || (oYear == fDateYear && oMonth < fDateMonth)){
			monthLate = (fDateMonth - oMonth); logDebug("Months late: "+ monthLate);
			yMonthLate = ((fDateYear - oYear)*12); logDebug("Years late: "+ yMonthLate);
			monthsLate = monthLate+yMonthLate;
		}
		logDebug("Total months late: "+ monthsLate);
		return monthsLate;
	}
}

function calculateLicAppRenewPenaltyFee(){
	var date1 = null;
	if(appTypeArray[3] == "Application"){
		var recType = "app";
		var date1 = convertDate(AInfo["Business Open Date"]);
		logDebug("Business Open Date: "+date1);
	}
	if(appTypeArray[3] == "Renewal"){
		var recType = "rnew";
		var parentLicenseCAPID = getParentLicenseCapID(capId);
		if (parentLicenseCAPID != null){
			var date1 = parentLicenseCAPID.getExpDate();
			logDebug("License Expiration Date: "+date1);
		}else{
			logDebug("No parent license found");
		}
	}
	if(date1){
		var monthsLate = calcMonthsLate(date1);
		var pPercent = 0;
		var pAmount = 0;
		if(monthsLate == 1) pPercent = 0.2;//20%
		if(monthsLate == 2) pPercent = 0.3;//30%
		if(monthsLate == 3) pPercent = 0.4;//40%
		if(monthsLate > 3 && monthsLate < 13) pPercent = 0.5;//50%
		if(monthsLate > 12 && monthsLate < 25) pPercent = 1.0;//100%
		if(monthsLate > 24) pPercent = 1.5;//150%
		logDebug("pPercent:" + pPercent);
		if(pPercent > 0){
			addFee("BLPN050","BL_PENALTY","FINAL",1,"N");//adds SG fee to get total fee amount to be penalized
			var lFee = feeAmount("BLPN050", "NEW");
			pAmount = lFee*pPercent;
			removeFee("BLPN050", "FINAL");//removes SG fee after penalty amount is calculated
			if(recType == "app"){
				updateFee("BLPN060","BL_PENALTY","FINAL",pAmount,"N");
			}
			if(recType == "rnew"){
				updateFee("BLPN060","BL_PENALTY","FINAL",pAmount,"N");
			}
		}
	}
	else logDebug("date1 was not set");
}

function daysBetween(date1, date2){
	if (typeof(date1) == "object") date1 = date1.toString(); //Added these because we can't always assume it's a string, ASIT dates are objects.
	if (typeof(date2) == "object") date2 = date2.toString(); //
	if (date1.indexOf("-") != -1) { date1 = date1.split("-"); } else if (date1.indexOf("/") != -1) { date1 = date1.split("/"); } else { return 0; }
	if (date2.indexOf("-") != -1) { date2 = date2.split("-"); } else if (date2.indexOf("/") != -1) { date2 = date2.split("/"); } else { return 0; }
	if (parseInt(date1[0], 10) >= 1000) {
		var sDate = new Date(date1[0]+"/"+date1[1]+"/"+date1[2]);
	} else if (parseInt(date1[2], 10) >= 1000) {
		var sDate = new Date(date1[2]+"/"+date1[0]+"/"+date1[1]); 
	} else {
		return 0;
	}
	if (parseInt(date2[0], 10) >= 1000) {
		var eDate = new Date(date2[0]+"/"+date2[1]+"/"+date2[2]);
	} else if (parseInt(date2[2], 10) >= 1000) {
		var eDate = new Date(date2[2]+"/"+date2[0]+"/"+date2[1]);
	} else {
		return 0;
	}
	var one_day = 1000*60*60*24;
	var daysApart = Math.abs(Math.ceil((sDate.getTime()-eDate.getTime())/one_day));
	return daysApart;
}

function getParentLicenseCapID(capid) {
	if (capid == null || aa.util.instanceOfString(capid)) { return null; }
	var result = aa.cap.getProjectByChildCapID(capid, "Renewal", "Incomplete");
	if(result.getSuccess() ) {
		projectScriptModels = result.getOutput();
		projectScriptModel = projectScriptModels[0];
		return projectScriptModel.getProjectID();
	} else {
		return getParentCapVIAPartialCap(capid);
	}
}

function updateLicense(){
	try {
		// get license capId
		var licId = getParentLicenseCapID(capId);
		
		if (licId != null) {
			// get license
			var thisLic = new licenseObject(licIdString,licId); 
			
			// update expiration date
			var prevExp = thisLic.getExpiration();	
			thisLic.setExpiration(dateAddMonths(prevExp,12)) ;
			
			// update license record status to 'Issued'
			updateAppStatus("Issued", "updated by script", licId);
			
			// update expiration status to 'Active'
			thisLic.setStatus("Active");
			
			// update custom lists
			copyASITables(capId, licId);
		} else {
			logDebug("Error: unable to get parent license record to update");
		}
	}
	catch (err){
		logDebug("Javascript error: " + err.message);
	}
}

function feeTotalByStatus(feeStatus) {
	var statusArray = new Array(); 
	if (arguments.length > 0) {
		for (var i=0; i<arguments.length; i++) statusArray.push(arguments[i]);
	}
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess()) { 
		var feeObjArr = feeResult.getOutput(); 
		for (ff in feeObjArr) {
			thisFeeStatus = "" + feeObjArr[ff].getFeeitemStatus();
			if (exists(thisFeeStatus,statusArray)) feeTotal+=feeObjArr[ff].getFee();	
		}
	}
	else { 
		logDebug( "Error getting fee items: " + feeResult.getErrorMessage()); 
	}
	return feeTotal;
}
