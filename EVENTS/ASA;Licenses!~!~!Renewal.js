/*===================================================================
// Standard Choices Item Name: ASA;Licenses!~!~!Renewal
===================================================================*/

/*===================================================================
//ID: 
//Name: 
//Developer: 
//Developer Agency: 
//Script Description: 

010 - true ^ aa.runScript("APPLICATIONSUBMITAFTER4RENEW");

===================================================================*/

/*===================================================================
//ID: 
//Name: 
//Developer: 
//Developer Agency: 
//Script Description: 

020 - true ^ aa.cap.updateAccessByACA(capId,"Y");

===================================================================*/

/*===================================================================
//ID: 34
//Name: Renewal - Assess Delinquency Fees
//Developer: Chris Godwin
//Developer Agency: Woolpert
//Script Description: If a license has been expired for more than 30 days then delinquency fees will begin to be charged according to the table below: □ Up to 30 days after expiration = 20% of License Fee □ Up to 60 days after expiration = 30% of License fee □ Up to 90 days after expiration = 40% of Lic fee □ Up to 120 days after expiration = 50% of Lic fee	® Max fee = 50% of original License fee

030 - true ^ calculateLicRenewalPenaltyFee();

===================================================================*/