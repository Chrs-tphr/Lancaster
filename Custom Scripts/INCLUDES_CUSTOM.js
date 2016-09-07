/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be 
	    available to all master scripts
|
| Notes   : createRefLicProf - override to default the state if one is not provided
|
|         : createRefContactsFromCapContactsAndLink - testing new ability to link public users to new ref contacts
/------------------------------------------------------------------------------------------------------*/
//eval( aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput().getMasterScript(aa.getServiceProviderCode(),"INCLUDES_CUSTOM","ADMIN").getScriptText() + "");

function createRefLicProf(rlpId,rlpType,pContactType)
	{
	//Creates/updates a reference licensed prof from a Contact
	//06SSP-00074, modified for 06SSP-00238
	var updating = false;
	var capContResult = aa.people.getCapContactByCapID(capId);
	if (capContResult.getSuccess())
		{ conArr = capContResult.getOutput();  }
	else
		{
		logDebug ("**ERROR: getting cap contact: " + capAddResult.getErrorMessage());
		return false;
		}

	if (!conArr.length)
		{
		logDebug ("**WARNING: No contact available");
		return false;
		}


	var newLic = getRefLicenseProf(rlpId)

	if (newLic)
		{
		updating = true;
		logDebug("Updating existing Ref Lic Prof : " + rlpId);
		}
	else
		var newLic = aa.licenseScript.createLicenseScriptModel();

	//get contact record
	if (pContactType==null)
		var cont = conArr[0]; //if no contact type specified, use first contact
	else
		{
		var contFound = false;
		for (yy in conArr)
			{
			if (pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType()))
				{
				cont = conArr[yy];
				contFound = true;
				break;
				}
			}
		if (!contFound)
			{
			logDebug ("**WARNING: No Contact found of type: "+pContactType);
			return false;
			}
		}

	peop = cont.getPeople();
	addr = peop.getCompactAddress();

	newLic.setContactFirstName(cont.getFirstName());
	//newLic.setContactMiddleName(cont.getMiddleName());  //method not available
	newLic.setContactLastName(cont.getLastName());
	newLic.setBusinessName(peop.getBusinessName());
	newLic.setAddress1(addr.getAddressLine1());
	newLic.setAddress2(addr.getAddressLine2());
	newLic.setAddress3(addr.getAddressLine3());
	newLic.setCity(addr.getCity());
	newLic.setState(addr.getState());
	newLic.setZip(addr.getZip());
	newLic.setPhone1(peop.getPhone1());
	newLic.setPhone2(peop.getPhone2());
	newLic.setEMailAddress(peop.getEmail());
	newLic.setFax(peop.getFax());

	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setAuditID(currentUserID);
	newLic.setAuditStatus("A");

	if (AInfo["Insurance Co"]) 		newLic.setInsuranceCo(AInfo["Insurance Co"]);
	if (AInfo["Insurance Amount"]) 		newLic.setInsuranceAmount(parseFloat(AInfo["Insurance Amount"]));
	if (AInfo["Insurance Exp Date"]) 	newLic.setInsuranceExpDate(aa.date.parseDate(AInfo["Insurance Exp Date"]));
	if (AInfo["Policy #"]) 			newLic.setPolicy(AInfo["Policy #"]);

	if (AInfo["Business License #"]) 	newLic.setBusinessLicense(AInfo["Business License #"]);
	if (AInfo["Business License Exp Date"]) newLic.setBusinessLicExpDate(aa.date.parseDate(AInfo["Business License Exp Date"]));

	newLic.setLicenseType(rlpType);

	if(addr.getState() != null)
		newLic.setLicState(addr.getState());
	else
		newLic.setLicState("AK"); //default the state if none was provided

	newLic.setStateLicense(rlpId);

	if (updating)
		myResult = aa.licenseScript.editRefLicenseProf(newLic);
	else
		myResult = aa.licenseScript.createRefLicenseProf(newLic);

	if (myResult.getSuccess())
		{
		logDebug("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
		logMessage("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
		return true;
		}
	else
		{
		logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		logMessage("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		return false;
		}
	}


function createRefContactsFromCapContactsAndLink(pCapId, contactTypeArray, ignoreAttributeArray, replaceCapContact, overwriteRefContact, refContactExists)
	{

	// contactTypeArray is either null (all), or an array or contact types to process
	//
	// ignoreAttributeArray is either null (none), or an array of attributes to ignore when creating a REF contact
	//
	// replaceCapContact not implemented yet
	//
	// overwriteRefContact -- if true, will refresh linked ref contact with CAP contact data
	//
	// refContactExists is a function for REF contact comparisons.
	//
	// Version 2.0 Update:   This function will now check for the presence of a standard choice "REF_CONTACT_CREATION_RULES". 
	// This setting will determine if the reference contact will be created, as well as the contact type that the reference contact will 
	// be created with.  If this setting is configured, the contactTypeArray parameter will be ignored.   The "Default" in this standard
	// choice determines the default action of all contact types.   Other types can be configured separately.   
	// Each contact type can be set to "I" (create ref as individual), "O" (create ref as organization), 
	// "F" (follow the indiv/org flag on the cap contact), "D" (Do not create a ref contact), and "U" (create ref using transaction contact type).
	
	var standardChoiceForBusinessRules = "REF_CONTACT_CREATION_RULES";
	
	
	var ingoreArray = new Array();
	if (arguments.length > 1) ignoreArray = arguments[1];
	
	var defaultContactFlag = lookup(standardChoiceForBusinessRules,"Default");

	var c = aa.people.getCapContactByCapID(pCapId).getOutput()
	var cCopy = aa.people.getCapContactByCapID(pCapId).getOutput()  // must have two working datasets

	for (var i in c)
	   {
	   var ruleForRefContactType = "U"; // default behavior is create the ref contact using transaction contact type
	   var con = c[i];

	   var p = con.getPeople();
	   
	   var contactFlagForType = lookup(standardChoiceForBusinessRules,p.getContactType());
	   
	   if (!defaultContactFlag && !contactFlagForType) // standard choice not used for rules, check the array passed
	   	{
	   	if (contactTypeArray && !exists(p.getContactType(),contactTypeArray))
			continue;  // not in the contact type list.  Move along.
		}
	
	   if (!contactFlagForType && defaultContactFlag) // explicit contact type not used, use the default
	   	{
	   	ruleForRefContactType = defaultContactFlag;
	   	}
	   
	   if (contactFlagForType) // explicit contact type is indicated
	   	{
	   	ruleForRefContactType = contactFlagForType;
	   	}

	   if (ruleForRefContactType.equals("D"))
	   	continue;
	   	
	   var refContactType = "";
	   
	   switch(ruleForRefContactType)
	   	{
		   case "U":
		     refContactType = p.getContactType();
		     break;
		   case "I":
		     refContactType = "Individual";
		     break;
		   case "O":
		     refContactType = "Organization";
		     break;
		   case "F":
		     if (p.getContactTypeFlag() && p.getContactTypeFlag().equals("organization"))
		     	refContactType = "Organization";
		     else
		     	refContactType = "Individual";
		     break;
		}
	   
	   var refContactNum = con.getCapContactModel().getRefContactNumber();
	   
	   if (refContactNum)  // This is a reference contact.   Let's refresh or overwrite as requested in parms.
	   	{
	   	if (overwriteRefContact)
	   		{
	   		p.setContactSeqNumber(refContactNum);  // set the ref seq# to refresh
	   		p.setContactType(refContactType);
	   		
	   						var a = p.getAttributes();
			
							if (a)
								{
								var ai = a.iterator();
								while (ai.hasNext())
									{
									var xx = ai.next();
									xx.setContactNo(refContactNum);
									}
					}
					
	   		var r = aa.people.editPeopleWithAttribute(p,p.getAttributes());
	   		
			if (!r.getSuccess()) 
				logDebug("WARNING: couldn't refresh reference people : " + r.getErrorMessage()); 
			else
				logDebug("Successfully refreshed ref contact #" + refContactNum + " with CAP contact data"); 
			}
			
	   	if (replaceCapContact)
	   		{
				// To Be Implemented later.   Is there a use case?
			}
			
	   	}
	   	else  // user entered the contact freehand.   Let's create or link to ref contact.
	   	{
			var ccmSeq = p.getContactSeqNumber();

			var existingContact = refContactExists(p);  // Call the custom function to see if the REF contact exists

			var p = cCopy[i].getPeople();  // get a fresh version, had to mangle the first for the search

			if (existingContact)  // we found a match with our custom function.  Use this one.
				{
					refPeopleId = existingContact;
				}
			else  // did not find a match, let's create one
				{

				var a = p.getAttributes();

				if (a)
					{
					//
					// Clear unwanted attributes
					var ai = a.iterator();
					while (ai.hasNext())
						{
						var xx = ai.next();
						if (ignoreAttributeArray && exists(xx.getAttributeName().toUpperCase(),ignoreAttributeArray))
							ai.remove();
						}
					}
				
				p.setContactType(refContactType);
				var r = aa.people.createPeopleWithAttribute(p,a);

				if (!r.getSuccess())
					{logDebug("WARNING: couldn't create reference people : " + r.getErrorMessage()); continue; }

				//
				// createPeople is nice and updates the sequence number to the ref seq
				//

				var p = cCopy[i].getPeople();
				var refPeopleId = p.getContactSeqNumber();

				logDebug("Successfully created reference contact #" + refPeopleId);
				
				// Need to link to an existing public user.
				
			    var getUserResult = aa.publicUser.getPublicUserByEmail(con.getEmail())
			    if (getUserResult.getSuccess() && getUserResult.getOutput()) {
			        var userModel = getUserResult.getOutput();
			        logDebug("createRefContactsFromCapContactsAndLink: Found an existing public user: " + userModel.getUserID());
					
					if (refPeopleId)	{
						logDebug("createRefContactsFromCapContactsAndLink: Linking this public user with new reference contact : " + refPeopleId);
						aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), refPeopleId);
						}
					}
				}

			//
			// now that we have the reference Id, we can link back to reference
			//

		    var ccm = aa.people.getCapContactByPK(pCapId,ccmSeq).getOutput().getCapContactModel();

		    ccm.setRefContactNumber(refPeopleId);
		    r = aa.people.editCapContact(ccm);

		    if (!r.getSuccess())
				{ logDebug("WARNING: error updating cap contact model : " + r.getErrorMessage()); }
			else
				{ logDebug("Successfully linked ref contact " + refPeopleId + " to cap contact " + ccmSeq);}


	    }  // end if user hand entered contact 
	}  // end for each CAP contact
} // end function


function cntAssocGarageSales(strnum, strname, city, state, zip, cfname, clname)
{

	/***

	Searches for Garage-Yard Sale License records 
	- Created in the current year 
	- Matches address parameters provided
	- Matches the contact first and last name provided
	- Returns the count of records

	***/

	// Create a cap model for search
	var searchCapModel = aa.cap.getCapModel().getOutput();

	// Set cap model for search. Set search criteria for record type DCA/*/*/*
	var searchCapModelType = searchCapModel.getCapType();
	searchCapModelType.setGroup("Licenses");
	searchCapModelType.setType("Garage-Yard Sale");
	searchCapModelType.setSubType("License");
	searchCapModelType.setCategory("NA");
	searchCapModel.setCapType(searchCapModelType);

	searchAddressModel = searchCapModel.getAddressModel();
	searchAddressModel.setStreetName(strname);

	gisObject = new com.accela.aa.xml.model.gis.GISObjects;
	qf = new com.accela.aa.util.QueryFormat;

	var toDate = aa.date.getCurrentDate();
	var fromDate = aa.date.parseDate("01/01/" + toDate.getYear()); 
	
	var recordCnt = 0;
	message = "The applicant has reached the Garage-Sale License limit of 3 per calendar year.<br>"

	capList = aa.cap.getCapListByCollection(searchCapModel, searchAddressModel, "", fromDate, toDate, qf, gisObject).getOutput();
	for (x in capList)
	{
		resultCap = capList[x];
		resultCapId = resultCap.getCapID();
		altId = resultCapId.getCustomID();
		//aa.print("Record ID: " + altId);
		resultCapIdScript = aa.cap.createCapIDScriptModel(resultCapId.getID1(),resultCapId.getID2(),resultCapId.getID3() );
		contact = aa.cap.getCapPrimaryContact(resultCapIdScript).getOutput();
		
		contactFname = contact.getFirstName();
		contactLname = contact.getLastName();
		
		if(contactFname==cfname && contactLname==clname)
		{
			recordCnt++;
			message = message + recordCnt + ": " + altId + " - " + contactFname + " " + contactLname + " @ " + strnum + " " + strname + "<br>";
		}		
	}
	
	return recordCnt;

}

function copyContactsWithAddress(pFromCapId, pToCapId)
{
   // Copies all contacts from pFromCapId to pToCapId and includes Contact Address objects
   //
   if (pToCapId == null)
   var vToCapId = capId;
   else
   var vToCapId = pToCapId;

   var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
   var copied = 0;
   if (capContactResult.getSuccess())
   {
      var Contacts = capContactResult.getOutput();
      for (yy in Contacts)
      {
         var newContact = Contacts[yy].getCapContactModel();

         var newPeople = newContact.getPeople();
         // aa.print("Seq " + newPeople.getContactSeqNumber());

         var addressList = aa.address.getContactAddressListByCapContact(newContact).getOutput();
         newContact.setCapID(vToCapId);
         aa.people.createCapContact(newContact);
         newerPeople = newContact.getPeople();
         // contact address copying
         if (addressList)
         {
            for (add in addressList)
            {
               var transactionAddress = false;
               contactAddressModel = addressList[add].getContactAddressModel();
			   
			   logDebug("contactAddressModel.getEntityType():" + contactAddressModel.getEntityType());
			   
               if (contactAddressModel.getEntityType() == "CAP_CONTACT")
               {
                  transactionAddress = true;
                  contactAddressModel.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
               }
               // Commit if transaction contact address
               if(transactionAddress)
               {
                  var newPK = new com.accela.orm.model.address.ContactAddressPKModel();
                  contactAddressModel.setContactAddressPK(newPK);
                  aa.address.createCapContactAddress(vToCapId, contactAddressModel);
               }
               // Commit if reference contact address
               else
               {
                  // build model
                  var Xref = aa.address.createXRefContactAddressModel().getOutput();
                  Xref.setContactAddressModel(contactAddressModel);
                  Xref.setAddressID(addressList[add].getAddressID());
                  Xref.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
                  Xref.setEntityType(contactAddressModel.getEntityType());
                  Xref.setCapID(vToCapId);
                  // commit address
                  commitAddress = aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel());
				  if(commitAddress.getSuccess())
				  {
					commitAddress.getOutput();
					logDebug("Copied contact address");
				  }
               }
            }
         }
         // end if
         copied ++ ;
         logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
      }
   }
   else
   {
      logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
      return false;
   }
   return copied;
}


function changeCapContactTypes(origType, newType)
{
   // Renames all contacts of type origType to contact type of newType and includes Contact Address objects
   //
	var vCapId = capId;
	if (arguments.length == 3)
		vCapId = arguments[2];
   
   var capContactResult = aa.people.getCapContactByCapID(vCapId);
   var renamed = 0;
   if (capContactResult.getSuccess())
   {
      var Contacts = capContactResult.getOutput();
      for (yy in Contacts)
      {
         var contact = Contacts[yy].getCapContactModel();

         var people = contact.getPeople();
		 var contactType = people.getContactType();
          aa.print("Contact Type " + contactType);

		if(contactType==origType)
		{
		
			var contactNbr = people.getContactSeqNumber();	
			var editContact = aa.people.getCapContactByPK(vCapId, contactNbr).getOutput();
			editContact.getCapContactModel().setContactType(newType)
		
			aa.print("Set to: " + people.getContactType());
        	 renamed ++ ;
			 
			var updContactResult = aa.people.editCapContact(editContact.getCapContactModel());		
			logDebug("contact " + updContactResult);
			logDebug("contact.getSuccess() " + updContactResult.getSuccess());	
			logDebug("contact.getOutput() " + updContactResult.getOutput());
			updContactResult.getOutput();
			logDebug("Renamed contact from " + origType + " to " + newType);
		}
      }
   }
   else
   {
      logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
      return false;
   }
   return renamed;
}


function editEstimatedJobValue(jobValue) // option CapId
{
	var itemCap = capId
		if (arguments.length > 1)
			itemCap = arguments[1]; // use cap ID specified in args
		var bValScriptObjResult = aa.cap.getBValuatn4AddtInfo(itemCap);
		var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!bValScriptObjResult.getSuccess()) {
		logDebug("**ERROR: No cap detail script object : " + bValScriptObjResult.getErrorMessage());
		return false;
	}
	var bValScriptObj = bValScriptObjResult.getOutput();
	if (!bValScriptObj) {
		logDebug("**ERROR: No valuation detail script object");
		return false;
	}
	if (!cdScriptObjResult.getSuccess()) {
		logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage());
		return false;
	}
	var cdScriptObj = cdScriptObjResult.getOutput();
	if (!cdScriptObj) {
		logDebug("**ERROR: No cap detail script object");
		return false;
	}
	bValScriptObj.setEstimatedValue(parseFloat(jobValue));
	var vedtResults = aa.cap.editAddtInfo(cdScriptObj,bValScriptObj);
		if (!vedtResults.getSuccess()) {
			logDebug("**Error updating the job value in additional information" + edtResults.getErrorMessage());
		}
		if (vedtResults !== null && vedtResults.getSuccess() === true) {
			logDebug("Updated the estimated job value to " + jobValue);
		}
}

function externalLP_CA_AT(licNum,rlpType,doPopulateRef,doPopulateTrx,itemCap)
	{

	/*
	Version: 3.2

	Usage:

		licNum			:  Valid CA license number.   Non-alpha, max 8 characters.  If null, function will use the LPs on the supplied CAP ID
		rlpType			:  License professional type to use when validating and creating new LPs
		doPopulateRef 	:  If true, will create/refresh a reference LP of this number/type
		doPopulateTrx 	:  If true, will copy create/refreshed reference LPs to the supplied Cap ID.   doPopulateRef must be true for this to work
		itemCap			:  If supplied, licenses on the CAP will be validated.  Also will be refreshed if doPopulateRef and doPopulateTrx are true

	returns: non-null string of status codes for invalid licenses

	examples:

	appsubmitbefore   (will validate the LP entered, if any, and cancel the event if the LP is inactive, cancelled, expired, etc.)
	===============
	true ^ cslbMessage = "";
	CAELienseNumber ^ cslbMessage = externalLP_CA(CAELienseNumber,CAELienseType,false,false,null);
	cslbMessage.length > 0 ^ cancel = true ; showMessage = true ; comment(cslbMessage)

	appsubmitafter  (update all CONTRACTOR LPs on the CAP and REFERENCE with data from CSLB.  Link the CAP LPs to REFERENCE.   Pop up a message if any are inactive...)
	==============
	true ^ 	cslbMessage = externalLP_CA(null,"CONTRACTOR",true,true,capId)
	cslbMessage.length > 0 ^ showMessage = true ; comment(cslbMessage);

	Note;  Custom LP Template Field Mappings can be edited in the script below
	*/

	var returnMessage = "";

	var workArray = new Array();
	if (licNum)
		workArray.push(String(licNum));

	if (itemCap)
		{
		var capLicenseResult = aa.licenseScript.getLicenseProf(itemCap);
		if (capLicenseResult.getSuccess())
			{
			var capLicenseArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic prof: " + capLicenseResult.getErrorMessage()); return false; }

		if (capLicenseArr == null || !capLicenseArr.length)
			{ logDebug("**WARNING: no licensed professionals on this CAP"); }
		//else
			//{
			//for (var thisLic in capLicenseArr)
			//	if (capLicenseArr[thisLic].getLicenseType() == rlpType)
			//		workArray.push(capLicenseArr[thisLic]);
			//}
		}
	else
		doPopulateTrx = false; // can't do this without a CAP;

	for (var thisLic = 0; thisLic < workArray.length; thisLic++)
		{
		var licNum = workArray[thisLic];
		var licObj = null;
		var isObject = false;

		if (typeof(licNum) == "object")  // is this one an object or string?
			{
			licObj = licNum;
			licNum = licObj.getLicenseNbr();
			isObject = true;
			}

// Make the call to the California State License Board

		var document;
		var root;        
		var aURLArgList = "https://www2.cslb.ca.gov/IVR/License+Detail.aspx?LicNum=" + licNum;
		var vOutObj = aa.httpClient.get(aURLArgList);
		var isError = false;
		if(vOutObj.getSuccess()){
			var vOut = vOutObj.getOutput();
			var sr =  aa.proxyInvoker.newInstance("java.io.StringBufferInputStream", new Array(vOut)).getOutput();
			var saxBuilder = aa.proxyInvoker.newInstance("org.jdom.input.SAXBuilder").getOutput();
			document = saxBuilder.build(sr);
			root = document.getRootElement();
			errorNode = root.getChild("Error");
		}
		else{
			isError = true;
		}
		if (isError){
			logDebug("The CSLB web service is currently unavailable");
			continue;
		}
		else if (errorNode)
		{
			logDebug("Error for license " + licNum + " : " + String(errorNode.getText()).replace(/\+/g," "));
			returnMessage+="License " + licNum +  " : " + String(errorNode.getText()).replace(/\+/g," ") + " ";
			continue;
		}


		var lpBiz = root.getChild("BusinessInfo");
		var lpStatus = root.getChild("PrimaryStatus");
		var lpClass = root.getChild("Classifications");
		var lpBonds = root.getChild("ContractorBond");
		var lpWC = root.getChild("WorkersComp");

		// Primary Status
		// 3 = expired, 10 = good, 11 = inactive, 1 = canceled.   We will ignore all but 10 and return text.
		var stas = lpStatus.getChildren();
		for (var i=0 ; i<stas.size(); i++) {
			var sta = stas.get(i);

			if (sta.getAttribute("Code").getValue() != "10")
				returnMessage+="License:" + licNum + ", " + sta.getAttribute("Desc").getValue() + " ";
		}

		if (doPopulateRef)  // refresh or create a reference LP
			{
			var updating = false;

			// check to see if the licnese already exists...if not, create.

			var newLic = getRefLicenseProf(licNum)

			if (newLic)
				{
				updating = true;
				logDebug("Updating existing Ref Lic Prof : " + licNum);
				}
			else
				{
				var newLic = aa.licenseScript.createLicenseScriptModel();
				}

			if (isObject)  // update the reference LP with data from the transactional, if we have some.
				{
				if (licObj.getAddress1()) newLic.setAddress1(licObj.getAddress1());
				if (licObj.getAddress2()) newLic.setAddress2(licObj.getAddress2());
				if (licObj.getAddress3()) newLic.setAddress3(licObj.getAddress3());
				if (licObj.getAgencyCode()) newLic.setAgencyCode(licObj.getAgencyCode());
				if (licObj.getBusinessLicense()) newLic.setBusinessLicense(licObj.getBusinessLicense());
				if (licObj.getBusinessName()) newLic.setBusinessName(licObj.getBusinessName());
				if (licObj.getBusName2()) newLic.setBusinessName2(licObj.getBusName2());
				if (licObj.getCity()) newLic.setCity(licObj.getCity());
				if (licObj.getCityCode()) newLic.setCityCode(licObj.getCityCode());
				if (licObj.getContactFirstName()) newLic.setContactFirstName(licObj.getContactFirstName());
				if (licObj.getContactLastName()) newLic.setContactLastName(licObj.getContactLastName());
				if (licObj.getContactMiddleName()) newLic.setContactMiddleName(licObj.getContactMiddleName());
				if (licObj.getCountryCode()) newLic.setContryCode(licObj.getCountryCode());
				if (licObj.getEmail()) newLic.setEMailAddress(licObj.getEmail());
				if (licObj.getCountry()) newLic.setCountry(licObj.getCountry());
				if (licObj.getEinSs()) newLic.setEinSs(licObj.getEinSs());
				if (licObj.getFax()) newLic.setFax(licObj.getFax());
				if (licObj.getFaxCountryCode()) newLic.setFaxCountryCode(licObj.getFaxCountryCode());
				if (licObj.getHoldCode()) newLic.setHoldCode(licObj.getHoldCode());
				if (licObj.getHoldDesc()) newLic.setHoldDesc(licObj.getHoldDesc());
				if (licObj.getLicenseExpirDate()) newLic.setLicenseExpirationDate(licObj.getLicenseExpirDate());
				if (licObj.getLastRenewalDate()) newLic.setLicenseLastRenewalDate(licObj.getLastRenewalDate());
				if (licObj.getLicesnseOrigIssueDate()) newLic.setLicOrigIssDate(licObj.getLicesnseOrigIssueDate());
				if (licObj.getPhone1()) newLic.setPhone1(licObj.getPhone1());
				if (licObj.getPhone1CountryCode()) newLic.setPhone1CountryCode(licObj.getPhone1CountryCode());
				if (licObj.getPhone2()) newLic.setPhone2(licObj.getPhone2());
				if (licObj.getPhone2CountryCode()) newLic.setPhone2CountryCode(licObj.getPhone2CountryCode());
				if (licObj.getSelfIns()) newLic.setSelfIns(licObj.getSelfIns());
				if (licObj.getState()) newLic.setState(licObj.getState());
				if (licObj.getSuffixName()) newLic.setSuffixName(licObj.getSuffixName());
				if (licObj.getZip()) newLic.setZip(licObj.getZip());
				}

			// Now set data from the CSLB

			if (lpBiz.getChild("Name").getText() != "") newLic.setBusinessName(unescape(lpBiz.getChild("Name").getText()).replace(/\+/g," "));
			if (lpBiz.getChild("Addr1").getText() != "") newLic.setAddress1(unescape(lpBiz.getChild("Addr1").getText()).replace(/\+/g," "));
			if (lpBiz.getChild("Addr2").getText() != "") newLic.setAddress2(unescape(lpBiz.getChild("Addr2").getText()).replace(/\+/g," "));
			if (lpBiz.getChild("City").getText() != "") newLic.setCity(unescape(lpBiz.getChild("City").getText()).replace(/\+/g," "));
			if (lpBiz.getChild("State").getText() != "") newLic.setState(unescape(lpBiz.getChild("State").getText()).replace(/\+/g," "));
			if (lpBiz.getChild("Zip").getText() != "") newLic.setZip(unescape(lpBiz.getChild("Zip").getText()).replace(/\+/g," "));
			if (lpBiz.getChild("BusinessPhoneNum").getText() != "") newLic.setPhone1(unescape(stripNN(lpBiz.getChild("BusinessPhoneNum").getText()).replace(/\+/g," ")));
			newLic.setAgencyCode(aa.getServiceProviderCode());
			newLic.setAuditDate(sysDate);
			newLic.setAuditID(currentUserID);
			newLic.setAuditStatus("A");
			newLic.setLicenseType(rlpType);
			newLic.setLicState("CA");  // hardcode CA
			newLic.setStateLicense(licNum);

			if (lpBiz.getChild("IssueDt").getText()) newLic.setLicenseIssueDate(aa.date.parseDate(lpBiz.getChild("IssueDt").getText()));
			if (lpBiz.getChild("ExpireDt").getText()) newLic.setLicenseExpirationDate(aa.date.parseDate(lpBiz.getChild("ExpireDt").getText()));
			if (lpBiz.getChild("ReissueDt").getText()) newLic.setLicenseLastRenewalDate(aa.date.parseDate(lpBiz.getChild("ReissueDt").getText()));

			var wcs = root.getChild("WorkersComp").getChildren();

			for (var j=0 ; j<wcs.size(); j++) {
				wc = wcs.get(j);

				if (wc.getAttribute("PolicyNo").getValue()) newLic.setWcPolicyNo(wc.getAttribute("PolicyNo").getValue());
				if (wc.getAttribute("InsCoCde").getValue()) newLic.setWcInsCoCode(unescape(wc.getAttribute("InsCoCde").getValue()));
				if (wc.getAttribute("WCEffDt").getValue()) newLic.setWcEffDate(aa.date.parseDate(wc.getAttribute("WCEffDt").getValue()))
				if (wc.getAttribute("WCExpDt").getValue()) newLic.setWcExpDate(aa.date.parseDate(wc.getAttribute("WCExpDt").getValue()))
				if (wc.getAttribute("WCCancDt").getValue()) newLic.setWcCancDate(aa.date.parseDate(wc.getAttribute("WCCancDt").getValue()))
				if (wc.getAttribute("Exempt").getValue() == "E") newLic.setWcExempt("Y"); else newLic.setWcExempt("N");

				break; // only use first
				}

			//
			// Do the refresh/create and get the sequence number
			//
			if (updating)
				{
				var myResult = aa.licenseScript.editRefLicenseProf(newLic);
				var licSeqNbr = newLic.getLicSeqNbr();
				}
			else
				{
				var myResult = aa.licenseScript.createRefLicenseProf(newLic);

				if (!myResult.getSuccess())
					{
					logDebug("**WARNING: can't create ref lic prof: " + myResult.getErrorMessage());
					continue;
					}

				var licSeqNbr = myResult.getOutput()
				}

			logDebug("Successfully added/updated License No. " + licNum + ", Type: " + rlpType + " Sequence Number " + licSeqNbr);


			/////
			/////  Attribute Data -- first copy from the transactional LP if it exists
			/////


			if (isObject)  // update the reference LP with attributes from the transactional, if we have some.
				{
				var attrArray = licObj.getAttributes();

				if (attrArray)
					{
					for (var k in attrArray)
						{
						var attr = attrArray[k];
						editRefLicProfAttribute(licNum,attr.getAttributeName(),attr.getAttributeValue());
						}
					}
				}

			/////
			/////  Attribute Data
			/////
			/////  NOTE!  Agencies may have to configure template data below based on their configuration.  Please note all edits
			/////

			var cbs = root.getChild("Classifications").getChildren();
			for (var m=0 ; m<cbs.size(); m++) {
				cb = cbs.get(m);

				if (m == 0)
					{
					editRefLicProfAttribute(licNum,"CLASS CODE 1",cb.getAttribute("Code").getValue());
					editRefLicProfAttribute(licNum,"CLASS DESC 1",unescape(cb.getAttribute("Desc").getValue()).replace(/\+/g," "));
					}

				if (m == 1)
					{
					editRefLicProfAttribute(licNum,"CLASS CODE 2",cb.getAttribute("Code").getValue());
					editRefLicProfAttribute(licNum,"CLASS DESC 2",unescape(cb.getAttribute("Desc").getValue()).replace(/\+/g," "));
					}
				if (m == 2)
					{
					editRefLicProfAttribute(licNum,"CLASS CODE 3",cb.getAttribute("Code").getValue());
					editRefLicProfAttribute(licNum,"CLASS DESC 3",unescape(cb.getAttribute("Desc").getValue()).replace(/\+/g," "));
					}

				if (m == 3)
					{
					editRefLicProfAttribute(licNum,"CLASS CODE 4",cb.getAttribute("Code").getValue());
					editRefLicProfAttribute(licNum,"CLASS DESC 4",unescape(cb.getAttribute("Desc").getValue()).replace(/\+/g," "));
					}
				}

// dlh add in Status

	var stas = lpStatus.getChildren();
		for (var i=0 ; i<stas.size(); i++) {
			var sta = stas.get(i);

				if (sta.getAttribute("Desc").getValue()) editRefLicProfAttribute(licNum,"STATUS",unescape(sta.getAttribute("Desc").getValue()));

				break; // only use first
				}
				
//  do this again for WC  

            var wcs = root.getChild("WorkersComp").getChildren();
			for (var j=0 ; j< wcs.size(); j++) {
				wc = wcs.get(j);

				if (wc.getAttribute("PolicyNo").getValue()) editRefLicProfAttribute(licNum,"WC POLICY NO",unescape(wc.getAttribute("PolicyNo").getValue()));

				if (wc.getAttribute("InsCoCde").getValue()) editRefLicProfAttribute(licNum,"WC CO CODE",unescape(wc.getAttribute("InsCoCde").getValue()));
			
				if (wc.getAttribute("InsCoName").getValue()) editRefLicProfAttribute(licNum,"WC CO NAME",unescape(wc.getAttribute("InsCoName").getValue()).replace(/\+/g," "));

				if (wc.getAttribute("WCEffDt").getValue()) editRefLicProfAttribute(licNum,"WC EFF DATE",unescape(wc.getAttribute("WCEffDt").getValue()));

				if (wc.getAttribute("WCExpDt").getValue()) editRefLicProfAttribute(licNum,"WC EXP DATE",unescape(wc.getAttribute("WCExpDt").getValue()));

				if (wc.getAttribute("WCCancDt").getValue()) editRefLicProfAttribute(licNum,"WC CAN DATE",unescape(wc.getAttribute("WCCancDt").getValue()));

				if (wc.getAttribute("Exempt").getValue() == "E") 
					editRefLicProfAttribute(licNum,"WC EXEMPT","Y"); 
				else 
					editRefLicProfAttribute(licNum,"WC EXEMPT","N");
					 
				break; // only use first
				}

// end dlh change update attribute WC data 

			var bos = root.getChild("ContractorBond").getChildren();

			for (var n=0 ; n<bos.size(); n++) {
				var bo = bos.get(n);
				if (bo.getAttribute("BondAmt").getValue()) editRefLicProfAttribute(licNum,"BOND AMOUNT",unescape(bo.getAttribute("BondAmt").getValue()));
				if (bo.getAttribute("BondCancDt").getValue()) editRefLicProfAttribute(licNum,"BOND EXPIRATION",unescape(bo.getAttribute("BondCancDt").getValue()));

				// Currently unused but could be loaded into custom attributes.
				if (bo.getAttribute("SuretyTp").getValue()) editRefLicProfAttribute(licNum,"BOND SURETYTP",unescape(bo.getAttribute("SuretyTp").getValue()));

				if (bo.getAttribute("InsCoCde").getValue()) editRefLicProfAttribute(licNum,"BOND INSOCDE",unescape(bo.getAttribute("InsCoCde").getValue()).replace(/\+/g," "));

				if (bo.getAttribute("InsCoName").getValue()) editRefLicProfAttribute(licNum,"BOND ICONAME",unescape(bo.getAttribute("InsCoName").getValue()).replace(/\+/g," "));

				if (bo.getAttribute("BondNo").getValue()) editRefLicProfAttribute(licNum,"BOND NO",unescape(bo.getAttribute("BondNo").getValue()));

				if (bo.getAttribute("BondEffDt").getValue()) editRefLicProfAttribute(licNum,"BOND EFFDATE",unescape(bo.getAttribute("BondEffDt").getValue()));

	

/*
				aa.print("Bond Surety Type       : " + unescape(bo.getAttribute("SuretyTp").getValue()))
				aa.print("Bond Code              : " + unescape(bo.getAttribute("InsCoCde").getValue()))
				aa.print("Bond Insurance Company : " + unescape(bo.getAttribute("InsCoName").getValue()).replace(/\+/g," "))
				aa.print("Bond Number            : " + unescape(bo.getAttribute("BondNo").getValue()))
				aa.print("Bond Amount            : " + unescape(bo.getAttribute("BondAmt").getValue()))
				aa.print("Bond Effective Date    : " + unescape(bo.getAttribute("BondEffDt").getValue()))
				aa.print("Bond Cancel Date       : " + unescape(bo.getAttribute("BondCancDt").getValue()))
*/
				break; // only use first bond
				}

			if (doPopulateTrx)
				{
				var lpsmResult = aa.licenseScript.getRefLicenseProfBySeqNbr(servProvCode,licSeqNbr)
					if (!lpsmResult.getSuccess())
					{ logDebug("**WARNING error retrieving the LP just created " + lpsmResult.getErrorMessage()) ; }

				var lpsm = lpsmResult.getOutput();

				// Remove from CAP

				var isPrimary = false;

				for (var currLic in capLicenseArr)
					{
					var thisLP = capLicenseArr[currLic];
					if (thisLP.getLicenseType() == rlpType && thisLP.getLicenseNbr() == licNum)
						{
						logDebug("Removing license: " + thisLP.getLicenseNbr() + " from CAP.  We will link the new reference LP");
						if (thisLP.getPrintFlag() == "Y")
							{
							logDebug("...remove primary status...");
							isPrimary = true;
							thisLP.setPrintFlag("N");
							aa.licenseProfessional.editLicensedProfessional(thisLP);
							}
						var remCapResult = aa.licenseProfessional.removeLicensedProfessional(thisLP);
						if (capLicenseResult.getSuccess())
							{
							logDebug("...Success."); }
						else
							{ logDebug("**WARNING removing lic prof: " + remCapResult.getErrorMessage()); }
						}
					}

				// add the LP to the CAP
				var asCapResult= aa.licenseScript.associateLpWithCap(itemCap,lpsm)
				if (!asCapResult.getSuccess())
				{ logDebug("**WARNING error associating CAP to LP: " + asCapResult.getErrorMessage()) }
				else
					{ logDebug("Associated the CAP to the new LP") }

				// Now make the LP primary again
				if (isPrimary)
					{
					var capLps = getLicenseProfessional(itemCap);

					for (var thisCapLpNum in capLps)
						{
						if (capLps[thisCapLpNum].getLicenseNbr().equals(licNum))
							{
							var thisCapLp = capLps[thisCapLpNum];
							thisCapLp.setPrintFlag("Y");
							aa.licenseProfessional.editLicensedProfessional(thisCapLp);
							logDebug("Updated primary flag on Cap LP : " + licNum);

							// adding this return will cause the test script to work without error, even though this is the last statement executed
							//if (returnMessage.length > 0) return returnMessage;
							//else return null;

							}
						}
				}
			} // do populate on the CAP
		} // do populate on the REF
	} // for each license

	if (returnMessage.length > 0) return returnMessage;
	else return null;

} // end function

function getLPLicNum(pCapId) {
//Function find licensed professionals number
        var newLicNum = null;
	var licProf = aa.licenseProfessional.getLicensedProfessionalsByCapID(pCapId).getOutput();
	if (licProf != null)
		for(x in licProf)
		{
                        newLicNum = licProf[x].getLicenseNbr();
		        // logDebug("Found " + licProf[x].getLicenseNbr());
                        return newLicNum;
		}
	else
		// logDebug("No licensed professional on source");
                return null;
}


function getLatestScheduledDate()
{	
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
	{
		inspList = inspResultObj.getOutput();
        var array=new Array();  
        var j=0;		
		for (i in inspList)
        {		    			 				
			if (inspList[i].getInspectionStatus().equals("Scheduled"))
			{	                   					
				array[j++]=aa.util.parseDate(inspList[i].getInspection().getScheduledDate());				
			}
		}
		
		var latestScheduledDate=array[0];
		for (k=0;k<array.length;k++)
        {		          	
			temp=array[k];
			if(temp.after(latestScheduledDate))
			{
				latestScheduledDate=temp;
			} 
		}
		return latestScheduledDate;
	}
	return false;
}

function voidRemoveFees(vFeeCode)
	{
	var feeSeqArray = new Array();
	var invoiceNbrArray = new Array();
	var feeAllocationArray = new Array();
    var itemCap = capId;
    if (arguments.length > 1)
        itemCap = arguments[1];
 
	// for each fee found
	//  	  if the fee is "NEW" remove it
	//  	  if the fee is "INVOICED" void it and invoice the void
	//
	
	var targetFees = loadFees(itemCap);

	for (tFeeNum in targetFees)
		{
		targetFee = targetFees[tFeeNum];

		if (targetFee.code.equals(vFeeCode))
			{

			// only remove invoiced or new fees, however at this stage all AE fees should be invoiced.

			if (targetFee.status == "INVOICED")
				{
				var editResult = aa.finance.voidFeeItem(itemCap, targetFee.sequence);

				if (editResult.getSuccess())
					logDebug("Voided existing Fee Item: " + targetFee.code);
				else
					{ logDebug( "**ERROR: voiding fee item (" + targetFee.code + "): " + editResult.getErrorMessage()); return false; }

				var feeSeqArray = new Array();
				var paymentPeriodArray = new Array();

				feeSeqArray.push(targetFee.sequence);
				paymentPeriodArray.push(targetFee.period);
				var invoiceResult_L = aa.finance.createInvoice(itemCap, feeSeqArray, paymentPeriodArray);

				if (!invoiceResult_L.getSuccess())
					{
					logDebug("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
					return false;
					}

				break;  // done with this payment
				}



			if (targetFee.status == "NEW")
				{
				// delete the fee
				var editResult = aa.finance.removeFeeItem(itemCap, targetFee.sequence);

				if (editResult.getSuccess())
					logDebug("Removed existing Fee Item: " + targetFee.code);
				else
					{ logDebug( "**ERROR: removing fee item (" + targetFee.code + "): " + editResult.getErrorMessage()); return false; }

				break;  // done with this payment
				}

			} // each matching fee
		}  // each  fee
}  // function


function removeZeroFees() {
	var feeArr = loadFees();
	for (x in feeArr) {
		thisFee = feeArr[x];
		if (thisFee.status == "NEW" && thisFee.amount == 0) {
			voidRemoveFees(thisFee.code)//, "FINAL");
		}
	}
}

function updateFeeFromASI(ASIField, FeeCode) {
	var tmpASIQty = parseFloat("0" + getAppSpecific(ASIField))
	var FeeSchedule = aa.finance.getFeeScheduleByCapID(capId).getOutput()
	logDebug("updateFeeFromASI Function: ASI Field = " + ASIField + "; Fee Code = " + FeeCode + "; Fee Schedule: " + FeeSchedule);

	if (arguments.length == 3) FeeSchedule = arguments[2];	// Fee Scheulde for Fee Code
	
	//Check to see if the ASI Field has a value. If so, then check to see if the fee exists.
	if (tmpASIQty > 0) {
		logDebug("ASI Field: " + ASIField + " was found and has a positive value. Attempting to update fee information.");
		updateFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"N");
	}

	else {
		logDebug("ASI Field: " + ASIField + " is not found or has a value <= 0.")
		if (feeExists(FeeCode)) {
			//Fee is found and should be voided or removed.
			voidRemoveFees(FeeCode)
		}
	}
}

function relayPaymentReceiveAfter() {
    aa.print("Enter relayPaymentReceiveAfter()");    
    aa.print("");

    //BUSA16-00017
    //DUB16-00000-0002O
    //Licenses/Business/General/Application
    //aa.fee.isFullPaid4Renewal(capID)
    
    aa.print("Begin Globals");
    for (variableIndex in this) {
        var variable = this[variableIndex];
        if (typeof variable != "function") {
            aa.print(variableIndex + ":" + variable)
        }
    }
    aa.print("End Globals");
    aa.print("");

    //Echo the environment variables
    aa.print("Begin Environment Variables");
    var paramValues = aa.env.getParamValues();
    var keys = paramValues.keys();
    while (keys.hasNext()) {
        var key = keys.next();
        var value = paramValues.get(key);
        aa.print(key + ":" + value);
    }
    aa.print("End Environment Variables");
    aa.print("");

    var capId = getCapId();
    aa.print("capId: " + capId);

    //Construct the transaction model that we'll be sending ot the REST endpoint
    var transactionModel = {
        "capId": capId,
        "eventDate" : aa.util.now()
    };

    //Add the environment variables
    keys = paramValues.keys();
    while (keys.hasNext()) {
        var key = keys.next();        
        var value = paramValues.get(key);
        transactionModel[key] = value;        
    }

    //Get the fee schedule
    var getFeeScheduleByCapIDScriptResult = aa.finance.getFeeScheduleByCapID(capId);
    if (getFeeScheduleByCapIDScriptResult.getSuccess()) {
        transactionModel.feeSchedule = getFeeScheduleByCapIDScriptResult.getOutput();
    } else {
        aa.print(getFeeScheduleByCapIDScriptResult.getErrorMessage());
    }

    //Get the payment items
    var getPaymentByCapIDScriptResult = aa.finance.getPaymentByCapID(capId, null);
    if (getPaymentByCapIDScriptResult.getSuccess()) {
        transactionModel.paymentItems = getPaymentByCapIDScriptResult.getOutput();
    } else {
        aa.print(getPaymentByCapIDScriptResult.getErrorMessage());
    }

    //Get the payment fee items
    var getPaymentFeeItemsScriptResult = aa.finance.getPaymentFeeItems(capId, null);
    if (getPaymentFeeItemsScriptResult.getSuccess()) {
        transactionModel.paymentFeeItems = [];
        var paymentFeeItems = getPaymentFeeItemsScriptResult.getOutput();
        for (paymentFeeItemIndex in paymentFeeItems) {
            var paymentFeeItem = paymentFeeItems[paymentFeeItemIndex];            
            transactionModel.paymentFeeItems.push(paymentFeeItem);            
        }
    } else {
        aa.print(getPaymentFeeItemsScriptResult.getErrorMessage());
    }

    //Get the fee items
    var getFeeItemByCapIDScriptResult = aa.finance.getFeeItemByCapID(capId);
    if (getFeeItemByCapIDScriptResult.getSuccess()) {
        transactionModel.feeItems = getFeeItemByCapIDScriptResult.getOutput();
    } else {
        aa.print(getFeeItemByCapIDScriptResult.getErrorMessage());
    }

    //Create an instance of the ObjectMapper that we'll be using for serialization
    var objectMapper = new org.codehaus.jackson.map.ObjectMapper();   

    aa.print("transactionModel: " + objectMapper.writeValueAsString(transactionModel));

    aa.env.setValue("ScriptReturnCode", "0");
    aa.env.setValue("ScriptReturnMessage", "relayPaymentReceiveAfter()");

    aa.print("");
    aa.print("Exit relayPaymentReceiveAfter()");
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














