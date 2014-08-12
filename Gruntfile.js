module.exports = function(grunt) {

  // Configuration.
  grunt.initConfig({
    // Run nodemon and watch at the same time in one terminal tab.
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true 
        }
      } 
    },
    jshint: {
      server: ['**/*.js', '!node_modules/**/*.js'],
      options: {
        node: true,
        loopfunc: true
      }
    },
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
        }
      } 
    },
    watch: {
      files: '<%= jshint.server %>',
      tasks: ['jshint']
    }
  });

  // Load tasks.
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  // Default task
  grunt.registerTask('default', ['concurrent']);
  grunt.registerTask('serve', ['concurrent']);

};
