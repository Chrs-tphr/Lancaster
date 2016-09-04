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




function monthsLate(){
//	var boDate = new Date("01/01/2016");
//	var fDate =  new Date("12/01/2016");

	var oDate = convertDate(AInfo["Business Open Date"]); logDebug("oDate: "+oDate);
	var fDate = convertDate(fileDate); logDebug("fDate: "+fDate);
	var monthLate = 0;
	var yMonthLate = 0;
	var monthsLate = 0;
	
	if(oDate < fDate){
		
		var oMonth = oDate.getMonth();
		var oYear = oDate.getFullYear();
			logDebug("oMonth: "+oMonth+" oYear: "+oYear);
		
		var fDateMonth = fDate.getMonth();
		var fDateYear = fDate.getFullYear();
			logDebug("fDateMonth: "+fDateMonth+" fDateYear: "+fDateYear);
		
		if((oYear < fDateYear) || (oYear == fDateYear && oMonth < fDateMonth)){
			monthLate = (fDateMonth - oMonth); logDebug(monthLate);
			yMonthLate = ((fDateYear - oYear)*12); logDebug(yMonthLate);
			monthsLate = monthLate+yMonthLate;
		}
		logDebug(monthsLate);
		return monthsLate;
	}
}

function calculateLicAppPenaltyFee(){
	var appFee = 0;
	var monthsLate = monthsLate();
	var penaltyPercent = 0;
	var pAmount = 0;
	if(monthsLate == 1) penaltyPercent = 0.2;
	if(monthsLate == 2) penaltyPercent = 0.3;
	if(monthsLate == 3) penaltyPercent = 0.4;
	if(monthsLate > 3) penaltyPercent = 0.5;
	
	if(matches(appType[2], "Group Home")){
		appFee = feeAmount("S-084N");
		pAmount = appFee*penaltyPercent;
		updateFee("S-084P","LIC_GH_GENERAL","FINAL","pAmount","Y");
	}else{
		appFee = feeAmount("LIC_020");
		pAmount = appFee*penaltyPercent;
		updateFee("LIC_050","LIC_BUSINESS_GENERAL","FINAL","pAmount","Y");//LIC_050 is configured, need to confirm configuration with client.
	}
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

function calculateLicRenewalPenaltyFee(){
	var parentLicenseCAPID = getParentLicenseCapID(capID)
	if (parentLicenseCAPID != null){
		var rnewFee = 0;
		var date1 = parentLicenseCAPID.getExpDate();
		var date2 = fileDate;
		var daysLate = daysBetween(date1, date2);
		var penaltyPercent = 0;
		var pAmount = 0;
		if(daysLate == 1) penaltyPercent = 0.2;
		if(daysLate == 2) penaltyPercent = 0.3;
		if(daysLate == 3) penaltyPercent = 0.4;
		if(daysLate > 3) penaltyPercent = 0.5;
		
		if(matches(appType[2], "Group Home")){
			appFee = feeAmount("S-084N");
			pAmount = appFee*penaltyPercent;
			updateFee("S-084P","LIC_GH_GENERAL","FINAL","pAmount","Y");
		}else{
			appFee = feeAmount("LIC_020");
			pAmount = appFee*penaltyPercent;
			updateFee("LIC_050","LIC_BUSINESS_GENERAL","FINAL","pAmount","Y");//LIC_050 needs to be configured
		}
	}
}

