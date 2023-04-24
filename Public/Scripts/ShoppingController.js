// ShoppingController.js
// Version: 0.1.0
// Event: Lens Initialized
// Description: This script enables and disables object based on
// `onProductStateUpdate`. In other words, the objects will
// be switched when the user moves the product card in a Shopping Lens.
//
// Learn more at: https://docs.snap.com/lens-studio/references/templates/shopping/surface-objects

// @input Asset.ShoppingModule shoppingModule
// @input string domain

// @ui {"widget":"separator"}
// @ui {"widget":"group_start", "label":"State 0"}
// @input string state0name
// @input bool state0useTrigger = false {"label" : "Use Trigger"}
// @input string state0Trigger {"showIf" : "state0useTrigger","label" : "Custom Trigger"}
// @input SceneObject[] state0objects
// @ui {"widget":"group_end"}

// @ui {"widget":"group_start", "label":"State 1"}
// @input string state1name
// @input bool state1useTrigger = false {"label" : "Use Trigger"}
// @input string state1Trigger {"showIf" : "state1useTrigger","label" : "Custom Trigger"}
// @input SceneObject[] state1objects
// @ui {"widget":"group_end"}

// @ui {"widget":"group_start", "label":"State 2"}
// @input string state2name
// @input bool state2useTrigger = false {"label" : "Use Trigger"}
// @input string state2Trigger {"showIf" : "state2useTrigger","label" : "Custom Trigger"}
// @input SceneObject[] state2objects
// @ui {"widget":"group_end"}


// @ui {"widget":"group_start", "label":"State 3"}
// @input string state3name
// @input bool state3useTrigger = false {"label" : "Use Trigger"}
// @input string state3Trigger {"showIf" : "state3useTrigger","label" : "Custom Trigger"}
// @input SceneObject[] state3objects
// @ui {"widget":"group_end"}


// @ui {"widget":"group_start", "label":"State 4"}
// @input string state4name
// @input bool state4useTrigger = false {"label" : "Use Trigger"}
// @input string state4Trigger {"showIf" : "state4useTrigger","label" : "Custom Trigger"}
// @input SceneObject[] state4objects
// @ui {"widget":"group_end"}



const NUM_STATE_INPUTS = 5;

if (!script.domain) {
    print("ERROR: domain must be set");
    return;
}

var stateNames = [];
var statesArray = [];
var stateMap = {};
var stateTrigger = {};

// HELPERS //
function setupStateObjectRelationship() {
    var shoppingModuleValidator = new ShoppingModuleValidator(script.shoppingModule);
    
    for (var i = 0; i < NUM_STATE_INPUTS; i++) { 
        var name = script["state" + i + "name"];
        var objects = script["state" + i + "objects"];
        var useTrigger = script["state" + i + "useTrigger"];
        var triggerName = script["state" + i + "Trigger"];
        
        if (
            !name
            || !shoppingModuleValidator.domainStateExists(script.domain, name)        
        ) {
            return;
        }
        
        if (objects) {
            stateNames.push(name);
            statesArray.push(objects);
            stateMap[name] = objects;
        }
        
        if (useTrigger) {
            stateTrigger[name] = triggerName;
        } else {
            stateTrigger[name] = null;
        }
    }
}

function hideAll() {
    statesArray.forEach(function(sceneObjs) {
        sceneObjs.forEach(function(sceneObj) {
            if (sceneObj) {
                sceneObj.enabled = false;
            } else {
                print("Warning: make sure your 3D objects are listed in the ShoppingController.");
            }
        });
    });
}

function showScene(sceneObjs) {
    sceneObjs.forEach(function(sceneObj) {
        if (sceneObj) {
            sceneObj.enabled = true;
        } else {
            print("Warning: make sure your 3D objects are listed in the ShoppingController.");
        }
        
    });
}

// SHOPPING MODULE //
function productStateChangeHandler(eventData) {
    try {
        var stateUpdateMessage = JSON.parse(eventData);
        
        if (!stateUpdateMessage) {
            print("ERROR: Unable to parse event data: " + eventData);
        }
        
        hideAll();
        
        for (var i = 0; i < stateUpdateMessage.currentSelectionState.length; i++) {
            var selection = stateUpdateMessage.currentSelectionState[i];
            if (selection.domainKey == script.domain) {
                    
                var triggerName = stateTrigger[selection.stateKey];
                if (triggerName && global.behaviorSystem) {
                    global.behaviorSystem.sendCustomTrigger(triggerName);        
                }
                 

                var sceneObjs = stateMap[selection.stateKey];
                if (sceneObjs) {
                    showScene(sceneObjs);
                }
            }
        }
    } catch (e) {
        print(e); 
    }
    
}

// TEST ON TAP SIMULATION //
var currentTestState = 0;

function testHandler(stateName) {
    var message = {
        "currentSelectionState": [
            {
                "domainKey": script.domain, 
                "stateKey": stateName
            }        
        ]
    };
    var stringifiedMessage = JSON.stringify(message);
    
    print("Testing state " + stringifiedMessage);
    productStateChangeHandler(stringifiedMessage);
}

function chooseNextProduct() {
    if (script.shoppingModule.domains.length > 0) {
        var testStates = script.shoppingModule.domains[0].states;
        var stateName = testStates[currentTestState].name;
        currentTestState = (currentTestState + 1) % testStates.length;
        
        testHandler(stateName);    
    }
}

function simulateProductStateChangeOnTap() {
    script.createEvent("TapEvent").bind(chooseNextProduct);
}

// HELPERS //

// Collects all states in a module, and provides API to check whether
// a given state exists within a given domain
function ShoppingModuleValidator(module) {
    var moduleStateNames = {};
    
    function init() {
        collectStates();    
    }
    
    function collectStates() {
        for (var k in module.domains) {
            var domain = script.shoppingModule.domains[k];
            var domainName = domain.name;
            moduleStateNames[domainName] = [];
            
            for (var j in domain.states) {
                var state = domain.states[j];
                var stateName = state.name;
                
                moduleStateNames[domainName].push(stateName);
            }
        }
    }
    
    function displayIssue(missingState) {
        if (global.deviceInfoSystem.isMobile()) {
            throw "WARNING: Mismatch between shopping module and Shopping Controller on: " + missingState;
        } else {
            print("╔═════════════════════════════════════════════════════════════════════════");
            print("║ WARNING: Mismatch between Shopping Module and Shopping Controller on: ");
            print("║ > " + missingState);
            print("║");
            print("║ Ensure states in Shopping Controller matches states in Shopping Module!");
            print("║ (!) This will throw error on device.");
            print("╚═════════════════════════════════════════════════════════════════════════");
        }
    }
    
    this.domainStateExists = function(domainName, stateName) {
        if (moduleStateNames[domainName]) {
            var statesInDomain = moduleStateNames[domainName];
            var exists = statesInDomain.indexOf(stateName) >= 0;
            
            if (!exists) {
                displayIssue("Domain: " + domainName + "\t State: " + stateName);
            }
            
            return exists;
        }
        
        return false;
    };

    init();
    return this;
}

// START LENS! //
function init() {
    setupStateObjectRelationship();
    hideAll();
    
    if (global.deviceInfoSystem.isEditor()) {
        print("Note: Lens is running in Lens Studio and will not call server.");
        print("Tip: Simulate changing product cards by tapping on the Preview panel.");
        
        simulateProductStateChangeOnTap();
    }
        
    script.shoppingModule.onProductStateUpdate.add(productStateChangeHandler);
    
    chooseNextProduct();
}

init();