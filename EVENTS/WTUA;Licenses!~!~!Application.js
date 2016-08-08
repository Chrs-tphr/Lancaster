/*===================================================================
// Standard Choices Item Name:  WTUA;Licenses!~!~!Application
===================================================================*/

/*===================================================================
// ID: 29
// Name: Zero Balance Fee Check
// Developer: Chris Godwin
// Developer Agency: Woolpert
// Script Description: When a status of Issued is applied to workflow tasks License Issuance; then check balance for all assessed and invoiced fees. If balance is greater zero then do not allow the status of Issued to be submitted.

010 - (wfTask == "License Issuance" && wfStatus == "Issued" && (balanceDue > 0 || feeTotalByStatus("NEW") > 0)) ^ showMessage = true; comment("The record has a $"+balanceDue+" balance which must be paid before it can be issued.");cancel = true;

===================================================================*/

/*===================================================================
//ID: 
//Name: 
//Developer: Chris Godwin
//Developer Agency: Woolpert
//Script Description: 
===================================================================*/
