/*===================================================================
// Standard Choices Item Name:  WTUA;Licenses!~!~!Renewal
===================================================================*/

/*===================================================================
// ID: 
// Name: Zero Balance Fee Check
// Developer: Chris Godwin
// Developer Agency: Woolpert
// Script Description: When a status of Renewed is applied to workflow task License Issuance then check balance for all assessed and invoiced fees. If balance is greater zero then do not allow the wf task status of Renewed to be submitted.

010 - (wfTask == "License Issuance" && wfStatus == "Renewed" && (balanceDue > 0 || feeTotalByStatus("NEW") > 0)) ^ showMessage = true; comment("The record has an outstanding balance which must be paid before it can be issued or fees that have not been invoiced."); cancel = true;

===================================================================*/
