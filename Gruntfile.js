module.exports = function (grunt) {  
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);  

    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    
		// Project configuration.  
    grunt.initConfig({  
        pkg: grunt.file.readJSON('package.json'), 

		// configure jshint to validate js files -----------------------------------
		jshint: {
			options: {
				esversion: 6,
				reporter: require('jshint-stylish'), // use jshint-stylish to make our errors look and read good
				ignores: 'js/libs/*.js'
			},

			// when this task is run, lint the Gruntfile and all js files in src
			build: ['Gruntfile.js', 'js/**/*.js']
		},
		
    cssmin: {  
			options: { 
					compress: true,
					keepSpecialComments: 0,
					banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n* /\n'  
			},  
			
			build: {
				files: {  
					'dist/css/style-editor.min.css': 'dist/css/style-editor.css'
				}  
			}
        },

		// compile less stylesheets to css -----------------------------------------
		less: {
			options: {  
					//banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n'
			},
			build: {
				files: {
				 'dist/css/style-editor.css': [
					 'less/style-editor.less'
				 ]
				}
			}
		},

		concat: {
		    options: {
		      separator: ';',
		    },
		    release: {
		      src: [
		      	'js/**/*.js'
					],
		      dest: 'dist/js/style-editor.js',
		    }
		},

		uglify: {  
      options: {  
        compress: true,
				banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n',
				// jshintrc: './.jshintrc'
      },
			build: {
				files: {
					'dist/js/style-editor.min.js': [
						'dist/js/style-editor.js'
					]
				}
			}
        },
				
		// configure watch to auto update ----------------
		watch: {
			// for stylesheets, watch css and less files only run less and cssmin 
			stylesheets: { 
				files: ['src/less/**/*.less'], 
				tasks: ['less', 'cssmin']
			},
			// for scripts, run jshint and uglify 
			scripts: { 
				files: ['src/js/**/*.js'], 
				tasks: ['jshint', 'concat', 'uglify', 'copy'] 
			} 
		},
		
    });  
		
  // Default task.  
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'less', 'cssmin']);

	grunt.registerTask('debug', ['jshint', 'less']);

  grunt.registerTask('release', ['jshint', 'concat', 'uglify', 'less', 'cssmin']);

	grunt.registerTask('build-watch', ['jshint', 'concat', 'uglify', 'less', 'cssmin', 'watch']);  
};