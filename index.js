var isFunction = require('lodash/isFunction')
var isArray = require('lodash/isArray')
var isEmpty = require('lodash/isEmpty')
var isString = require('lodash/isString')
var get = require('lodash/get')
var map = require('lodash/map')

/**
 *
 * @param test
 * @param value
 * @returns {Promise.<T>}
 */
function check (test, value) {
  return Promise.resolve().then(function () {
    return test(value)
  })
}

/**
 *
 * @param getConfig
 * @returns {Function} middleware
 */
function validate (getConfig) {
  return function middleware (req, res, next) {
    var config = isFunction(getConfig) ? getConfig(req) : getConfig
    var errorResponse = {
      message: config.message,
      fields: {}
    }

    function validateField (tests, key) {
      var value = get(req, 'body.' + key)

      tests = isArray(tests)
        ? tests
        : [tests]

      var promises = tests.map(function (test) {
        return check(test, value)
      })

      return Promise.all(promises).catch(function (err) {
        errorResponse.fields[key] = err.message
      })
    }

    var validatorQueue = map(config.schema, validateField)

    function checkValidity () {
      return isEmpty(errorResponse.fields)
        ? next()
        : res.status(config.statusCode).json(errorResponse)
    }

    return Promise.all(validatorQueue).then(checkValidity)
  }
}
/**
 *
 * @param fn
 * @returns {Function}
 */
function trimmed (fn) {
  return function (val) {
    return fn(isString(val) ? val.trim() : val)
  }
}
/**
 *
 * @param message
 */
exports.isRequired = function (message) {
  return trimmed(function (value) {
    if (!Boolean(value)) throw new Error(message)
  })
}
/**
 *
 * @param message
 * @returns {Function}
 */
exports.isString = function (message) {
  return function (str) {
    if (!isString(str)) throw new Error(message)
  }
}

var trivialEmailRegex = /\S+@\S+\.\S+/
/**
 *
 * @param message
 * @returns {Function}
 */
exports.isEmail = function (message) {
  return function (str) {
    if (!trivialEmailRegex.test(str)) throw new Error(message)
  }
}
/**
 *
 * @param len
 * @param message
 */
exports.minLength = function (len, message) {
  return trimmed(function (str) {
    if (str.length < len) throw new Error(message)
  })
}

exports.validate = validate
