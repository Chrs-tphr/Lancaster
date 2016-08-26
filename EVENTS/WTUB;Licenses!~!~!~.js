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
// Notes: 8/23/2016 - Added additional task and status (Application Intake, Accepted)

010 - (matches(wfTask, "Application Intake", "License Issuance") && matches(wfTask, "Accepted", "Issued") && (balanceDue > 0 || feeTotalByStatus("NEW") > 0)) ^ showMessage = true; comment("The record has an outstanding balance which must be paid before it can be issued or fees that have not been invoiced."); cancel = true;

===================================================================*/

