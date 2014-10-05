module.exports = function() {

    return {

        options: {
            eslintrc  : true
        }

    // , gruntfile   : [ 'Gruntfile.js', 'tasks/**/*.js' ]

      , test        : [ 'test/**/*.js' ]

      , src         : [ 'lib/**/*.js' ]

    };

};
