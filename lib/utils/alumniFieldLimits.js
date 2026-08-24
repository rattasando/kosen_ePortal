// Mirrors the @db.VarChar(n) limits declared in prisma/schema.prisma for
// Alumni / AlumniEmploymentHistory. Used by the PUT /api/alumni/[id] route
// to catch "value too long" errors before they reach Prisma/Postgres, so
// admins get a clear field-level message instead of an opaque 500.
//
// Keep in sync with prisma/schema.prisma if column sizes ever change.

export const ALUMNI_VARCHAR_LIMITS = {
  prefix:           20,
  name:            100,
  lastname:        100,
  nameEn:          100,
  lastnameEn:      100,
  nickname:         50,
  major:           100,
  university:      100,
  scholarshipTypeId: 20,
  scholarshipStatus: 50,
  contact:         150,
  phone:            20,
  // remark is unbounded Text — no limit
  // graduatedYear, scholarshipYears are Int — no varchar limit
};

export const EMPLOYMENT_VARCHAR_LIMITS = {
  company:   200,
  position:  100,
  startDate:  10,
  endDate:    10,
  location:  100,
  type:       50,
};

/**
 * Scan `data` for string values that exceed the given field→maxLength map.
 * Returns [{ field, length, max }] for every offending field (empty array if none).
 */
export function findTooLongFields(data, limits) {
  const errors = [];
  if (!data) return errors;
  for (const [field, max] of Object.entries(limits)) {
    const val = data[field];
    if (typeof val === "string" && val.length > max) {
      errors.push({ field, length: val.length, max });
    }
  }
  return errors;
}

/** Human-readable Thai summary for a list of findTooLongFields() results. */
export function describeTooLongFields(errors) {
  return errors
    .map((e) => `${e.field} (${e.length}/${e.max} ตัวอักษร)`)
    .join(", ");
}
