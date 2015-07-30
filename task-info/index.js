'use strict';

var assign = require('lodash/object/assign');
var flatten = require('lodash/array/flatten');
var gutil = require('gulp-util');
var lang = require('lodash/lang');
var util = require('util');
var helpers = require('../lib/helpers');

var _widths;
var _parsedTasks;
var _tasks;

module.exports = function (gulp) {
  var help = {
    cliHelp: cliHelp,
    taskTree: taskTree
  };

  return help;

  function parseTasks(gulpTasks) {
    _widths = {
      main: 0,
      sub: 0
    };
    _parsedTasks = {};

    var tasks = Object.keys(gulpTasks).map(function (taskName) {
        var task = _parseTask(gulpTasks[taskName]);

        _parsedTasks[taskName] = task;
        return task;
      }).sort(function (a, b) {
        return (a.priority ? -a.priority : 0) - (b.priority ? -b.priority : 0);
      });

    tasks.forEach(function (task) {
      task.inheritedOptionalOptions =  _traverseOptionalOptions(task);
      task.fullOptionalOptions = assign({}, task.inheritedOptionalOptions,
        task.options
      );

    });
    _tasks = tasks;
    return tasks;
  }

  function taskTree() {
    return _tasks ? _tasks : parseTasks(gulp.tasks);
  }

  function cliHelp(env) {
    var tasks = _tasks ? _tasks : parseTasks(gulp.tasks);
    var list = [];
    var baseColor = gutil.colors.cyan;
    var subColor = gutil.colors.yellow;
    var bold = gutil.colors.bold;

    list.push(bold('Usage'));
    list.push(util.format('  gulp %s [ %s ]', baseColor('task'), subColor(
      'option ...')));

    list.push(bold('Tasks'));

    tasks.filter(function (task) {
        return task.description;
      })
      .forEach(function (task) {
        list.push(util.format('  %s : %s', baseColor(helpers.padRight(task.name,
          _widths.main +
          2)), task.description));

        if (helpers.isObject(task.fullOptionalOptions)) {
          Object.keys(task.fullOptionalOptions)
            .forEach(function (option) {
              list.push(util.format('    %s : %s ', subColor(
                helpers.padRight(option,
                  _widths.sub +
                  2)), task.fullOptionalOptions[
                option]));
            });
        }
      });

    if (env.a || env.all) {
      list.push('\n');
      list.push(bold('Tasks without description'));
      tasks.filter(function (task) {
          return !task.description;
        })
        .forEach(function (task) {
          list.push(util.format('  %s', baseColor(helpers.padRight(task.name,
            _widths.main +
            2))));

          if (helpers.isObject(task.fullOptionalOptions)) {
            Object.keys(task.fullOptionalOptions)
              .forEach(function (option) {
                list.push(util.format('    %s : %s ', subColor(
                  helpers.padRight(option,
                    _widths.sub +
                    2)), task.fullOptionalOptions[
                  option]));
              });
          }
        });
    }
    return list.join('\n');
  }
};

function _parseTask(task) {
  return lang.cloneDeep(task, function (value) {

    if (helpers.isObject(value)) {
      if (typeof value.description === 'string') {
        _widths.main = _widths.main < value.name.length ?
          value.name.length :
          _widths.main;
      }
      if (helpers.isObject(value.options)) {
        value.optionalOptions = assign.apply(null, [{}]
          .concat(Object.keys(value.options)
            .filter(function (option) {

              _widths.sub = _widths.sub < option.length ?
                option.length :
                _widths.sub;

              return option !== '';
            })
            .map(function (option) {
              var helpOption = {};
              helpOption[option] = value.options[option];
              return helpOption;
            })));
      }
    }

    return value;
  });
}

function _traverseOptionalOptions(task) {
  var optionalOptions = {};

  if (task.description) {
    var allDeps = [];

    if (task.dep && task.dep.length) {
      allDeps.push(task.dep);
    }
    if (task.seq && task.seq.length) {
      allDeps.push(task.seq);
    }
    if (allDeps.length) {
      var a = flatten(allDeps, true);

      return assign.apply(null, [optionalOptions].concat(a.filter(
          function (
            dep) {
            return _parsedTasks[dep] && _parsedTasks[
              dep].options;
          })
        .map(function (dep) {
          var depTask = _parsedTasks[dep];

          return assign({}, depTask.options,
            _traverseOptionalOptions(
              depTask));
        })));
    }
  }

  return optionalOptions;
}