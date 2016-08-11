/*===================================================================
// Standard Choices Item Name:  WTUA;Licenses!~!~!Application
===================================================================*/

/*===================================================================
// ID: 29
// Name: Zero Balance Fee Check
// Developer: Chris Godwin
// Developer Agency: Woolpert
// Script Description: When a status of Issued is applied to workflow tasks License Issuance; then check balance for all assessed and invoiced fees. If balance is greater zero then do not allow the status of Issued to be submitted.
// Status: Active

010 - (wfTask == "License Issuance" && wfStatus == "Issued" && (balanceDue > 0 || feeTotalByStatus("NEW") > 0)) ^ showMessage = true; comment("The record has an outstanding balance which must be paid before it can be issued or fees that have not been invoiced."); cancel = true;

===================================================================*/

/*===================================================================
// ID: 
// Name: 
// Developer: 
// Developer Agency: 
// Script Description: 
// Status: Disabled

020 - wfTask == "License Issuance" && wfStatus == "Issued" ^ branch("LIC Establish Links to Reference Contacts");

===================================================================*/

/*===================================================================
// ID: 
// Name: 
// Developer: 
// Developer Agency: 
// Script Description: 
// Status: Disabled

030 - wfTask == "License Issuance" && wfStatus == "Issued" ^ branch("LIC Issue Business License");

===================================================================*/

