export const anyIsMissingFrom = (argsObj, reqAry) =>
  !reqAry.reduce((acc, curr) => acc && argsObj.hasOwnProperty(curr), true)

export const specified = argument => typeof argument !== 'undefined'

export const flatten = o =>
  Object.assign(
    {},
    ...(function _flatten(o) {
      return [].concat(
        ...Object.keys(o).map(
          k => (typeof o[k] === 'object' ? _flatten(o[k]) : { [k]: o[k] }),
        ),
      )
    })(o),
  )
