/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2012
|
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be 
|	    available to all master scripts
|
| Notes   :
|
/------------------------------------------------------------------------------------------------------*/

eval( aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput().getScriptByPK(aa.getServiceProviderCode(),"INCLUDES_CUSTOM","ADMIN").getScriptText() + "");

function relayPaymentApplyAfter(){
    logDebug("Enter relayPaymentApplyAfter()");
    logDebug("");

    //BUSA16-00017
    //DUB16-00000-0002O
    //Licenses/Business/General/Application

    for (variableIndex in this) {
        var variable = this[variableIndex];
        if (typeof variable != "function") {
            logDebug(variableIndex + ":" + variable)
        }
    }

    //Echo the environment variables
    var paramValues = aa.env.getParamValues();
    var keys = paramValues.keys();
    while (keys.hasNext()) {
        var key = keys.next();
        var value = paramValues.get(key);
        logDebug(key + ":" + value);
    }
    
    //Declare local variables that reference the global variables    
    var paymentSequenceNumber = paySeq;
    var capId = capid;
    logDebug("capId: " + capId);

    //Construct the transaction model that we'll be sending ot the REST endpoint
    var transactionModel = {
        "capId": capId,
        "eventDate": aa.util.now()
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
    if(getFeeScheduleByCapIDScriptResult.getSuccess()){
        transactionModel.feeSchedule = getFeeScheduleByCapIDScriptResult.getOutput();
    } else {
        logDebug(getFeeScheduleByCapIDScriptResult.getErrorMessage());
    }

    //Get the payment
    var getPaymentByPKScriptResult = aa.finance.getPaymentByPK(capId, paymentSequenceNumber, currentUserID);
    if(getPaymentByPKScriptResult.getSuccess()){
        transactionModel.payment = getPaymentByPKScriptResult.getOutput();
    } else {
        logDebug(getPaymentByPKScriptResult.getErrorMessage());
    }

    //Get the payment fee items
    var getPaymentFeeItemsScriptResult = aa.finance.getPaymentFeeItems(capId, null);
    if(getPaymentFeeItemsScriptResult.getSuccess()){
        transactionModel.paymentFeeItems = [];
        var paymentFeeItems = getPaymentFeeItemsScriptResult.getOutput();
        for(paymentFeeItemIndex in paymentFeeItems){
            var paymentFeeItem = paymentFeeItems[paymentFeeItemIndex];
            if(paymentFeeItem.getPaymentSeqNbr() == paymentSequenceNumber){
                transactionModel.paymentFeeItems.push(paymentFeeItem);
            }
        }
    } else {
        logDebug(getPaymentFeeItemsScriptResult.getErrorMessage());
    }

    //Get the fee items
    var getFeeItemByCapIDScriptResult = aa.finance.getFeeItemByCapID(capId);
    if (getFeeItemByCapIDScriptResult.getSuccess()) {
        transactionModel.feeItems = getFeeItemByCapIDScriptResult.getOutput();
    } else {
        logDebug(getFeeItemByCapIDScriptResult.getErrorMessage());
    }

    //Create an instance of the ObjectMapper that we'll be using for serialization
    var objectMapper = new org.codehaus.jackson.map.ObjectMapper();   

    logDebug("transactionModel: " + objectMapper.writeValueAsString(transactionModel));

    aa.env.setValue("ScriptReturnCode", "0");
    aa.env.setValue("ScriptReturnMessage", "relayPaymentReceiveAfter()");

    logDebug("");
    logDebug("Exit relayPaymentApplyAfter()");    
}

function relayPaymentRefundAfter(){
    logDebug("Enter relayPaymentRefundAfter()");
    logDebug("");

    //BUSA16-00017
    //DUB16-00000-0002O
    //Licenses/Business/General/Application

    for (variableIndex in this) {
        var variable = this[variableIndex];
        if (typeof variable != "function") {
            logDebug(variableIndex + ":" + variable)
        }
    }

    //Echo the environment variables
    var paramValues = aa.env.getParamValues();    
    var keys = paramValues.keys();
    while (keys.hasNext()) {
        var key = keys.next();
        var value = paramValues.get(key);
        logDebug(key + ":" + value);
    }
    
    //Declare local variables that reference the global variables    
    var capId = capid;
    logDebug("capId: " + capId);

    //Construct the transaction model that we'll be sending ot the REST endpoint
    var transactionModel = {
        capId: capid,
        "eventDate": aa.util.now()
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
        logDebug(getFeeScheduleByCapIDScriptResult.getErrorMessage());
    }

    //Get the fee items
    var getFeeItemByCapIDScriptResult = aa.finance.getFeeItemByCapID(capId);
    if (getFeeItemByCapIDScriptResult.getSuccess()) {
        transactionModel.feeItems = getFeeItemByCapIDScriptResult.getOutput();
    } else {
        logDebug(getFeeItemByCapIDScriptResult.getErrorMessage());
    }

    //Get the payment items
    var getPaymentByCapIDScriptResult = aa.finance.getPaymentByCapID(capId, null);
    if (getPaymentByCapIDScriptResult.getSuccess()) {
        transactionModel.paymentItems = getPaymentByCapIDScriptResult.getOutput();
    } else {
        logDebug(getPaymentByCapIDScriptResult.getErrorMessage());
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
        logDebug(getPaymentFeeItemsScriptResult.getErrorMessage());
    }

    //Create an instance of the ObjectMapper that we'll be using for serialization
    var objectMapper = new org.codehaus.jackson.map.ObjectMapper();   

    logDebug("transactionModel: " + objectMapper.writeValueAsString(transactionModel));

    aa.env.setValue("ScriptReturnCode", "0");
    aa.env.setValue("ScriptReturnMessage", "relayPaymentReceiveAfter()");

    logDebug("");
    logDebug("Exit relayPaymentRefundAfter()");
}