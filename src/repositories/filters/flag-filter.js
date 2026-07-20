const hasNonDeletedFlag = { $elemMatch: { deleted: { $ne: true } } }

export const applyFlagFilter = (query, flag) => {
  // Skip when flag is 'ALL'/absent or an unknown value
  if (flag === 'FLAGGED') {
    query.flags = hasNonDeletedFlag
  } else if (flag === 'NOT_FLAGGED') {
    query.flags = { $not: hasNonDeletedFlag }
  }
}
