// @input SceneObject parent

var previousIdx = 0;
var count = script.parent.getChildrenCount();

function enableByIndex(idx) {
    var count = script.parent.getChildrenCount();
    if(idx >= count){
        idx = 0;
    }else if(idx < 0){
        idx = count - 1;
    }    
    
    
    print(idx);
    // debounce
    if (idx === previousIdx) {
        return;
    }
    for (var i = 0; i < script.parent.getChildrenCount(); i++) {
        script.parent.getChild(i).enabled = i === idx;
    }
    previousIdx = idx;
}



/**
 *force next carousel item
 */
script.api.next = function() {
    print('Next');
    enableByIndex(previousIdx + 1);
};
/**
 * force previous carousel item
 */
script.api.previous = function() {
    print('Previous');
    enableByIndex(previousIdx - 1);
};