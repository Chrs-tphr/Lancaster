/*===================================================================
// Standard Choices Item Name: ASA;Licenses!~!~!Application
===================================================================*/

/*===================================================================
//ID: 40
//Name: Employees not legal to work in US
//Developer: Chris Godwin
//Developer Agency: Woolpert
//Script Description: When ASI Field "Are all employees/ Owners legal to work in US?" is marked "No" then stop application from being submitted

010 - matches(AInfo["Are all Employees/Owners legal to work in the U.S.?"], "No", "N"); ^ showMessage = true; comment("Business Applications including illegal workers/owners are not allowed."); cancel = true;

===================================================================*/

