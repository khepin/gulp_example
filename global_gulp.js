#!/usr/bin/env node

'use strict';
var gutil = require('gulp-util');
var prettyTime = require('pretty-hrtime');
var chalk = require('chalk');
var semver = require('semver');
var archy = require('archy');
var Liftoff = require('liftoff');
var taskTree = require('../lib/taskTree');

var cli = new Liftoff({
  name: 'gulp',
  completions: require('../lib/completion')
});

cli.on('require', function (name) {
  gutil.log('Requiring external module', chalk.magenta(name));
});

cli.on('requireFail', function (name) {
  gutil.log(chalk.red('Failed to load external module'), chalk.magenta(name));
});

cli.launch(handleArguments);

function handleArguments(env) {

  var argv = env.argv;
  var cliPackage = require('../package');
  var versionFlag = argv.v || argv.version;
  var tasksFlag = argv.T || argv.tasks;
  var tasks = argv._;
  var toRun = tasks.length ? tasks : ['default'];

  if (versionFlag) {
    gutil.log('CLI version', cliPackage.version);
    if (env.localPackage) {
      gutil.log('Local version', env.modulePackage.version);
    }
    process.exit(0);
  }

  /***********************************************
   *
   * Here I removed local vs global version checking
   * for the purpose of this demo
   *
   ***********************************************/

  if (!env.configPath) {
    gutil.log(chalk.red('No gulpfile found'));
    process.exit(1);
  }

  var gulpFile = require(env.configPath);
  gutil.log('Using gulpfile', chalk.magenta(env.configPath));

  /***********************************************
   *
   * Here I fall back to getting gulp from wherever it
   * is installed if I didn't find it locally.
   *
   ***********************************************/
  var gulpInst;
  try {
    gulpInst = require(env.modulePath);
  } catch(e) {
    gulpInst = require('gulp');
  }
  logEvents(gulpInst);

  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    gutil.log('Working directory changed to', chalk.magenta(env.cwd));
  }

  process.nextTick(function () {
    if (tasksFlag) {
      return logTasks(gulpFile, gulpInst);
    }
    gulpInst.start.apply(gulpInst, toRun);
  });
}

function logTasks(gulpFile, localGulp) {
  var tree = taskTree(localGulp.tasks);
  tree.label = 'Tasks for ' + chalk.magenta(gulpFile);
  archy(tree).split('\n').forEach(function (v) {
    if (v.trim().length === 0) return;
    gutil.log(v);
  });
}

// format orchestrator errors
function formatError(e) {
  if (!e.err) return e.message;
  if (e.err.message) return e.err.message;
  return JSON.stringify(e.err);
}

// wire up logging events
function logEvents(gulpInst) {
  gulpInst.on('task_start', function (e) {
    gutil.log('Starting', "'" + chalk.cyan(e.task) + "'...");
  });

  gulpInst.on('task_stop', function (e) {
    var time = prettyTime(e.hrDuration);
    gutil.log('Finished', "'" + chalk.cyan(e.task) + "'", 'after', chalk.magenta(time));
  });

  gulpInst.on('task_err', function (e) {
    var msg = formatError(e);
    var time = prettyTime(e.hrDuration);
    gutil.log("'" + chalk.cyan(e.task) + "'", 'errored after', chalk.magenta(time), chalk.red(msg));
  });

  gulpInst.on('task_not_found', function (err) {
    gutil.log(chalk.red("Task '" + err.task + "' was not defined in your gulpfile but you tried to run it."));
    gutil.log('Please check the documentation for proper gulpfile formatting.');
    process.exit(1);
  });
}
