const hasNonDeletedFlag = { $elemMatch: { deleted: { $ne: true } } }

export const applyFlagFilter = (query, flag, field = 'flags') => {
  if (flag === 'FLAGGED') {
    query[field] = hasNonDeletedFlag
  } else if (flag === 'NOT_FLAGGED') {
    query[field] = { $not: hasNonDeletedFlag }
  } else {
    // Skip when flag is 'ALL'/absent or an unknown value
  }
}
