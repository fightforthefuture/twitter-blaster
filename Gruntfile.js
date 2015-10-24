module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
        js : {
            src : [
                'js_frontend/library/composer-1.1.9.min.js',
                'js_frontend/library/util.js',
                'js_frontend/controllers/_base_modal.js',
		'js_frontend/controllers/_base_share_modal.js',
                'js_frontend/controllers/_org_referral.js',
                'js_frontend/controllers/**/*.js',
                'js_frontend/models/*.js',
                'js_frontend/views/**/*.js',
                'js_frontend/main.js',
            ],
            dest : 'public/js/main.min.js'
        }
    },
    uglify : {
        js: {
            files: {
                'public/js/main.min.js' : [ 'public/js/main.min.js' ]
            }
        }
    },
    /*
    less: {
      development: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
          "css/site.css": "css/less/site.less"
        }
      }
    },
    */
    watch: {
      /*
      styles: {
        files: [
          'css/less/*.less',
        ], // which files to watch
        tasks: [
          'less'
        ],
        options: {
          nospawn: true,
          debounceDelay: 250
        }
      },
      */
      scripts: {
        files: [
          'js_frontend/library/util.js',
          'js_frontend/main.js',
          'js_frontend/controllers/**/*.js',
          'js_frontend/models/*.js',
          'js_frontend/views/**/*.js'
        ],
        tasks: [
          'concat', 'uglify'
        ],
        options: {
          nospawn: true,
          debounceDelay: 250
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['watch']);
};
