(function () {
    var BO = window.BO || {};

    // stub WSocketWrapper and WSocketEvent
    BO.WSocketEvent = {
        CONNECTED: "",
        MESSAGE: "",
        CLOSE: ""
    };

    BO.WSocketWrapper = function () {};
    BO.WSocketWrapper.prototype = {
        addEventListener: function () {}
    };
    
    // stube GeneratorEvent and GeneratorBase
    BO.generators = {};

    BO.generators.GeneratorEvent = {
        UPDATE: "update"
    };

    BO.generators.GeneratorBase = function () {};
    BO.generators.GeneratorBase.prototype = {
        addEventListener: function () {},
        removeEventListener: function () {}
    };
})();
