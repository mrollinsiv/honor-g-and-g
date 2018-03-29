module.exports = function(grunt) {
  // Do grunt-related things in here
  grunt.initConfig({
    nunjucks: {
      precompile: {
        baseDir: 'views/',
        src: 'views/*',
        dest: 'web/assets/dist/js/templates.js',
        options: {
          name: function(filename) {
            return 'foo/' + filename;
          }
        }
      }
    },
    uglify: {
      my_target: {
        options: {
          sourceMap: true,
          sourceMapName: 'web/assets/dist/js/sourcemap.map'
        },
        files: {
          'web/assets/dist/js/main.min.js': ['web/assets/dist/js/main.js']
        }
      }
    },
    browserify: {
      dist: {
        files: {
          // destination for transpiled js : source js
          'web/assets/dist/js/main.js': 'web/assets/src/js/main.js',
        },
        options: {
          transform: [['babelify', { presets: "es2015" }]],
          browserifyOptions: {
            debug: true
          }
        }
      }
    },
    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'web/assets/dist/css/main.css': 'web/assets/src/css/main.scss'
        }
      }
    },
    copy: {
      main: {
        expand: true,
        cwd: 'web/assets/src/fonts',
        src: '**',
        dest: 'web/assets/dist/fonts',
      },
      images: {
        expand: true,
        cwd: 'web/assets/src/images',
        src: '**',
        dest: 'web/assets/dist/images',
      }
    },
    watch: {
      nunjucks: {
        files: 'views/*',
        tasks: ['nunjucks']
      },
      browserify: {
        files: ['web/assets/src/js/*.js'],
        tasks: ['browserify']
      },
      sass: {
        files: 'web/assets/src/css/*.scss',
        tasks: ['sass']
      }
    }
  });

  grunt.loadNpmTasks('grunt-nunjucks');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-sass');

  grunt.registerTask('default', ['nunjucks', 'browserify', 'uglify', 'sass', 'copy']);
};